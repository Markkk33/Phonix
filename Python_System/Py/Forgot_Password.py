from flask import Blueprint, request, jsonify, current_app
from flask_mysqldb import MySQL

# Create a Blueprint for the Forgot Password functionality
forgot_password_bp = Blueprint('forgot_password', __name__)

@forgot_password_bp.route('/forgot_password', methods=['POST'])
def handle_forgot_password():
    # Extract email from the request
    data = request.get_json()
    email = data.get('email')

    # Validate the email
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Connect to the MySQL database using flask_mysqldb
    try:
        import MySQLdb.cursors
        cursor = current_app.mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # Debugging: Check if the connection is successful
        print("MySQL database connection established.")
        print(f"Checking for email: {email}")

        # Query to check if the email exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        # Debugging: Log the query result
        print(f"Query result for email '{email}': {user}")

        if not user:
            print("Email not found in the database.")
            return jsonify({'error': 'Email not found in the database'}), 404

        # Placeholder for sending a password reset email
        print(f"Password reset email would be sent to: {email}")

        return jsonify({'message': 'If this email is registered, a password reset link has been sent.'}), 200

    except Exception as e:
        # Debugging: Log the database error
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500