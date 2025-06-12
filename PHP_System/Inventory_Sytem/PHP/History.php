<?php
// History.php: Fetches all product and order history from the `history` table
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "inventory_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

header('Content-Type: application/json');

$type = isset($_GET['type']) ? $_GET['type'] : 'all';
$sortOrder = isset($_GET['sort_order']) && $_GET['sort_order'] === 'asc' ? 'ASC' : 'DESC';

if ($type === 'product') {
    $sql = "SELECT * FROM history WHERE target_type = 'product' ORDER BY created_at $sortOrder, id $sortOrder";
} elseif ($type === 'order') {
    $sql = "SELECT * FROM history WHERE target_type = 'order' ORDER BY created_at $sortOrder, id $sortOrder";
} else {
    $sql = "SELECT * FROM history ORDER BY created_at $sortOrder, id $sortOrder";
}

$result = $conn->query($sql);
$history = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $row['details'] = json_decode($row['details'], true); // Decode JSON details for easier access
        $history[] = $row;
    }
}

// Debugging: Log the created_at field values
error_log("Debugging created_at values:");
foreach ($history as $record) {
    error_log($record['created_at']);
}

echo json_encode($history);
$conn->close();
?>
