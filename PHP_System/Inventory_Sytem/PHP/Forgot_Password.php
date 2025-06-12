<?php
header('Content-Type: application/json');

// Database connection for signup_demo
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "Inventory_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

$email = trim($_POST['email'] ?? '');
if ($email === '') {
    echo json_encode(['success' => false, 'message' => 'Email address is required.']);
    exit();
}

// Check if email exists in users table
$sql = "SELECT id FROM users WHERE email = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 1) {
    // In a real app, you would send a reset link here
    echo json_encode([
        'success' => true,
        'message' => 'A password reset link has been sent to your email. Redirecting to login page...'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No account found with that email address.'
    ]);
}
$stmt->close();
$conn->close();
?>
