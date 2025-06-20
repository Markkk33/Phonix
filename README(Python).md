Python Inventory Management System - Instructions
=========================================================

Thank you for reviewing my Python Inventory Management System. Below are instructions for running:

1. Requirements
- Python 3.10 or newer
- Flask (for backend web server)
- A modern web browser (Chrome, Edge, Firefox, etc.)

2. How to Run the System
---------------------------
1. Open a terminal or command prompt.
2. Navigate to the project directory:
   cd Python_System
3. (Optional) Create and activate a virtual environment:
   python -m venv venv
   venv\Scripts\activate   (Windows)
4. Install dependencies:
   pip install flask
5. Start the Flask server:
   python Py/Login.py
6. Open your browser and go to:
   http://localhost:5000

3. System Features

- User login and signup
- Profile management (with custom modal for incomplete profiles)
- Change and upload profile picture
- Dashboard with summary cards and recent activity
- Product and order management
- History tracking

4. Test Accounts

- You may use the signup page to create a new account.
- 
5. Profile Completion Flow

- If a user profile is incomplete, a custom modal will appear after login.
- Click "Set Up Now" to fill in required profile information.
- The system will not allow full access until the profile is complete.

6. Notes

- All profile pictures and static files are stored in the /static/ directory.
- The sidebar and mini profile picture update automatically on all pages after a change.
- If you encounter any issues, please check the terminal for error messages.

If you have any questions, please contact the project developer.
