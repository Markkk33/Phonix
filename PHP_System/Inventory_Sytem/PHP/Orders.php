<?php
session_start();
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "inventory_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch all orders with product info
if ((isset($_GET['action']) && $_GET['action'] === 'fetch') || (isset($_POST['action']) && $_POST['action'] === 'fetch')) {
    $sql = "SELECT o.id, o.product_id, o.order_id, o.customer, o.quantity, o.amount, o.payment, o.status, o.created_at, p.name as product, p.image as img FROM orders o JOIN products p ON o.product_id = p.id ORDER BY o.id DESC";
    $result = $conn->query($sql);
    $orders = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Convert image blob to base64 (if not already base64 string)
            if (!empty($row['img'])) {
                if (base64_encode(base64_decode($row['img'], true)) !== $row['img']) {
                    $row['img'] = 'data:image/jpeg;base64,' . base64_encode($row['img']);
                } else {
                    $row['img'] = 'data:image/jpeg;base64,' . $row['img'];
                }
            } else {
                $row['img'] = null;
            }
            $orders[] = $row;
        }
    }
    header('Content-Type: application/json');
    echo json_encode($orders);
    $conn->close();
    exit;
}

// Add new order (POST with action=add)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    $product_id = intval($_POST['product_id'] ?? 0);
    $customer = $_POST['customer'] ?? '';
    $quantity = intval($_POST['quantity'] ?? 0);
    $payment = $_POST['payment'] ?? 'Pending';
    $status = $_POST['status'] ?? 'Processing';
    $success = false;
    $error = '';
    try {
        if ($product_id > 0 && $quantity > 0) {
            // Get product price, stock, and name
            $stmt = $conn->prepare("SELECT price, stock, name FROM products WHERE id = ?");
            $stmt->bind_param("i", $product_id);
            $stmt->execute();
            $stmt->bind_result($price, $stock, $product_name);
            if ($stmt->fetch()) {
                if ($stock >= $quantity) {
                    $amount = $quantity * $price;
                    $stmt->close();
                    // Generate unique order_id
                    $order_id = uniqid('ORD');
                    // Modify order_id to display only numeric part
                    $order_id = intval(substr($order_id, 3));
                    // Insert order
                    $stmt = $conn->prepare("INSERT INTO orders (order_id, product_id, customer, quantity, amount, payment, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
                    $stmt->bind_param("sisiiss", $order_id, $product_id, $customer, $quantity, $amount, $payment, $status);
                    $success = $stmt->execute();
                    $new_order_db_id = $stmt->insert_id;
                    $debug = [
                        'order_insert_success' => $success,
                        'order_insert_error' => $stmt->error,
                        'order_insert_id' => $new_order_db_id,
                        'order_id' => $order_id
                    ];
                    if (!$success) {
                        $error = 'Order insert failed: ' . $stmt->error;
                        echo json_encode(['success' => false, 'error' => $error, 'debug' => $debug]);
                        $stmt->close();
                        $conn->close();
                        exit;
                    }
                    $stmt->close();
                    // Update product stock
                    $stmt = $conn->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
                    $stmt->bind_param("ii", $quantity, $product_id);
                    $stmt->execute();
                    $stmt->close();
                    // Record order add in history (fix: use correct target_id and check for errors)
                    if ($new_order_db_id > 0) {
                        $user = 'Admin';
                        $details = json_encode([
                            'order_id' => $order_id,
                            'product_id' => $product_id,
                            'product_name' => $product_name,
                            'customer' => $customer,
                            'quantity' => $quantity,
                            'amount' => $amount,
                            'payment' => $payment,
                            'status' => $status
                        ]);
                        $hstmt = $conn->prepare("INSERT INTO history (action_type, target_type, target_id, user, details) VALUES (?, ?, ?, ?, ?)");
                        $action_type = 'order_add'; $target_type = 'order';
                        $hstmt->bind_param('ssiss', $action_type, $target_type, $new_order_db_id, $user, $details);
                        $history_success = $hstmt->execute();
                        $history_error = $hstmt->error;
                        $hstmt->close();
                        if (!$history_success) {
                            error_log('Failed to insert order_add history: ' . $history_error);
                            echo json_encode(['success' => false, 'error' => 'Failed to insert order_add history: ' . $history_error, 'debug' => $debug]);
                            $conn->close();
                            exit;
                        }
                        $debug['history_insert_success'] = $history_success;
                        $debug['history_insert_error'] = $history_error;
                        // --- Activity log for new order ---
                        try {
                            $activity_stmt = $conn->prepare("INSERT INTO activity_log (action_type, details) VALUES (?, ?)");
                            $activity_type = 'Order Placed';
                            $activity_details = 'Order ID: ' . $order_id . ', Product: ' . $product_name;
                            $activity_stmt->bind_param('ss', $activity_type, $activity_details);
                            $activity_stmt->execute();
                            $activity_stmt->close();
                        } catch (Exception $e) { /* ignore activity log errors */ }
                    }
                } else {
                    $error = 'Not enough stock.';
                }
            } else {
                $error = 'Product not found.';
            }
        } else {
            $error = 'Invalid product or quantity.';
        }
    } catch (Exception $e) {
        $error = 'Server error: ' . $e->getMessage();
    }
    header('Content-Type: application/json');
    echo json_encode(['success' => $success, 'error' => $error]);
    $conn->close();
    exit;
}

// Edit order (POST with action=edit)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    $id = intval($_POST['id'] ?? 0);
    // Ensure order_id is numeric for edit operation
    $id = intval(substr($id, 3));
    $product_id = intval($_POST['product_id'] ?? 0);
    $customer = $_POST['customer'] ?? '';
    $quantity = intval($_POST['quantity'] ?? 0);
    $payment = $_POST['payment'] ?? 'Pending';
    $status = $_POST['status'] ?? 'Processing';
    $success = false;
    $error = '';
    if ($id > 0 && $product_id > 0 && $quantity > 0) {
        // Get current order info
        $stmt = $conn->prepare("SELECT quantity, product_id FROM orders WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->bind_result($old_quantity, $old_product_id);
        if ($stmt->fetch()) {
            $stmt->close();
            // Get product price, stock, and name
            $stmt = $conn->prepare("SELECT price, stock, name FROM products WHERE id = ?");
            $stmt->bind_param("i", $product_id);
            $stmt->execute();
            $stmt->bind_result($price, $stock, $product_name);
            if ($stmt->fetch()) {
                $stmt->close();
                $stock_change = 0;
                if ($product_id == $old_product_id) {
                    $stock_change = $old_quantity - $quantity;
                } else {
                    // Restore old product stock
                    $stmt2 = $conn->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
                    $stmt2->bind_param("ii", $old_quantity, $old_product_id);
                    $stmt2->execute();
                    $stmt2->close();
                    $stock_change = -$quantity;
                }
                if ($stock + $stock_change >= 0) {
                    // Update product stock
                    $stmt2 = $conn->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
                    $stmt2->bind_param("ii", $stock_change, $product_id);
                    $stmt2->execute();
                    $stmt2->close();
                    $amount = $quantity * $price;
                    // Update order
                    $stmt = $conn->prepare("UPDATE orders SET product_id=?, customer=?, quantity=?, amount=?, payment=?, status=? WHERE id=?");
                    $stmt->bind_param("isidssi", $product_id, $customer, $quantity, $amount, $payment, $status, $id);
                    $success = $stmt->execute();
                    $stmt->close();
                    // Record order edit in history
                    $user = 'Admin';
                    $details = json_encode([
                        'product_id' => $product_id,
                        'product_name' => $product_name,
                        'customer' => $customer,
                        'quantity' => $quantity,
                        'amount' => $amount,
                        'payment' => $payment,
                        'status' => $status
                    ]);
                    $hstmt = $conn->prepare("INSERT INTO history (action_type, target_type, target_id, user, details) VALUES (?, ?, ?, ?, ?)");
                    $action_type = 'order_edit'; $target_type = 'order';
                    $hstmt->bind_param('ssiss', $action_type, $target_type, $id, $user, $details);
                    $hstmt->execute();
                    $hstmt->close();
                    // --- Activity log for order edit ---
                    try {
                        $activity_stmt = $conn->prepare("INSERT INTO activity_log (action_type, details) VALUES (?, ?)");
                        $activity_type = 'Order Updated';
                        $activity_details = 'Order ID: ' . $id . ', Product: ' . $product_name;
                        $activity_stmt->bind_param('ss', $activity_type, $activity_details);
                        $activity_stmt->execute();
                        $activity_stmt->close();
                    } catch (Exception $e) { /* ignore activity log errors */ }
                } else {
                    $error = 'Not enough stock.';
                }
            } else {
                $error = 'Product not found.';
            }
        } else {
            $error = 'Order not found.';
        }
    } else {
        $error = 'Invalid data.';
    }
    header('Content-Type: application/json');
    echo json_encode(['success' => $success, 'error' => $error]);
    $conn->close();
    exit;
}

// Delete order (POST with action=delete)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $id = intval($_POST['id'] ?? 0);
    $success = false;
    $error = '';
    if ($id > 0) {
        // Get order info
        $stmt = $conn->prepare("SELECT product_id, quantity, customer, amount, payment, status FROM orders WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->bind_result($product_id, $quantity, $customer, $amount, $payment, $status);
        if ($stmt->fetch()) {
            $stmt->close();
            // Get product name
            $stmt2 = $conn->prepare("SELECT name FROM products WHERE id = ?");
            $stmt2->bind_param("i", $product_id);
            $stmt2->execute();
            $stmt2->bind_result($product_name);
            $stmt2->fetch();
            $stmt2->close();
            // Restore product stock
            $stmt = $conn->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
            $stmt->bind_param("ii", $quantity, $product_id);
            $stmt->execute();
            $stmt->close();
            // Delete order
            $stmt = $conn->prepare("DELETE FROM orders WHERE id = ?");
            $stmt->bind_param("i", $id);
            $success = $stmt->execute();
            $stmt->close();
            // Record order delete in history
            $user = 'Admin';
            $details = json_encode([
                'product_id' => $product_id,
                'product_name' => $product_name,
                'customer' => $customer,
                'quantity' => $quantity,
                'amount' => $amount,
                'payment' => $payment,
                'status' => $status
            ]);
            $hstmt = $conn->prepare("INSERT INTO history (action_type, target_type, target_id, user, details) VALUES (?, ?, ?, ?, ?)");
            $action_type = 'order_delete'; $target_type = 'order';
            $hstmt->bind_param('ssiss', $action_type, $target_type, $id, $user, $details);
            $hstmt->execute();
            $hstmt->close();
            // --- Activity log for order delete ---
            try {
                $activity_stmt = $conn->prepare("INSERT INTO activity_log (action_type, details) VALUES (?, ?)");
                $activity_type = 'Order Deleted';
                $activity_details = 'Order ID: ' . $id . ', Product: ' . $product_name;
                $activity_stmt->bind_param('ss', $activity_type, $activity_details);
                $activity_stmt->execute();
                $activity_stmt->close();
            } catch (Exception $e) { /* ignore activity log errors */ }
        } else {
            $error = 'Order not found.';
        }
    } else {
        $error = 'Invalid order id.';
    }
    header('Content-Type: application/json');
    echo json_encode(['success' => $success, 'error' => $error]);
    $conn->close();
    exit;
}

$conn->close();
?>
