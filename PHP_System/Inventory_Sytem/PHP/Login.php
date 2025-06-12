<?php
session_start();
// Database connection for signup_demo
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "Inventory_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $user = trim($_POST['username'] ?? '');
    $pass = $_POST['password'] ?? '';

    if ($user === '' || $pass === '') {
        header("Location: ../HMTL/Login.html?popupMsg=" . urlencode('Please fill in all fields.') . "&popupSuccess=false");
        exit();
    }

    $sql = "SELECT id, username, password FROM users WHERE username = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 1) {
        $stmt->bind_result($id, $username, $hashed_password);
        $stmt->fetch();
        if (password_verify($pass, $hashed_password)) {
            // Login success
            $_SESSION['user_id'] = $id;
            $_SESSION['username'] = $username;
            header("Location: ../HMTL/Dashboard.html?popupMsg=" . urlencode('Login successful!') . "&popupSuccess=true");
            exit();
        } else {
            // Wrong password
            header("Location: ../HMTL/Login.html?popupMsg=" . urlencode('Incorrect password.') . "&popupSuccess=false");
            exit();
        }
    } else {
        // User not found
        header("Location: ../HMTL/Login.html?popupMsg=" . urlencode('User not found.') . "&popupSuccess=false");
        exit();
    }
}
$conn->close();
?>
