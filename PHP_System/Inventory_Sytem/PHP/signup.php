<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection for signup_demo
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "Inventory_db";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (
        isset($_POST['username']) &&
        isset($_POST['email']) &&
        isset($_POST['password']) &&
        isset($_POST['confirm_password'])
    ) {
        $user = trim($_POST['username']);
        $email = trim($_POST['email']);
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];

        // Check if passwords match
        if ($password !== $confirm_password) {
            header("Location: ../HMTL/signup.html?popupMsg=" . urlencode('Passwords do not match!') . "&popupSuccess=false");
            exit();
        }

        // Check if username or email already exists
        $check_sql = "SELECT id FROM users WHERE username = ? OR email = ?";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bind_param("ss", $user, $email);
        $check_stmt->execute();
        $check_stmt->store_result();
        if ($check_stmt->num_rows > 0) {
            $check_stmt->close();
            header("Location: ../HMTL/signup.html?popupMsg=" . urlencode('Username or email already exists!') . "&popupSuccess=false");
            exit();
        }
        $check_stmt->close();

        $pass_hashed = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $user, $pass_hashed, $email);

        if ($stmt->execute()) {
            $stmt->close();
            header("Location: ../HMTL/signup.html?popupMsg=" . urlencode('Account successfully created! Redirecting to login page...') . "&popupSuccess=true");
            exit();
        } else {
            $stmt->close();
            header("Location: ../HMTL/signup.html?popupMsg=" . urlencode('Error: ' . $stmt->error) . "&popupSuccess=false");
            exit();
        }
    } else {
        header("Location: ../HMTL/signup.html?popupMsg=" . urlencode('Please fill in all required fields.') . "&popupSuccess=false");
        exit();
    }
}

$conn->close();
?>
