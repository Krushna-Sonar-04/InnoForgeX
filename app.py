from flask import Flask
from flask_cors import CORS

from database.db import mysql

from routes.claims import claims_bp
from routes.dashboard import dashboard_bp
from routes.fraud import fraud_bp

app = Flask(__name__)

CORS(app)

# LOAD CONFIG FILE
app.config.from_pyfile('config.py')

# INITIALIZE MYSQL
mysql.init_app(app)

# REGISTER ROUTES
app.register_blueprint(claims_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(fraud_bp)

@app.route("/")
def home():
    return {
        "message": "ClaimShield AI Backend Running"
    }

if __name__ == "__main__":
    app.run(debug=True)