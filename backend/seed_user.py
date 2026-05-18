import MySQLdb
import bcrypt
import config

try:
    db = MySQLdb.connect(
        host=config.MYSQL_HOST,
        user=config.MYSQL_USER,
        passwd=config.MYSQL_PASSWORD,
        db=config.MYSQL_DB
    )
    cursor = db.cursor()
    hashed = bcrypt.hashpw("Admin@123".encode('utf-8'), bcrypt.gensalt())
    cursor.execute("INSERT INTO users (name, email, password, role) VALUES ('Admin User', 'admin@claimshield.com', %s, 'admin')", (hashed,))
    db.commit()
    print("Admin user seeded successfully!")
    cursor.close()
    db.close()
except Exception as e:
    print(f"Error seeding admin user: {e}")
