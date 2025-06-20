PHP Inventory Management System - Instructions
=========================================================

Thank you for reviewing my PHP Inventory Management System. Below are instructions for running and using the system as an instructor:

1. Requirements
XAMPP (or any Apache + PHP + MySQL stack)

A modern web browser (Chrome, Edge, Firefox, etc.)

2. How to Run the System
-----------------
Start XAMPP and ensure Apache and MySQL services are running.

Place the project folder in the htdocs directory:
htdocs/PHP_System/Inventory_Sytem

Open phpMyAdmin (http://localhost/phpmyadmin).

Create a new database (e.g., inventory_system).

Import the provided SQL file (if available) to create tables and sample data.

Check or modify database credentials in PHP/db_connection.php if needed:

php
Copy
Edit
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "inventory_system";
Open your browser and go to:
http://localhost/PHP_System/Inventory_Sytem/HMTL/Login.html

3. System Features
User login and signup

Profile management (with profile picture upload)

Product and order management

Dashboard with summary cards and sales overview

History tracking for activities

4. Instructor Test Accounts
You may use the signup page to create a new account, or use any test credentials provided by the student.

5. Profile Completion Flow
If a user profile is incomplete, a notification will appear after login.

Click "Set Up Now" to fill in the required profile information.

Full access to system features requires profile completion.

6. Notes
Profile pictures and other static files are stored in the Pictures/ directory.

Changes to profile pictures will automatically reflect across all pages.

For issues, check the browser console or review error messages in the terminal (if any).

If you have any questions, please contact the project developer.

