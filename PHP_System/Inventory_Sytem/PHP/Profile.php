<?php
session_start();
header('Content-Type: application/json');
$conn = new mysqli('localhost', 'root', '', 'Inventory_db');
if ($conn->connect_error) {
    echo json_encode(['error' => 'Connection failed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch profile info for the current user, including profile_picture_mime
$sql = "SELECT u.email, p.firstname, p.lastname, p.contact_number, p.position, p.street, p.city, p.province, p.profile_picture, p.profile_picture_mime FROM users u LEFT JOIN profile p ON u.id = p.user_id WHERE u.id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$profile = $result->fetch_assoc();
$stmt->close();

if ($profile) {
    // Convert binary image to base64 data URL if present
    if (!empty($profile['profile_picture']) && !empty($profile['profile_picture_mime'])) {
        $profile['profile_picture'] = 'data:' . $profile['profile_picture_mime'] . ';base64,' . base64_encode($profile['profile_picture']);
    } else {
        $profile['profile_picture'] = null;
    }
    echo json_encode($profile);
} else {
    echo json_encode(['error' => 'Profile not found']);
}
?>
