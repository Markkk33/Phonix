from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory
from flask_mysqldb import MySQL
import MySQLdb.cursors
import re
from werkzeug.security import check_password_hash, generate_password_hash
from Forgot_Password import forgot_password_bp
import os
import logging
import base64
import uuid

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Set the correct template and static folder paths
app = Flask(__name__, template_folder='../templates', static_folder='../static')
app.secret_key = 'your_secret_key'  # Change this to a random secret key

# MySQL configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'mark123'  # Set your MySQL password if any
app.config['MYSQL_DB'] = 'Inventory_db'

mysql = MySQL(app)
app.mysql = mysql  # Attach MySQL object to app for Blueprint access

app.register_blueprint(forgot_password_bp)

UPLOAD_FOLDER = os.path.join(app.static_folder, 'Pictures')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def log_history(action_type, target_type, target_id, details, user):
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('''
        INSERT INTO history (action_type, target_type, target_id, details, user)
        VALUES (%s, %s, %s, %s, %s)
    ''', (action_type, target_type, target_id, details, user))
    mysql.connection.commit()

@app.route('/login', methods=['GET', 'POST'])
def login():
    msg = ''
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
        username = request.form['username']
        password = request.form['password']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
        account = cursor.fetchone()
        if not account:
            msg = 'Wrong username.'
        elif not check_password_hash(account['password'], password):
            msg = 'Wrong password.'
        else:
            session['loggedin'] = True
            session['id'] = account['id']
            session['username'] = account['username']
            return redirect(url_for('dashboard'))
    return render_template('Login.html', msg=msg)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    msg = ''
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form and 'email' in request.form:
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM users WHERE username = %s OR email = %s', (username, email))
        account = cursor.fetchone()
        if account:
            msg = 'Account already exists!'
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            msg = 'Invalid email address!'
        elif not username or not password or not email:
            msg = 'Please fill out the form!'
        else:
            hashed_password = generate_password_hash(password)
            cursor.execute('INSERT INTO users (username, password, email) VALUES (%s, %s, %s)', (username, hashed_password, email))
            mysql.connection.commit()
            msg = 'You have successfully registered!'
            return redirect(url_for('login'))
    elif request.method == 'POST':
        msg = 'Please fill out the form!'
    return render_template('signup.html', msg=msg)

@app.route('/dashboard')
def dashboard():
    if 'loggedin' in session:
        return render_template('Dashboard.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/forgot_password')
def forgot_password():
    return render_template('Forgot_Password.html')

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'loggedin' not in session:
        return redirect(url_for('login'))
    user_id = session['id']
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    if request.method == 'POST':
        # Get form data (ignore email field if present)
        firstname = request.form.get('firstname')
        lastname = request.form.get('lastname')
        contact = request.form.get('contact')
        position = request.form.get('position')
        street = request.form.get('street')
        city = request.form.get('city')
        province = request.form.get('province')
        # Email is always from users table, not editable, not updated here
        # Handle profile picture upload
        profile_picture = None
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                filename = f'user_{user_id}_profile_{file.filename}'
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                profile_picture = f'Pictures/{filename}'
        # Check if profile exists
        cursor.execute('SELECT * FROM profile WHERE user_id = %s', (user_id,))
        existing = cursor.fetchone()
        if existing:
            # Update (email is never updated here)
            update_fields = [
                'firstname=%s', 'lastname=%s', 'contact_number=%s', 'position=%s',
                'street=%s', 'city=%s', 'province=%s'
            ]
            update_values = [firstname, lastname, contact, position, street, city, province]
            if profile_picture:
                update_fields.append('profile_picture=%s')
                update_values.append(profile_picture)
            update_values.append(user_id)
            cursor.execute(f"UPDATE profile SET {', '.join(update_fields)} WHERE user_id=%s", tuple(update_values))
        else:
            # Insert (email is never inserted here)
            cursor.execute(
                'INSERT INTO profile (user_id, firstname, lastname, contact_number, position, street, city, province, profile_picture) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                (user_id, firstname, lastname, contact, position, street, city, province, profile_picture or '')
            )
        mysql.connection.commit()
        return redirect(url_for('profile'))
    # GET: join users and profile tables, always use email from users table
    cursor.execute('''
        SELECT u.email, p.*
        FROM users u
        LEFT JOIN profile p ON u.id = p.user_id
        WHERE u.id = %s
    ''', (user_id,))
    profile_data = cursor.fetchone()
    required_fields = [
        'firstname', 'lastname', 'email', 'position',
        'street', 'city', 'province', 'profile_picture'
    ]
    is_profile_incomplete = not profile_data or any(
        not profile_data.get(field) for field in required_fields
    )
    return render_template(
        'Profile.html',
        username=session['username'],
        is_profile_incomplete=is_profile_incomplete,
        profile=profile_data
    )

@app.route('/products')
def products():
    if 'loggedin' in session:
        return render_template('Products.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/orders')
def orders():
    if 'loggedin' in session:
        return render_template('Orders.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/history')
def history():
    if 'loggedin' in session:
        return render_template('History.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/add_product', methods=['POST'])
def add_product():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401

    try:
        # Extract product details from the request
        name = request.form.get('name')
        storage = request.form.get('storage')
        color = request.form.get('color')
        stock = request.form.get('stock')
        price = request.form.get('price')
        image = request.files.get('image')

        if not all([name, storage, color, stock, price]):
            logging.error('Missing required fields: %s', {'name': name, 'storage': storage, 'color': color, 'stock': stock, 'price': price})
            return {'success': False, 'message': 'All fields are required'}, 400

        # Save the image if provided
        image_data = None
        if image:
            image_data = image.read()  # Read the image data as binary

        # Insert product into the database
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('''
            INSERT INTO products (name, storage, color, stock, price, image)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (name, storage, color, stock, price, image_data))
        mysql.connection.commit()
        product_id = cursor.lastrowid
        # Log history (details: all product fields)
        log_history('New Stock Added', 'product', product_id, f"Added product: {name}, {storage}, {color}, stock: {stock}, price: {price}", session['username'])

        return {'success': True, 'message': 'Product added successfully'}
    except Exception as e:
        logging.exception('Error while adding product')
        return {'success': False, 'message': 'An error occurred while adding the product'}, 500

@app.route('/get_products', methods=['GET'])
def get_products():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM products')
    products = cursor.fetchall()

    # Format the products for the frontend
    formatted_products = [
        {
            'id': product['id'],
            'name': product['name'],
            'storage': product['storage'],
            'color': product['color'],
            'stock': product['stock'],
            'price': product['price'],
            'image': f"data:image/jpeg;base64,{base64.b64encode(product['image']).decode('utf-8')}" if product['image'] else None
        }
        for product in products
    ]

    logging.debug('Formatted products response: %s', formatted_products)

    return {'success': True, 'products': formatted_products}

@app.route('/edit_product', methods=['POST'])
def edit_product():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401

    try:
        # Extract product details from the request
        product_id = request.form.get('id')
        name = request.form.get('name')
        storage = request.form.get('storage')
        color = request.form.get('color')
        stock = request.form.get('stock')
        price = request.form.get('price')
        image = request.files.get('image')

        if not all([product_id, name, storage, color, stock, price]):
            logging.error('Missing required fields: %s', {'id': product_id, 'name': name, 'storage': storage, 'color': color, 'stock': stock, 'price': price})
            return {'success': False, 'message': 'All fields are required'}, 400

        # Save the image if provided
        image_data = None
        if image:
            image_data = image.read()  # Read the image data as binary

        # Update product in the database
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        if image_data:
            cursor.execute('''
                UPDATE products
                SET name = %s, storage = %s, color = %s, stock = %s, price = %s, image = %s
                WHERE id = %s
            ''', (name, storage, color, stock, price, image_data, product_id))
        else:
            cursor.execute('''
                UPDATE products
                SET name = %s, storage = %s, color = %s, stock = %s, price = %s
                WHERE id = %s
            ''', (name, storage, color, stock, price, product_id))
        mysql.connection.commit()
        # Log history (details: all product fields)
        log_history('Product Updated', 'product', product_id, f"Edited product: {name}, {storage}, {color}, stock: {stock}, price: {price}", session['username'])

        return {'success': True, 'message': 'Product updated successfully'}
    except Exception as e:
        logging.exception('Error while updating product')
        return {'success': False, 'message': 'An error occurred while updating the product'}, 500

@app.route('/delete_product', methods=['POST'])
def delete_product():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401

    try:
        product_id = request.form.get('id')
        if not product_id:
            return {'success': False, 'message': 'Product ID is required'}, 400

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        # Fetch product details before deletion
        cursor.execute('SELECT * FROM products WHERE id = %s', (product_id,))
        product = cursor.fetchone()
        if not product:
            return {'success': False, 'message': 'Product not found'}, 404

        # Delete the product
        cursor.execute('DELETE FROM products WHERE id = %s', (product_id,))
        mysql.connection.commit()

        # Log the deletion with all product fields for frontend consistency
        details = f"Deleted product: Name: {product['name']}, Storage: {product['storage']}, Color: {product['color']}, Stock: {product['stock']}, Price: {product['price']}"
        log_history('Product Deleted', 'product', product_id, details, session['username'])

        return {'success': True, 'message': 'Product deleted successfully'}
    except Exception as e:
        logging.exception('Error while deleting product')
        return {'success': False, 'message': 'An error occurred while deleting the product'}, 500

@app.route('/fetch_products', methods=['GET'])
def fetch_products():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401

    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        # Fetch products with stock > 0 and include storage, color, and price
        cursor.execute('SELECT id, name, storage, color, price FROM products WHERE stock > 0')
        products = cursor.fetchall()

        # Debugging: Log the fetched products
        logging.debug('Fetched products: %s', products)

        return {'success': True, 'products': products}
    except Exception as e:
        logging.exception('Error while fetching products')
        return {'success': False, 'message': 'An error occurred while fetching products'}, 500

@app.route('/add_order', methods=['POST'])
def add_order():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401

    try:
        # Extract order details from the request
        product_id = request.form.get('product_id')
        customer = request.form.get('customer')
        quantity = int(request.form.get('quantity', 0))
        payment = request.form.get('payment')
        status = request.form.get('status')

        if not all([product_id, customer, quantity, payment, status]):
            return {'success': False, 'message': 'All fields are required'}, 400

        # Initialize the database cursor
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # Fetch the product's price, stock, and name
        cursor.execute('SELECT price, stock, name FROM products WHERE id = %s', (product_id,))
        product = cursor.fetchone()

        if not product:
            return {'success': False, 'message': 'Product not found'}, 404

        if quantity > product['stock']:
            return {'success': False, 'message': 'Insufficient stock'}, 400

        # Calculate the total amount
        total_amount = quantity * product['price']

        # Deduct the ordered quantity from the stock
        new_stock = product['stock'] - quantity
        cursor.execute('UPDATE products SET stock = %s WHERE id = %s', (new_stock, product_id))

        # Generate a unique order_id
        order_id = str(uuid.uuid4())[:12]

        # Insert the order into the database (now including order_id)
        cursor.execute('''
            INSERT INTO orders (product_id, order_id, customer, quantity, payment, status, amount)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (product_id, order_id, customer, quantity, payment, status, total_amount))
        mysql.connection.commit()
        order_db_id = cursor.lastrowid
        # Log history with full order details
        log_history('Order Placed', 'order', order_db_id, f"order_id: {order_id}, product: {product['name']}, customer: {customer}, qty: {quantity}, payment: {payment}, status: {status}, amount: {total_amount}", session['username'])

        return {'success': True, 'message': 'Order added successfully'}
    except Exception as e:
        logging.exception('Error while adding order')
        return {'success': False, 'message': 'An error occurred while adding the order'}, 500

@app.route('/fetch_orders', methods=['GET'])
def fetch_orders():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('''
            SELECT o.id, o.order_id, o.customer, o.quantity, o.amount, o.payment, o.status, o.created_at,
                p.name, p.storage, p.color, p.image, p.id as product_id
            FROM orders o
            JOIN products p ON o.product_id = p.id
            ORDER BY o.created_at DESC
        ''')
        orders = cursor.fetchall()
        # Format for frontend
        formatted = [
            {
                'id': row['id'],
                'orderId': row['order_id'],
                'productId': row['product_id'],
                'product': f"{row['name']}",
                'img': f"data:image/jpeg;base64,{base64.b64encode(row['image']).decode('utf-8')}" if row['image'] else None,
                'customer': row['customer'],
                'quantity': row['quantity'],
                'amount': f"${row['amount']:.2f}",
                'payment': row['payment'],
                'status': row['status'],
                'createdAt': row['created_at'].strftime('%Y-%m-%d %H:%M') if row['created_at'] else ''
            }
            for row in orders
        ]
        return {'success': True, 'orders': formatted}
    except Exception as e:
        logging.exception('Error while fetching orders')
        return {'success': False, 'message': 'An error occurred while fetching orders'}, 500

@app.route('/edit_order', methods=['POST'])
def edit_order():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        order_id = request.form.get('id')
        product_id = request.form.get('product_id')
        customer = request.form.get('customer')
        quantity = request.form.get('quantity')
        payment = request.form.get('payment')
        status = request.form.get('status')

        # Validate all fields (quantity must be a valid integer string, not 0 or empty)
        if not all([order_id, product_id, customer, payment, status]) or quantity is None or str(quantity).strip() == '':
            return {'success': False, 'message': 'All fields are required'}, 400
        try:
            quantity = int(quantity)
        except Exception:
            return {'success': False, 'message': 'Invalid quantity'}, 400
        if quantity <= 0:
            return {'success': False, 'message': 'Quantity must be greater than 0'}, 400

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        # Fetch the current order to get the previous quantity and product
        cursor.execute('SELECT quantity, product_id, order_id FROM orders WHERE id = %s', (order_id,))
        current_order = cursor.fetchone()
        if not current_order:
            return {'success': False, 'message': 'Order not found'}, 404

        # Fetch the new product's price, stock, and name
        cursor.execute('SELECT price, stock, name FROM products WHERE id = %s', (product_id,))
        product = cursor.fetchone()
        if not product:
            return {'success': False, 'message': 'Product not found'}, 404

        # If product is changed, restore stock for old product and check stock for new product
        if int(product_id) != int(current_order['product_id']):
            # Restore stock for old product
            cursor.execute('UPDATE products SET stock = stock + %s WHERE id = %s', (current_order['quantity'], current_order['product_id']))
            # Check stock for new product
            if quantity > product['stock']:
                return {'success': False, 'message': 'Insufficient stock'}, 400
            # Deduct stock for new product
            cursor.execute('UPDATE products SET stock = stock - %s WHERE id = %s', (quantity, product_id))
        else:
            # If product is the same, adjust stock based on quantity difference
            diff = quantity - current_order['quantity']
            if diff > 0:
                if diff > product['stock']:
                    return {'success': False, 'message': 'Insufficient stock'}, 400
                cursor.execute('UPDATE products SET stock = stock - %s WHERE id = %s', (diff, product_id))
            elif diff < 0:
                cursor.execute('UPDATE products SET stock = stock + %s WHERE id = %s', (-diff, product_id))

        # Calculate the total amount
        total_amount = quantity * product['price']

        # Update the order
        cursor.execute('''
            UPDATE orders
            SET product_id = %s, customer = %s, quantity = %s, payment = %s, status = %s, amount = %s
            WHERE id = %s
        ''', (product_id, customer, quantity, payment, status, total_amount, order_id))
        mysql.connection.commit()
        # Log history with full order details
        log_history('Order Updated', 'order', order_id, f"order_id: {current_order['order_id']}, product: {product['name']}, customer: {customer}, qty: {quantity}, payment: {payment}, status: {status}, amount: {total_amount}", session['username'])

        return {'success': True, 'message': 'Order updated successfully'}
    except Exception as e:
        logging.exception('Error while editing order')
        return {'success': False, 'message': 'An error occurred while editing the order'}, 500

@app.route('/delete_order', methods=['POST'])
def delete_order():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        order_id = request.form.get('id')
        if not order_id:
            return {'success': False, 'message': 'Order ID is required'}, 400
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        # Fetch order details before deletion
        cursor.execute('''
            SELECT o.*, p.name as product_name, p.storage, p.color, p.price
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.id = %s
        ''', (order_id,))
        order = cursor.fetchone()
        if not order:
            return {'success': False, 'message': 'Order not found'}, 404
        # Format details for history log (product name only)
        details = (
            f"Deleted order: order_id: {order['order_id']}, product: {order['product_name']}, "
            f"customer: {order['customer']}, qty: {order['quantity']}, payment: {order['payment']}, status: {order['status']}, amount: ${order['amount']:.2f}"
        )
        # Delete the order
        cursor.execute('DELETE FROM orders WHERE id = %s', (order_id,))
        mysql.connection.commit()
        # Log history with full order details
        log_history('Order Deleted', 'order', order_id, f"order_id: {order['order_id']}, product: {order['product_name']}, customer: {order['customer']}, qty: {order['quantity']}, payment: {order['payment']}, status: {order['status']}, amount: ${order['amount']:.2f}", session['username'])
        return {'success': True, 'message': 'Order deleted successfully'}
    except Exception as e:
        logging.exception('Error while deleting order')
        return {'success': False, 'message': 'An error occurred while deleting the order'}, 500

@app.route('/fetch_history', methods=['GET'])
def fetch_history():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM history ORDER BY created_at DESC')
        history = cursor.fetchall()
        def format_datetime(dt):
            if not dt:
                return ''
            # Remove leading zeros from month, day, and hour
            month = dt.month
            day = dt.day
            year = dt.year
            hour = dt.hour % 12 or 12
            minute = dt.minute
            second = dt.second
            ampm = 'AM' if dt.hour < 12 else 'PM'
            # No space before AM/PM
            return f"{month}/{day}/{year}, {hour}:{minute:02d}:{second:02d}{ampm}"
        formatted = [
            {
                'id': row['id'],
                'actionType': row['action_type'],
                'targetType': row['target_type'],
                'targetId': row['target_id'],
                'details': row['details'],
                'user': row['user'],
                'createdAt': format_datetime(row['created_at'])
            }
            for row in history
        ]
        return {'success': True, 'history': formatted}
    except Exception as e:
        logging.exception('Error while fetching history')
        return {'success': False, 'message': 'An error occurred while fetching history'}, 500

@app.route('/get_filter_options', methods=['GET'])
def get_filter_options():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT DISTINCT storage FROM products')
        storage_options = [row['storage'] for row in cursor.fetchall() if row['storage']]
        cursor.execute('SELECT DISTINCT color FROM products')
        color_options = [row['color'] for row in cursor.fetchall() if row['color']]
        return {
            'success': True,
            'storageOptions': storage_options,
            'colorOptions': color_options
        }
    except Exception as e:
        logging.exception('Error while fetching filter options')
        return {'success': False, 'message': 'An error occurred while fetching filter options'}, 500

@app.route('/sales_chart', methods=['GET'])
def sales_chart():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        import datetime
        today = datetime.date.today()
        days = [today - datetime.timedelta(days=i) for i in range(29, -1, -1)]
        labels = [d.strftime('%Y-%m-%d') for d in days]
        sales_by_day = {label: 0 for label in labels}
        min_date = days[0]
        cursor.execute('''
            SELECT created_at, amount FROM orders WHERE created_at >= %s
        ''', (min_date,))
        for row in cursor.fetchall():
            if row['created_at']:
                label = row['created_at'].strftime('%Y-%m-%d')
                if label in sales_by_day:
                    sales_by_day[label] += float(row['amount'])
        data = {
            'labels': labels,
            'datasets': [
                {
                    'label': 'Sales',
                    'data': [sales_by_day[label] for label in labels],
                    'borderColor': '#297FB0',
                    'backgroundColor': 'rgba(41,127,176,0.08)',
                    'tension': 0.4
                }
            ]
        }
        return data
    except Exception as e:
        logging.exception('Error while generating sales chart')
        return {'success': False, 'message': 'An error occurred while generating sales chart'}, 500

@app.route('/stock_chart', methods=['GET'])
def stock_chart():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT name, stock FROM products')
        products = cursor.fetchall()
        labels = [p['name'] for p in products]
        stock_data = [int(p['stock']) for p in products]
        data = {
            'labels': labels,
            'datasets': [
                {
                    'label': 'Stock',
                    'data': stock_data,
                    'backgroundColor': '#3498db',
                    'borderColor': '#297FB0',
                    'borderWidth': 1
                }
            ]
        }
        return data
    except Exception as e:
        logging.exception('Error while generating stock chart')
        return {'success': False, 'message': 'An error occurred while generating stock chart'}, 500

@app.route('/dashboard_summary', methods=['GET'])
def dashboard_summary():
    if 'loggedin' not in session:
        return {'success': False, 'message': 'Unauthorized'}, 401
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        # Total products
        cursor.execute('SELECT COUNT(*) as total FROM products')
        total_products = cursor.fetchone()['total']
        # Total orders
        cursor.execute('SELECT COUNT(*) as total FROM orders')
        total_orders = cursor.fetchone()['total']
        # Low stock (stock <= 5)
        cursor.execute('SELECT COUNT(*) as low_stock FROM products WHERE stock <= 5')
        low_stock = cursor.fetchone()['low_stock']
        return {
            'success': True,
            'total_products': total_products,
            'total_orders': total_orders,
            'low_stock': low_stock
        }
    except Exception as e:
        logging.exception('Error while fetching dashboard summary')
        return {'success': False, 'message': 'An error occurred while fetching dashboard summary'}, 500

if __name__ == '__main__':
    app.run(debug=True)
