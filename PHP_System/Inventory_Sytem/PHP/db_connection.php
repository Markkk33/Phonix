<?php
$servername = "localhost";
$username = "root";
$password = ""; // default for XAMPP is empty
$dbname = "inventory_db"; // <-- change this to your actual database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
