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

// Collect POST data
$firstname = isset($_POST['firstname']) ? trim($_POST['firstname']) : '';
$lastname = isset($_POST['lastname']) ? trim($_POST['lastname']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$contact = isset($_POST['contact']) ? trim($_POST['contact']) : '';
$position = isset($_POST['position']) ? trim($_POST['position']) : '';
$street = isset($_POST['street']) ? trim($_POST['street']) : '';
$city = isset($_POST['city']) ? trim($_POST['city']) : '';
$province = isset($_POST['province']) ? trim($_POST['province']) : '';
$type = isset($_POST['type']) ? $_POST['type'] : '';

// Debugging: Log received file and POST data
file_put_contents('debug.log', "\nReceived POST data:\n" . print_r($_POST, true), FILE_APPEND);
file_put_contents('debug.log', "\nReceived FILES data:\n" . print_r($_FILES, true), FILE_APPEND);

// Update email in users table
if (!empty($email)) {
    $stmt = $conn->prepare("UPDATE users SET email = ? WHERE id = ?");
    if (!$stmt) {
        echo json_encode(['error' => 'Prepare failed (users): ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("si", $email, $user_id);
    if (!$stmt->execute()) {
        echo json_encode(['error' => 'Execute failed (users): ' . $stmt->error]);
        $stmt->close();
        exit;
    }
    $stmt->close();
}

// Check if profile exists
$stmt = $conn->prepare("SELECT user_id FROM profile WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$profile_exists = $result->num_rows > 0;
$stmt->close();

// Check if a profile picture is uploaded
$has_picture = isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK;
// Check if info fields are present (at least one non-empty info field)
$has_info = $firstname || $lastname || $contact || $position || $street || $city || $province;

$profile_picture_data = null;
$profile_picture_mime = null;
if ($has_picture) {
    $fileTmpPath = $_FILES['profile_picture']['tmp_name'];
    $fileType = mime_content_type($fileTmpPath);
    $allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (in_array($fileType, $allowedMimeTypes)) {
        $profile_picture_data = file_get_contents($fileTmpPath);
        $profile_picture_mime = $fileType;
        file_put_contents('debug.log', "\nFile uploaded successfully. MIME type: $fileType\n", FILE_APPEND);
    } else {
        file_put_contents('debug.log', "\nInvalid file type: $fileType\n", FILE_APPEND);
        echo json_encode(['error' => 'Invalid image file type']);
        exit;
    }
}

if ($has_info && $has_picture) {
    // Update or insert all fields (info + picture)
    if ($profile_exists) {
        $sql = "UPDATE profile SET firstname = ?, lastname = ?, contact_number = ?, position = ?, street = ?, city = ?, province = ?, profile_picture = ?, profile_picture_mime = ? WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssssssi", $firstname, $lastname, $contact, $position, $street, $city, $province, $profile_picture_data, $profile_picture_mime, $user_id);
        $stmt->send_long_data(7, $profile_picture_data);
    } else {
        $sql = "INSERT INTO profile (user_id, firstname, lastname, contact_number, position, street, city, province, profile_picture, profile_picture_mime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isssssssss", $user_id, $firstname, $lastname, $contact, $position, $street, $city, $province, $profile_picture_data, $profile_picture_mime);
        $stmt->send_long_data(8, $profile_picture_data);
    }
    if ($stmt->execute()) {
        file_put_contents('debug.log', "\nFinal response: " . json_encode(['success' => true, 'message' => 'Profile info and picture updated successfully']) . "\n", FILE_APPEND);
    } else {
        echo json_encode(['error' => 'Failed to update profile info and picture', 'details' => $stmt->error]);
        $stmt->close();
        exit;
    }
    $stmt->close();
} elseif ($has_picture) {
    // Only update profile picture fields
    if ($profile_exists) {
        $sql = "UPDATE profile SET profile_picture = ?, profile_picture_mime = ? WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("bsi", $profile_picture_data, $profile_picture_mime, $user_id);
        $stmt->send_long_data(0, $profile_picture_data);
    } else {
        // Insert with only user_id and picture fields, leave others NULL
        $sql = "INSERT INTO profile (user_id, profile_picture, profile_picture_mime) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ibs", $user_id, $profile_picture_data, $profile_picture_mime);
        $stmt->send_long_data(1, $profile_picture_data);
    }
    if ($stmt->execute()) {
        file_put_contents('debug.log', "\nFinal response: " . json_encode(['success' => true, 'message' => 'Profile picture updated successfully']) . "\n", FILE_APPEND);
    } else {
        echo json_encode(['error' => 'Failed to update profile picture', 'details' => $stmt->error]);
        $stmt->close();
        exit;
    }
    $stmt->close();
} elseif ($has_info) {
    // Only update personal/address info fields
    if ($profile_exists) {
        $sql = "UPDATE profile SET firstname = ?, lastname = ?, contact_number = ?, position = ?, street = ?, city = ?, province = ? WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssssi", $firstname, $lastname, $contact, $position, $street, $city, $province, $user_id);
    } else {
        $sql = "INSERT INTO profile (user_id, firstname, lastname, contact_number, position, street, city, province) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isssssss", $user_id, $firstname, $lastname, $contact, $position, $street, $city, $province);
    }
    if ($stmt->execute()) {
        file_put_contents('debug.log', "\nFinal response: " . json_encode(['success' => true, 'message' => 'Profile info updated successfully']) . "\n", FILE_APPEND);
    } else {
        echo json_encode(['error' => 'Failed to update profile info', 'details' => $stmt->error]);
        $stmt->close();
        exit;
    }
    $stmt->close();
} else {
    // No valid data to update
    echo json_encode(['error' => 'No profile data or picture to update.']);
    exit;
}

// Return updated profile data (convert image to base64 data URL)
$sql = "SELECT u.email, p.firstname, p.lastname, p.contact_number, p.position, p.street, p.city, p.province, p.profile_picture, p.profile_picture_mime FROM users u LEFT JOIN profile p ON u.id = p.user_id WHERE u.id = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['error' => 'Prepare failed (final select): ' . $conn->error, 'sql' => $sql]);
    exit;
}
$stmt->bind_param("i", $user_id);
if (!$stmt->execute()) {
    echo json_encode(['error' => 'Execute failed (final select): ' . $stmt->error, 'sql' => $sql]);
    $stmt->close();
    exit;
}
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
    echo json_encode(['success' => true, 'profile' => $profile]);
} else {
    echo json_encode(['error' => 'Profile update failed (no profile returned)', 'sql' => $sql]);
}
?>
