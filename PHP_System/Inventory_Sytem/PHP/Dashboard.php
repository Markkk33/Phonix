<?php
header('Content-Type: application/json');
// Update the path below to your actual DB connection file if needed
require_once '../PHP/db_connection.php';

$sql = "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20";
$result = $conn->query($sql);

$activities = [];
while ($row = $result->fetch_assoc()) {
    $activities[] = $row;
}
echo json_encode($activities);
$conn->close();
