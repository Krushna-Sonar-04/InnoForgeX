import os
import MySQLdb
import bcrypt
import sys

# Add the parent directory to sys.path so we can import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def setup_database():
    try:
        # 1. Connect to MySQL server (without specifying DB to create it if it doesn't exist)
        print("Connecting to MySQL server...")
        db = MySQLdb.connect(
            host=config.MYSQL_HOST,
            user=config.MYSQL_USER,
            passwd=config.MYSQL_PASSWORD
        )
        cursor = db.cursor()

        # 2. Read and parse SQL schema file
        schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'database_setup.sql')
        if not os.path.exists(schema_path):
            print(f"Error: Schema file not found at {schema_path}")
            return
            
        print(f"Reading database schema from {schema_path}...")
        with open(schema_path, 'r') as f:
            sql_script = f.read()

        # Split statements by semicolon and execute them
        statements = sql_script.split(';')
        for stmt in statements:
            clean_stmt = stmt.strip()
            if clean_stmt:
                cursor.execute(clean_stmt)
        
        db.commit()
        print("Database and tables initialized successfully!")

        # 3. Seed Default Admin User
        print("Seeding default administrator account...")
        cursor.execute("USE claimshield_ai;")
        cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@claimshield.com';")
        if cursor.fetchone()[0] == 0:
            hashed_pw = bcrypt.hashpw("Admin@123".encode('utf-8'), bcrypt.gensalt())
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                ("Admin User", "admin@claimshield.com", hashed_pw, "admin")
            )
            db.commit()
            print("Default Admin User seeded successfully!")
            print("   Email: admin@claimshield.com")
            print("   Password: Admin@123")
        else:
            print("Default Admin User already exists. Skipping seeding.")

        cursor.close()
        db.close()
        print("\nClaimShield Database Setup Complete!")

    except Exception as e:
        print(f"Database setup failed: {e}")

if __name__ == "__main__":
    setup_database()
