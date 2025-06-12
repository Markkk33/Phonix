<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../db_connection.php';

// Get sales per day for the last 6 days (including today)
$dates = [];
for ($i = 5; $i >= 0; $i--) {
    $dates[] = date('Y-m-d', strtotime("-{$i} days"));
}

// Fetch sales for these dates
$sales = array_fill_keys($dates, 0);
$sql = "SELECT DATE(created_at) as day, SUM(amount) as total_sales FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 DAY) GROUP BY day ORDER BY day ASC";
$result = $conn->query($sql);
while ($row = $result->fetch_assoc()) {
    $sales[$row['day']] = (float)$row['total_sales'];
}

$response = [
    'labels' => array_values($dates),
    'datasets' => [[
        'label' => 'Sales',
        'data' => array_values($sales),
        'backgroundColor' => '#297FB0',
        'borderColor' => '#297FB0',
        'fill' => false,
        'tension' => 0.3
    ]]
];
echo json_encode($response);
$conn->close();
?>
