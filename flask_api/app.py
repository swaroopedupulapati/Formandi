# app.py
from flask import Flask, request, jsonify
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from bson.binary import Binary
from datetime import datetime, timedelta
import base64
import os

# ---------- Configuration ----------
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Secret keys (change in production; use env vars)
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)

jwt = JWTManager(app)

# MongoDB connection (use your URI)
MONGO_URI = os.environ.get(
    "MONGO_URI",
    "mongodb+srv://i_am_swaroop:swaroop%402004@theswaroopdb.ofpw0zm.mongodb.net/?retryWrites=true&w=majority&appName=theswaroopdb"
)
client = MongoClient(MONGO_URI)
db = client["market_db"]

# Collections
users_coll = db["users"]
produce_coll = db["produce"]
orders_coll = db["orders"]

# ---------- Helpers ----------
def obj_id(o):
    return str(o) if not isinstance(o, ObjectId) else str(o)

def serialize_produce(item):
    """Convert produce document to JSON-serializable dict."""
    out = {
        "id": str(item["_id"]),
        "farmer_id": str(item["farmer_id"]),
        "name": item.get("name"),
        "category": item.get("category"),
        "price": item.get("price"),
        "quantity": item.get("quantity"),
        "listed_on": item.get("listed_on").isoformat() if isinstance(item.get("listed_on"), datetime) else item.get("listed_on"),
        "status": item.get("status"),
    }
    if item.get("image_data") and item.get("image_type"):
        try:
            b64 = base64.b64encode(item["image_data"]).decode("utf-8")
            out["photo"] = f"data:{item['image_type']};base64,{b64}"
        except Exception:
            out["photo"] = ""
    else:
        out["photo"] = ""
    return out

def serialize_order(order_doc):
    out = {
        "_id": str(order_doc.get("_id")),
        "produce_id": str(order_doc.get("produce_id")),
        "farmer_id": str(order_doc.get("farmer_id")),
        "buyer_id": str(order_doc.get("buyer_id")),
        "quantity": order_doc.get("quantity"),
        "offer_price": order_doc.get("offer_price"),
        "status": order_doc.get("status"),
        "created_at": order_doc.get("created_at").isoformat() if isinstance(order_doc.get("created_at"), datetime) else order_doc.get("created_at")
    }
    return out

# ---------- Auth ----------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    required = ["name", "email", "password", "user_type", "pincode", "village", "district", "state"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    email = data["email"].strip().lower()
    if users_coll.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    hashed = generate_password_hash(data["password"])
    user_doc = {
        "name": data["name"],
        "email": email,
        "password": hashed,
        "user_type": data["user_type"],
        "pincode": data["pincode"],
        "village": data["village"],
        "district": data["district"],
        "state": data["state"],
        "created_at": datetime.utcnow()
    }
    res = users_coll.insert_one(user_doc)
    return jsonify({"message": "Registration successful", "user_id": str(res.inserted_id)}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    if not data.get("email") or not data.get("password") or not data.get("user_type"):
        return jsonify({"error": "Missing credentials"}), 400

    email = data["email"].strip().lower()
    user = users_coll.find_one({"email": email, "user_type": data["user_type"]})
    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user["_id"]))
    return jsonify({
        "access_token": access_token,
        "user_id": str(user["_id"]),
        "name": user["name"],
        "user_type": user["user_type"]
    }), 200

# ---------- Farmer endpoints ----------
@app.route("/api/farmer/dashboard", methods=["GET"])
@jwt_required()
def farmer_dashboard():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    farmer_id = ObjectId(user_id)
    total_produce = produce_coll.count_documents({"farmer_id": farmer_id})
    total_orders = orders_coll.count_documents({"farmer_id": farmer_id})
    accepted_orders = orders_coll.count_documents({"farmer_id": farmer_id, "status": "Accepted"})
    pending_orders = orders_coll.count_documents({"farmer_id": farmer_id, "status": "Pending"})

    return jsonify({
        "name": user_obj["name"],
        "total_produce": total_produce,
        "total_orders": total_orders,
        "accepted_orders": accepted_orders,
        "pending_orders": pending_orders
    }), 200

@app.route("/api/farmer/produce", methods=["POST"])
@jwt_required()
def farmer_add_produce():
    """
    Accepts multipart/form-data:
      fields: name, category, price, quantity
      file: image (optional)
    """
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    name = request.form.get("name")
    category = request.form.get("category")
    price = request.form.get("price")
    quantity = request.form.get("quantity")

    if not name or price is None or quantity is None:
        return jsonify({"error": "Missing fields (name/price/quantity)"}), 400

    try:
        price = float(price)
        quantity = float(quantity)
    except ValueError:
        return jsonify({"error": "Invalid numeric values for price or quantity"}), 400

    image = request.files.get("image")
    image_data = None
    image_type = None
    if image:
        image_data = Binary(image.read())
        image_type = image.mimetype

    doc = {
        "farmer_id": ObjectId(user_id),
        "name": name,
        "category": category,
        "price": price,
        "quantity": quantity,
        "listed_on": datetime.utcnow(),
        "status": "Available",
        "image_data": image_data,
        "image_type": image_type
    }
    res = produce_coll.insert_one(doc)
    return jsonify({"message": "Produce added", "produce_id": str(res.inserted_id)}), 201

@app.route("/api/farmer/produce", methods=["GET"])
@jwt_required()
def farmer_list_produce():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    items = list(produce_coll.find({"farmer_id": ObjectId(user_id)}))
    out = [serialize_produce(it) for it in items]
    return jsonify(out), 200

@app.route("/api/farmer/produce/<produce_id>", methods=["PUT"])
@jwt_required()
def farmer_edit_produce(produce_id):
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    item = produce_coll.find_one({"_id": ObjectId(produce_id)})
    if not item or item["farmer_id"] != ObjectId(user_id):
        return jsonify({"error": "Not found or permission denied"}), 404

    # Accept form-data for updates (price, quantity, status, optional image)
    price = request.form.get("price")
    quantity = request.form.get("quantity")
    status = request.form.get("status")
    updates = {}
    if price is not None:
        try:
            updates["price"] = float(price)
        except ValueError:
            return jsonify({"error": "Invalid price"}), 400
    if quantity is not None:
        try:
            updates["quantity"] = float(quantity)
        except ValueError:
            return jsonify({"error": "Invalid quantity"}), 400
    if status is not None:
        updates["status"] = status

    image = request.files.get("image")
    if image:
        updates["image_data"] = Binary(image.read())
        updates["image_type"] = image.mimetype

    if updates:
        produce_coll.update_one({"_id": ObjectId(produce_id)}, {"$set": updates})
        return jsonify({"message": "Produce updated"}), 200
    else:
        return jsonify({"error": "No updates provided"}), 400

@app.route("/api/farmer/produce/<produce_id>", methods=["DELETE"])
@jwt_required()
def farmer_delete_produce(produce_id):
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    res = produce_coll.delete_one({"_id": ObjectId(produce_id), "farmer_id": ObjectId(user_id)})
    if res.deleted_count == 0:
        return jsonify({"error": "Not found or permission denied"}), 404
    return jsonify({"message": "Produce deleted"}), 200

@app.route("/api/farmer/orders", methods=["GET"])
@jwt_required()
def farmer_get_orders():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    farmer_id = ObjectId(user_id)
    orders_cursor = orders_coll.find({"farmer_id": farmer_id}).sort("created_at", -1)
    out = []
    for o in orders_cursor:
        buyer = users_coll.find_one({"_id": o["buyer_id"]})
        prod = produce_coll.find_one({"_id": o["produce_id"]})
        od = serialize_order(o)
        od["buyer_name"] = buyer["name"] if buyer else "Unknown"
        od["produce_name"] = prod["name"] if prod else "Unknown"
        out.append(od)
    return jsonify(out), 200


@app.route('/api/farmer/order/<order_id>/<action>', methods=['PUT'])
@jwt_required()

def api_farmer_update_order(order_id, action):
    # ✅ Check farmer authentication
    if 'user_id' not in session or session.get('user_type') != 'farmer':
        return jsonify({"error": "Unauthorized access"}), 403

    # ✅ Find the order
    order = db.orders.find_one({'_id': ObjectId(order_id)})
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # ✅ Valid actions
    valid_actions = {
        'accept': 'Accepted',
        'reject': 'Rejected',
        'pack': 'Packed',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered'
    }

    if action not in valid_actions:
        return jsonify({"error": "Invalid action"}), 400

    new_status = valid_actions[action]

    # ✅ Update order status
    db.orders.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'status': new_status}}
    )

    # ✅ Notify buyer
    produce = db.produce.find_one({'_id': order['produce_id']})
    db.notifications.insert_one({
        "user_id": order['buyer_id'],
        "message": f"Your order for {produce['name']} is now {new_status}.",
        "created_at": datetime.now(),
        "is_read": False
    })

    # ✅ If delivered, reduce stock
    if new_status == "Delivered":
        db.produce.update_one(
            {'_id': order['produce_id']},
            {'$inc': {'quantity': -order['quantity']}}
        )

    return jsonify({
        "message": f"Order marked as {new_status}.",
        "status": new_status,
        "order_id": order_id
    }), 200
@app.route("/api/farmer/orders/<order_id>/reject", methods=["PUT"])
@jwt_required()
def farmer_reject_order(order_id):
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    res = orders_coll.update_one({"_id": ObjectId(order_id), "farmer_id": ObjectId(user_id)}, {"$set": {"status": "Rejected"}})
    if res.matched_count == 0:
        return jsonify({"error": "Order not found or permission denied"}), 404
    return jsonify({"message": "Order rejected"}), 200

@app.route("/api/farmer/notifications", methods=["GET"])
@jwt_required()
def farmer_notifications():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "farmer":
        return jsonify({"error": "Unauthorized"}), 403

    farmer_id = ObjectId(user_id)
    orders_cursor = orders_coll.find({"farmer_id": farmer_id}).sort("created_at", -1)
    notifications = []
    for o in orders_cursor:
        buyer = users_coll.find_one({"_id": o["buyer_id"]})
        prod = produce_coll.find_one({"_id": o["produce_id"]})
        msg = f"{buyer['name']} placed an order for {o['quantity']} kg of {prod['name']} - Status: {o['status']}"
        notifications.append({"message": msg, "date": o["created_at"].isoformat()})
    return jsonify(notifications), 200

# ---------- Buyer endpoints ----------


@app.route("/api/buyer/dashboard", methods=["GET"])
@jwt_required()
def buyer_dashboard():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "buyer":
        return jsonify({"error": "Unauthorized"}), 403

    buyer_id = ObjectId(user_id)
    total_orders = orders_coll.count_documents({"buyer_id": buyer_id})
    accepted_orders = orders_coll.count_documents({"buyer_id": buyer_id, "status": "Accepted"})
    rejected_orders = orders_coll.count_documents({"buyer_id": buyer_id, "status": "Rejected"})
    
    return jsonify({
        "name": user_obj["name"],
        "total_orders": total_orders,
        "accepted_orders": accepted_orders,
        "rejected_orders": rejected_orders
    }), 200


    
@app.route("/api/buyer/produce", methods=["GET"])
@jwt_required()
def buyer_list_produce():
    # returns all available produce
    items = list(produce_coll.find({"status": "Available"}))
    out = [serialize_produce(it) for it in items]
    return jsonify(out), 200



@app.route('/api/buyer/produce/<produce_id>', methods=['GET', 'POST'])
@jwt_required()
def api_buyer_view_produce(produce_id):
    
    # ✅ Fetch the produce
    produce = db.produce.find_one({'_id': ObjectId(produce_id), 'status': 'Available'})
    if not produce:
        return jsonify({"error": "Produce not found or unavailable"}), 404

    # ✅ Get farmer details
    farmer = db.users.find_one({'_id': produce['farmer_id']})

    # ✅ Convert image to base64
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

    # ✅ If GET — return produce details
    if request.method == 'GET':
        return jsonify({
            "produce": produce_data
        }), 200

    # ✅ If POST — handle order placement
    if request.method == 'POST':
        data = request.get_json()

        # Validate inputs
        try:
            quantity = int(data.get('quantity', 0))
            offer_price = float(data.get('offer_price', 0))
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid input for quantity or price"}), 400

        if quantity <= 0 or quantity > produce['quantity']:
            return jsonify({"error": "Invalid quantity selected"}), 400

        buyer_details = {
            'name': data.get('buyer_name', ''),
            'phone': data.get('buyer_phone', ''),
            'address': data.get('buyer_address', '')
        }

        # ✅ Create order
        db.orders.insert_one({
            'produce_id': produce['_id'],
            'farmer_id': produce['farmer_id'],
            'buyer_id': ObjectId(session['user_id']),
            'quantity': quantity,
            'offer_price': offer_price,
            'status': 'Pending',
            'created_at': datetime.now(),
            'buyer_details': buyer_details
        })

        return jsonify({
            "message": "Order placed successfully",
            "produce_id": str(produce['_id']),
            "status": "Pending"
        }), 201
@app.route("/api/buyer/orders", methods=["POST"])
@jwt_required()
def buyer_place_order():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "buyer":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json(force=True)
    required = ["produce_id", "quantity", "offer_price"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    prod = produce_coll.find_one({"_id": ObjectId(data["produce_id"]), "status": "Available"})
    if not prod:
        return jsonify({"error": "Invalid produce"}), 400

    try:
        qty = int(data["quantity"])
        offer = float(data["offer_price"])
    except ValueError:
        return jsonify({"error": "Invalid numeric values"}), 400

    if qty <= 0 or qty > prod["quantity"]:
        return jsonify({"error": "Invalid quantity"}), 400

    order = {
        "produce_id": prod["_id"],
        "farmer_id": prod["farmer_id"],
        "buyer_id": ObjectId(user_id),
        "quantity": qty,
        "offer_price": offer,
        "status": "Pending",
        "created_at": datetime.utcnow()
    }
    res = orders_coll.insert_one(order)
    return jsonify({"message": "Order placed", "order_id": str(res.inserted_id)}), 201

@app.route("/api/buyer/orders", methods=["GET"])
@jwt_required()
def buyer_get_orders():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "buyer":
        return jsonify({"error": "Unauthorized"}), 403

    pipeline = [
        {"$match": {"buyer_id": ObjectId(user_id)}},
        {"$lookup": {
            "from": "produce",
            "localField": "produce_id",
            "foreignField": "_id",
            "as": "produce"
        }},
        {"$unwind": {"path": "$produce", "preserveNullAndEmptyArrays": True}},
        {"$sort": {"created_at": -1}}
    ]
    results = list(orders_coll.aggregate(pipeline))
    out = []
    for r in results:
        o = serialize_order(r)
        o["produce_name"] = r.get("produce", {}).get("name", "Unknown")
        out.append(o)
    return jsonify(out), 200

@app.route("/api/buyer/notifications", methods=["GET"])
@jwt_required()
def buyer_notifications():
    user_id = get_jwt_identity()
    user_obj = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user_obj or user_obj.get("user_type") != "buyer":
        return jsonify({"error": "Unauthorized"}), 403

    orders_cursor = orders_coll.find({"buyer_id": ObjectId(user_id)}).sort("created_at", -1)
    notifications = []
    for o in orders_cursor:
        prod = produce_coll.find_one({"_id": o["produce_id"]})
        farmer = users_coll.find_one({"_id": o["farmer_id"]})
        msg = f"Your order for {o['quantity']} kg of {prod['name']} from {farmer['name']} is {o['status']}"
        notifications.append({"message": msg, "date": o["created_at"].isoformat()})
    return jsonify(notifications), 200

# ---------- Misc ----------
@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()}), 200

# ---------- Run ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
