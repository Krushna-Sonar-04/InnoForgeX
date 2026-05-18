import MySQLdb
import config

try:
    # Connect to MySQL server (without specifying DB, to create it if it doesn't exist)
    db = MySQLdb.connect(
        host=config.MYSQL_HOST,
        user=config.MYSQL_USER,
        passwd=""
    )
    cursor = db.cursor()

    print("Creating database...")
    cursor.execute("CREATE DATABASE IF NOT EXISTS claimshield_ai;")
    
    print("Using database...")
    cursor.execute("USE claimshield_ai;")

    print("Creating claims table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id VARCHAR(50),
        provider_id VARCHAR(50),
        amount DECIMAL(10,2),
        diagnosis VARCHAR(255),
        procedure_code VARCHAR(100),
        risk_score INT,
        risk_level VARCHAR(20),
        status VARCHAR(20),
        ai_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    print("Creating fraud_flags table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fraud_flags (
        id INT PRIMARY KEY AUTO_INCREMENT,
        claim_id INT,
        reason VARCHAR(255),
        severity VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    print("Creating users table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100),
        email VARCHAR(100),
        password VARCHAR(255),
        role VARCHAR(20)
    );
    """)

    db.commit()
    cursor.close()
    db.close()
    print("Database and tables created successfully!")

except Exception as e:
    print(f"An error occurred: {e}")
