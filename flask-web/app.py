from flask import Flask, render_template, request, redirect, url_for, session, flash
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime




app = Flask(__name__)
app.secret_key = 'your_secret_key'
# app.config.update(
#     SESSION_COOKIE_SAMESITE="None",   # allow cookies across origins (Cordova WebView)
#     SESSION_COOKIE_SECURE=False       # False for HTTP (local/dev), True for HTTPS (prod)
# )

# MongoDB Setup
# client = MongoClient("mongodb://localhost:27017/")
mydb = "mongodb+srv://i_am_swaroop:swaroop%402004@theswaroopdb.ofpw0zm.mongodb.net/?retryWrites=true&w=majority&appName=theswaroopdb"
client = MongoClient(mydb)
db = client["market_db"]
users_collection = db["users"]
produce_collection = db["produce"]
orders_collection = db["orders"]



@app.route('/')
def home():
    return render_template('auth.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form['name']
    email = request.form['email']
    password = request.form['password']
    user_type = request.form['user_type']
    pincode = request.form['pincode']
    village = request.form['village']
    district = request.form['district']
    state = request.form['state']

    if users_collection.find_one({'email': email}):
        flash("Email or Phone already registered. Please login.", "error")
        return redirect(url_for('home'))

    hashed_pw = generate_password_hash(password)
    users_collection.insert_one({
        'name': name,
        'email': email,
        'password': hashed_pw,
        'user_type': user_type,
        'pincode': pincode,
        'village': village,
        'district': district,
        'state': state
    })

    flash("Registration successful. Please login.", "success")
    return redirect(url_for('home'))

@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']
    user_type = request.form['user_type']

    user = users_collection.find_one({
        'email': email,
        'user_type': user_type
    })

    if user and check_password_hash(user['password'], password):
        session['user_id'] = str(user['_id'])
        session['user_name'] = user['name']
        session['user_type'] = user['user_type']
        flash("Login successful!", "success")
        if user_type == 'farmer':
            return redirect(url_for('farmer_dashboard'))
        elif user_type == 'buyer':
            return redirect(url_for('buyer_dashboard'))
        
        return redirect(url_for('dashboard'))

    flash("Invalid credentials or user type.", "error")
    return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('home'))

    return f"Welcome {session['user_name']}! You are logged in as a {session['user_type']}."

@app.route('/logout')
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for('home'))


@app.route('/farmer/dashboard')
def farmer_dashboard():
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    farmer_id = ObjectId(session['user_id'])

    total_produce = db.produce.count_documents({'farmer_id': farmer_id})
    total_orders = db.orders.count_documents({'farmer_id': farmer_id})
    accepted_orders = db.orders.count_documents({'farmer_id': farmer_id, 'status': 'Accepted'})
    pending_orders = db.orders.count_documents({'farmer_id': farmer_id, 'status': 'Pending'})

    if pending_orders > 0:
        flash(f"🛎️ You have {pending_orders} new order(s) pending!", "info")

    return render_template(
        'farmer_dashboard.html',
        name=session['user_name'],
        total_produce=total_produce,
        total_orders=total_orders,
        accepted_orders=accepted_orders
    )



import base64

@app.template_filter('b64encode')
def b64encode_filter(data):
    return base64.b64encode(data).decode('utf-8')

from bson.binary import Binary
from datetime import datetime

@app.route('/farmer/add', methods=['GET', 'POST'])
def farmer_add():
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    if request.method == 'POST':
        name = request.form['name']
        category = request.form['category']
        price = float(request.form['price'])
        quantity = float(request.form['quantity'])

        image = request.files.get('image')
        image_data = None
        image_type = None

        if image and image.filename:
            image_data = Binary(image.read())
            image_type = image.mimetype

        db['produce'].insert_one({
            "farmer_id": ObjectId(session['user_id']),
            "name": name,
            "category": category,
            "price": price,
            "quantity": quantity,
            "listed_on": datetime.today().strftime('%Y-%m-%d'),
            "status": "Available",
            "image_data": image_data,
            "image_type": image_type
        })

        flash("Produce added successfully.", "success")
        return redirect(url_for('farmer_my_produce'))

    return render_template('farmer_add.html')


@app.route('/farmer/my-produce')
def farmer_my_produce():
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    produce = list(produce_collection.find({"farmer_id": ObjectId(session['user_id'])}))
    return render_template('farmer_my_produce.html', produce=produce)



from bson.objectid import ObjectId
from bson.binary import Binary

@app.route('/farmer/edit/<produce_id>', methods=['GET', 'POST'])
def farmer_edit_produce(produce_id):
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    produce = db['produce'].find_one({"_id": ObjectId(produce_id)})

    if not produce or produce['farmer_id'] != ObjectId(session['user_id']):
        flash("Produce not found or permission denied", "error")
        return redirect(url_for('farmer_my_produce'))

    if request.method == 'POST':
        updated_fields = {
            "price": float(request.form['price']),
            "quantity": float(request.form['quantity']),
            "status": request.form['status']
        }

        image = request.files.get('image')
        if image and image.filename:
            updated_fields['image_data'] = Binary(image.read())
            updated_fields['image_type'] = image.mimetype

        db['produce'].update_one(
            {"_id": ObjectId(produce_id)},
            {"$set": updated_fields}
        )

        flash("Produce updated successfully.", "success")
        return redirect(url_for('farmer_my_produce'))

    return render_template('farmer_edit_produce.html', item=produce)




@app.route('/farmer/delete/<produce_id>')
def farmer_delete_produce(produce_id):
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    produce_collection.delete_one({"_id": ObjectId(produce_id), "farmer_id": ObjectId(session['user_id'])})
    flash("Produce deleted.", "success")
    return redirect(url_for('farmer_my_produce'))


from bson.objectid import ObjectId
from datetime import datetime
'''
@app.route('/farmer/orders')
def farmer_orders():
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    orders = db.orders.find({'farmer_id': ObjectId(session['user_id'])})
    result = []

    for order in orders:
        buyer = db.users.find_one({'_id': order['buyer_id']})
        produce = db.produce.find_one({'_id': order['produce_id']})
        result.append({
            '_id': str(order['_id']),
            'buyer_name': buyer['name'] if buyer else 'Unknown',
            'produce_name': produce['name'] if produce else 'Unknown',
            'quantity': order['quantity'],
            'offer_price': order['offer_price'],
            'status': order['status'],
            'created_at': order['created_at'].strftime('%Y-%m-%d')
        })

    return render_template('farmer_orders.html', orders=result)
'''



@app.route('/farmer/orders')
def farmer_orders():
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    farmer_id = ObjectId(session['user_id'])

    pipeline = [
        {"$match": {"farmer_id": farmer_id}},
        {
            "$lookup": {
                "from": "produce",
                "localField": "produce_id",
                "foreignField": "_id",
                "as": "produce"
            }
        },
        {"$unwind": "$produce"},
        {"$sort": {"created_at": -1}}
    ]

    orders = list(db.orders.aggregate(pipeline))

    # Flatten data for easier template access
    formatted_orders = []
    for order in orders:
        buyer_details = order.get("buyer_details", {})
        formatted_orders.append({
            "_id": str(order["_id"]),
            "produce_name": order["produce"]["name"],
            "quantity": order["quantity"],
            "offer_price": order["offer_price"],
            "status": order["status"],
            "buyer_name": buyer_details.get("name", "—"),
            "buyer_phone": buyer_details.get("phone", "—"),
            "buyer_address": buyer_details.get("address", "—"),
        })

    return render_template('farmer_orders.html', orders=formatted_orders)


@app.route('/farmer/order/<order_id>/<action>')
def farmer_update_order(order_id, action):
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    order = db.orders.find_one({'_id': ObjectId(order_id)})
    if not order:
        flash("Order not found.", "error")
        return redirect(url_for('farmer_orders'))

    valid_actions = {
        'accept': 'Accepted',
        'reject': 'Rejected',
        'pack': 'Packed',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered'
    }

    if action not in valid_actions:
        flash("Invalid action.", "error")
        return redirect(url_for('farmer_orders'))

    new_status = valid_actions[action]
    db.orders.update_one({'_id': ObjectId(order_id)}, {'$set': {'status': new_status}})

    # ✅ Buyer notification
    produce = db.produce.find_one({'_id': order['produce_id']})
    db.notifications.insert_one({
        "user_id": order['buyer_id'],
        "message": f"Your order for {produce['name']} is now {new_status}.",
        "created_at": datetime.now(),
        "is_read": False
    })

    # ✅ Optional: Reduce produce quantity if delivered
    if new_status == "Delivered":
        db.produce.update_one(
            {'_id': order['produce_id']},
            {'$inc': {'quantity': -order['quantity']}}
        )

    flash(f"Order marked as {new_status}.", "success")
    return redirect(url_for('farmer_orders'))



@app.route('/farmer/orders/accept/<order_id>')
def farmer_accept_order(order_id):
    db.orders.update_one({'_id': ObjectId(order_id)}, {'$set': {'status': 'Accepted'}})
    flash("Order accepted!", "success")
    return redirect(url_for('farmer_orders'))

@app.route('/farmer/orders/reject/<order_id>')
def farmer_reject_order(order_id):
    db.orders.update_one({'_id': ObjectId(order_id)}, {'$set': {'status': 'Rejected'}})
    flash("Order rejected.", "info")
    return redirect(url_for('farmer_orders'))
'''
@app.route('/farmer/order/<order_id>/<action>')
def farmer_update_order(order_id, action):
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    order = db.orders.find_one({'_id': ObjectId(order_id)})
    if not order:
        flash("Order not found.", "error")
        return redirect(url_for('farmer_orders'))

    if action.lower() in ['accept', 'reject']:
        new_status = 'Accepted' if action.lower() == 'accept' else 'Rejected'
        db.orders.update_one({'_id': ObjectId(order_id)}, {'$set': {'status': new_status}})
        
        # 🔔 Send buyer notification
        produce = db.produce.find_one({'_id': order['produce_id']})
        db.notifications.insert_one({
            "user_id": order['buyer_id'],
            "message": f"Your order for {produce['name']} was {new_status.lower()}.",
            "created_at": datetime.now(),
            "is_read": False
        })

        flash(f"Order {new_status.lower()} successfully.", "success")
    else:
        flash("Invalid action.", "error")

    return redirect(url_for('farmer_orders'))


notifications_collection = db['notifications']
'''
@app.route('/farmer/notifications')
def farmer_notifications():
    if 'user_id' not in session or session['user_type'] != 'farmer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    farmer_id = ObjectId(session['user_id'])

    orders = db.orders.find({'farmer_id': farmer_id}).sort('created_at', -1)
    notifications = []

    for order in orders:
        produce = db.produce.find_one({'_id': order['produce_id']})
        buyer = db.users.find_one({'_id': order['buyer_id']})

        message = f"{buyer['name']} placed an order for {order['quantity']} kg of {produce['name']} - Status: {order['status']}"
        notifications.append({
            'message': message,
            'date': order['created_at'].strftime('%Y-%m-%d %H:%M')
        })

    return render_template('farmer_notifications.html', notifications=notifications)





#-------------buyer routes----------------

from bson.objectid import ObjectId
from flask import render_template, session, redirect, url_for, flash

@app.route('/buyer/dashboard')
def buyer_dashboard():
    if 'user_id' not in session or session.get('user_type') != 'buyer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    buyer_id = ObjectId(session['user_id'])

    total_orders = db.orders.count_documents({'buyer_id': buyer_id})
    accepted_orders = db.orders.count_documents({'buyer_id': buyer_id, 'status': 'Accepted'})
    rejected_orders = db.orders.count_documents({'buyer_id': buyer_id, 'status': 'Rejected'})

    return render_template(
        'buyer_dashboard.html',
        name=session['user_name'],
        total_orders=total_orders,
        accepted_orders=accepted_orders,
        rejected_orders=rejected_orders
    )

import base64

@app.route('/buyer/produce')
def buyer_produce():
    if 'user_id' not in session or session['user_type'] != 'buyer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    produce_items = db.produce.find({'status': 'Available'})

    listings = []
    for item in produce_items:
        farmer = db.users.find_one({'_id': item['farmer_id']})

        # Convert image binary to base64
        photo = ''
        if item.get('image_data') and item.get('image_type'):
            image_binary = item['image_data']
            image_type = item['image_type']
            photo = f"data:{image_type};base64," + base64.b64encode(image_binary).decode('utf-8')
        else:
            # Fallback image (optional)
            with open('static/default.png', 'rb') as f:
                fallback = base64.b64encode(f.read()).decode('utf-8')
                photo = f"data:image/png;base64,{fallback}"

        listings.append({
            'id': str(item['_id']),
            'name': item['name'],
            'category': item['category'],
            'price': item['price'],
            'quantity': item['quantity'],
            'photo': photo,
            'farmer_name': farmer['name'] if farmer else "Unknown"
        })

    return render_template('buyer_produce.html', listings=listings)

from datetime import datetime
import base64
'''
@app.route('/buyer/produce/<produce_id>')
def buyer_view_produce(produce_id):
    if 'user_id' not in session or session['user_type'] != 'buyer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    produce = db.produce.find_one({'_id': ObjectId(produce_id), 'status': 'Available'})
    if not produce:
        flash("Produce not found or unavailable.", "error")
        return redirect(url_for('buyer_produce'))

    farmer = db.users.find_one({'_id': produce['farmer_id']})
    produce_data = {
        'id': produce_id,
        'name': produce['name'],
        'category': produce['category'],
        'price': produce['price'],
        'quantity': produce['quantity'],
        'photo': produce.get('photo_base64', ''),
        'farmer_name': farmer['name'] if farmer else 'Unknown'
    }

    return render_template('buyer_view_produce.html', produce=produce_data)


@app.route('/buyer/produce/<produce_id>', methods=['POST'])
def buyer_place_order(produce_id):
    if 'user_id' not in session or session['user_type'] != 'buyer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    produce = db.produce.find_one({'_id': ObjectId(produce_id)})
    if not produce or produce['status'] != 'Available':
        flash("Invalid or unavailable produce.", "error")
        return redirect(url_for('buyer_produce'))

    try:
        quantity = int(request.form['quantity'])
        offer_price = float(request.form['offer_price'])
    except ValueError:
        flash("Invalid quantity or price input.", "error")
        return redirect(url_for('buyer_view_produce', produce_id=produce_id))

    if quantity <= 0 or quantity > produce['quantity']:
        flash("Invalid quantity.", "error")
        return redirect(url_for('buyer_view_produce', produce_id=produce_id))

    order = {
        'produce_id': produce['_id'],
        'farmer_id': produce['farmer_id'],
        'buyer_id': ObjectId(session['user_id']),
        'quantity': quantity,
        'offer_price': offer_price,
        'status': 'Pending',
        'created_at': datetime.now()
    }

    db.orders.insert_one(order)
    flash("Order placed successfully.", "success")
    return redirect(url_for('buyer_orders'))
'''


@app.route('/buyer/produce/<produce_id>', methods=['GET', 'POST'])
def buyer_view_produce(produce_id):
    if 'user_id' not in session or session['user_type'] != 'buyer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    produce = db.produce.find_one({'_id': ObjectId(produce_id), 'status': 'Available'})
    if not produce:
        flash("Produce not found or unavailable.", "error")
        return redirect(url_for('buyer_produce'))

    farmer = db.users.find_one({'_id': produce['farmer_id']})

    # Convert image to base64
    photo = ''
    if produce.get('image_data'):
        photo = f"data:{produce['image_type']};base64," + base64.b64encode(produce['image_data']).decode('utf-8')

    produce_data = {
        'id': str(produce['_id']),
        'name': produce['name'],
        'category': produce['category'],
        'price': produce['price'],
        'quantity': produce['quantity'],
        'photo': photo,
        'farmer_name': farmer['name'] if farmer else "Unknown"
    }

    # Handle order placement
    if request.method == 'POST':
        try:
            quantity = int(request.form['quantity'])
            offer_price = float(request.form['offer_price'])
        except ValueError:
            flash("Invalid input for quantity or price.", "error")
            return redirect(url_for('buyer_view_produce', produce_id=produce_id))

        if quantity <= 0 or quantity > produce['quantity']:
            flash("Invalid quantity selected.", "error")
            return redirect(url_for('buyer_view_produce', produce_id=produce_id))

        buyer_name = request.form['buyer_name']
        buyer_phone = request.form['buyer_phone']
        buyer_address = request.form['buyer_address']

        db.orders.insert_one({
            'produce_id': produce['_id'],
            'farmer_id': produce['farmer_id'],
            'buyer_id': ObjectId(session['user_id']),
            'quantity': quantity,
            'offer_price': offer_price,
            'status': 'Pending',
            'created_at': datetime.now(),
            'buyer_details': {
                'name': buyer_name,
                'phone': buyer_phone,
                'address': buyer_address
            }
        })

        flash("Order placed successfully!", "success")
        return redirect(url_for('buyer_orders'))

    return render_template('buyer_view_produce.html', produce=produce_data)




@app.route('/buyer/orders')
def buyer_orders():
    if 'user_id' not in session or session['user_type'] != 'buyer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    buyer_id = ObjectId(session['user_id'])

    pipeline = [
        {"$match": {"buyer_id": buyer_id}},
        {
            "$lookup": {
                "from": "produce",
                "localField": "produce_id",
                "foreignField": "_id",
                "as": "produce"
            }
        },
        {"$unwind": "$produce"},
        {
            "$project": {
                "produce_name": "$produce.name",
                "quantity": 1,
                "offer_price": 1,
                "status": 1,
                "created_at": 1
            }
        },
        {"$sort": {"created_at": -1}}
    ]

    orders = list(db.orders.aggregate(pipeline))

    return render_template("buyer_orders.html", orders=orders)


@app.route('/buyer/notifications')
def buyer_notifications():
    if 'user_id' not in session or session['user_type'] != 'buyer':
        flash("Unauthorized access", "error")
        return redirect(url_for('home'))

    buyer_id = ObjectId(session['user_id'])
    notifications = list(db.notifications.find(
        {"user_id": buyer_id}
    ).sort("created_at", -1))

    return render_template("buyer_notifications.html", notifications=notifications)































if __name__ == '__main__':
    app.run(debug=True, port=5050)
