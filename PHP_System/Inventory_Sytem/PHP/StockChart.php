<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../db_connection.php';

// Get top 6 products by stock
$sql = "SELECT name, stock FROM products ORDER BY stock DESC LIMIT 6";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode(['error' => $conn->error]);
    exit;
}

$labels = [];
$data = [];
while ($row = $result->fetch_assoc()) {
    $labels[] = $row['name'];
    $data[] = (int)$row['stock'];
}

$response = [
    'labels' => $labels,
    'datasets' => [[
        'label' => 'Stock',
        'data' => $data,
        'backgroundColor' => '#297FB0',
        'borderColor' => '#297FB0',
        'fill' => false
    ]]
];
echo json_encode($response);
$conn->close();
?>
