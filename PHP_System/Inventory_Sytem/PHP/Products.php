<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
$mysqli = new mysqli('localhost', 'root', '', 'inventory_db'); // Change to your DB name
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to connect to MySQL: ' . $mysqli->connect_error]);
    exit();
}

// --- API for available storage and color options ---
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['options'])) {
    $storageResult = $mysqli->query('SELECT DISTINCT storage FROM products WHERE storage IS NOT NULL AND storage != ""');
    $colorResult = $mysqli->query('SELECT DISTINCT color FROM products WHERE color IS NOT NULL AND color != ""');
    $storages = [];
    $colors = [];
    while ($row = $storageResult->fetch_assoc()) {
        $storages[] = $row['storage'];
    }
    while ($row = $colorResult->fetch_assoc()) {
        $colors[] = $row['color'];
    }
    echo json_encode(['storages' => $storages, 'colors' => $colors]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id']) && $_POST['id'] !== '') {
    $id = intval($_POST['id']);
    $name = $_POST['name'] ?? '';
    $storage = $_POST['storage'] ?? '';
    $color = $_POST['color'] ?? '';
    $stock = isset($_POST['stock']) ? intval($_POST['stock']) : 0;
    $price = isset($_POST['price']) ? floatval($_POST['price']) : 0.0;
    $status = $stock === 0 ? 'Out of Stock' : ($stock <= 5 ? 'Low Stock' : 'In stock');
    $image = null;
    if (!empty($_POST['image'])) {
        // Defensive: check for base64, else fallback
        if (strpos($_POST['image'], 'base64,') !== false) {
            $imageParts = explode('base64,', $_POST['image']);
            $image = isset($imageParts[1]) ? base64_decode($imageParts[1]) : null;
        }
    }
    $stmt = $mysqli->prepare("UPDATE products SET name=?, storage=?, color=?, stock=?, price=?, status=?, image=? WHERE id=?");
    $stmt->bind_param('sssidsbi', $name, $storage, $color, $stock, $price, $status, $image, $id);
    if ($image !== null) {
        $stmt->send_long_data(6, $image);
    }
    $success = $stmt->execute();
    $error = $stmt->error;
    $stmt->close();
    // --- History logging for edit (non-blocking) ---
    if ($success) {
        try {
            $details = json_encode([
                'name' => $name,
                'storage' => $storage,
                'color' => $color,
                'stock' => $stock,
                'price' => $price,
                'status' => $status
            ]);
            $hstmt = $mysqli->prepare("INSERT INTO history (action_type, target_type, target_id, user, details) VALUES (?, ?, ?, ?, ?)");
            $action_type = 'edit'; $target_type = 'product'; $user = 'Admin';
            $hstmt->bind_param('ssiss', $action_type, $target_type, $id, $user, $details);
            $hstmt->execute();
            $hstmt->close();
        } catch (Exception $e) { /* ignore history errors */ }
        // --- Activity log for edit ---
        try {
            $activity_stmt = $mysqli->prepare("INSERT INTO activity_log (action_type, details) VALUES (?, ?)");
            $activity_type = 'Product Updated';
            $activity_details = 'Product: ' . $name;
            $activity_stmt->bind_param('ss', $activity_type, $activity_details);
            $activity_stmt->execute();
            $activity_stmt->close();
        } catch (Exception $e) { /* ignore activity log errors */ }
    }
    echo json_encode(['success' => $success, 'error' => $success ? null : $error]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    $delete_id = intval($_POST['delete_id']);
    // Get product info before delete for history
    $prodRes = $mysqli->query("SELECT * FROM products WHERE id=" . $delete_id);
    $prodRow = $prodRes ? $prodRes->fetch_assoc() : null;
    $stmt = $mysqli->prepare("DELETE FROM products WHERE id=?");
    $stmt->bind_param('i', $delete_id);
    $success = $stmt->execute();
    $error = $stmt->error;
    $stmt->close();
    // --- History logging for delete (non-blocking) ---
    if ($success && $prodRow) {
        try {
            $details = json_encode([
                'name' => $prodRow['name'],
                'storage' => $prodRow['storage'],
                'color' => $prodRow['color'],
                'stock' => $prodRow['stock'],
                'price' => $prodRow['price'],
                'status' => $prodRow['status']
            ]);
            $hstmt = $mysqli->prepare("INSERT INTO history (action_type, target_type, target_id, user, details) VALUES (?, ?, ?, ?, ?)");
            $action_type = 'remove'; $target_type = 'product'; $user = 'Admin';
            $hstmt->bind_param('ssiss', $action_type, $target_type, $delete_id, $user, $details);
            $hstmt->execute();
            $hstmt->close();
        } catch (Exception $e) { /* ignore history errors */ }
        // --- Activity log for delete ---
        try {
            $activity_stmt = $mysqli->prepare("INSERT INTO activity_log (action_type, details) VALUES (?, ?)");
            $activity_type = 'Product Deleted';
            $activity_details = 'Product: ' . $prodRow['name'];
            $activity_stmt->bind_param('ss', $activity_type, $activity_details);
            $activity_stmt->execute();
            $activity_stmt->close();
        } catch (Exception $e) { /* ignore activity log errors */ }
    }
    echo json_encode(['success' => $success, 'error' => $success ? null : $error]);
    exit();
}

if (
    $_SERVER['REQUEST_METHOD'] === 'POST' &&
    !isset($_POST['id']) &&
    !isset($_POST['delete_id'])
) {
    $name = $_POST['name'] ?? '';
    $storage = $_POST['storage'] ?? '';
    $color = $_POST['color'] ?? '';
    $stock = isset($_POST['stock']) ? intval($_POST['stock']) : 0;
    $price = isset($_POST['price']) ? floatval($_POST['price']) : 0.0;
    $status = $stock === 0 ? 'Out of Stock' : ($stock <= 5 ? 'Low Stock' : 'In stock');
    $image = null;
    if (!empty($_POST['image'])) {
        // Defensive: check for base64, else fallback
        if (strpos($_POST['image'], 'base64,') !== false) {
            $imageParts = explode('base64,', $_POST['image']);
            $image = isset($imageParts[1]) ? base64_decode($imageParts[1]) : null;
        }
    }
    $stmt = $mysqli->prepare("INSERT INTO products (name, storage, color, stock, price, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('sssidsb', $name, $storage, $color, $stock, $price, $status, $image);
    // For blob, use send_long_data
    if ($image !== null) {
        $stmt->send_long_data(6, $image);
    }
    $success = $stmt->execute();
    $insert_id = $stmt->insert_id;
    $error = $stmt->error;
    $stmt->close();
    // --- History logging for add (non-blocking) ---
    if ($success) {
        try {
            $details = json_encode([
                'name' => $name,
                'storage' => $storage,
                'color' => $color,
                'stock' => $stock,
                'price' => $price,
                'status' => $status
            ]);
            $hstmt = $mysqli->prepare("INSERT INTO history (action_type, target_type, target_id, user, details) VALUES (?, ?, ?, ?, ?)");
            $action_type = 'add'; $target_type = 'product'; $user = 'Admin';
            $hstmt->bind_param('ssiss', $action_type, $target_type, $insert_id, $user, $details);
            $hstmt->execute();
            $hstmt->close();
        } catch (Exception $e) { /* ignore history errors */ }
        // --- Activity log for add ---
        try {
            $activity_stmt = $mysqli->prepare("INSERT INTO activity_log (action_type, details) VALUES (?, ?)");
            $activity_type = 'New Stock Added';
            $activity_details = 'Product: ' . $name;
            $activity_stmt->bind_param('ss', $activity_type, $activity_details);
            $activity_stmt->execute();
            $activity_stmt->close();
        } catch (Exception $e) { /* ignore activity log errors */ }
    }
    echo json_encode(['success' => $success, 'id' => $success ? $insert_id : null, 'error' => $success ? null : $error]);
    exit();
}

// GET: fetch all products
$result = $mysqli->query('SELECT * FROM products');
$products = [];
while ($row = $result->fetch_assoc()) {
    if (!empty($row['image'])) {
        $row['image'] = 'data:image/jpeg;base64,' . base64_encode($row['image']);
    } else {
        $row['image'] = null;
    }
    $products[] = $row;
}
echo json_encode($products);
?>