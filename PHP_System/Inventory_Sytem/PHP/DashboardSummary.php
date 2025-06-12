<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db_connection.php';

// Total products
$totalProducts = $conn->query("SELECT COUNT(*) as count FROM products")->fetch_assoc()['count'];

// Total orders
$totalOrders = $conn->query("SELECT COUNT(*) as count FROM orders")->fetch_assoc()['count'];

// Low stock items (e.g., stock <= 5)
$lowStock = $conn->query("SELECT COUNT(*) as count FROM products WHERE stock <= 5")->fetch_assoc()['count'];

echo json_encode([
    'total_products' => (int)$totalProducts,
    'total_orders' => (int)$totalOrders,
    'low_stock' => (int)$lowStock
]);
$conn->close();
?>
