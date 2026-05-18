from flask import Blueprint, request, jsonify
from database.db import mysql
import bcrypt
import jwt
import datetime

auth_bp = Blueprint("auth", __name__)
SECRET_KEY = "super_secret_claimshield_key"

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "admin")

        if not all([name, email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        cursor = mysql.connection.cursor()
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute("INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)", (name, email, hashed, role))
        mysql.connection.commit()
        cursor.close()

        return jsonify({"success": True, "message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT name, email, password, role FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            token = jwt.encode({
                "email": email,
                "role": user[3],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY, algorithm="HS256")
            
            return jsonify({
                "access_token": token,
                "user": {
                    "name": user[0],
                    "email": user[1],
                    "role": user[3]
                }
            }), 200

        return jsonify({"error": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
