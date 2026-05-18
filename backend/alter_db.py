import MySQLdb
import config

try:
    db = MySQLdb.connect(
        host=config.MYSQL_HOST,
        user=config.MYSQL_USER,
        passwd=config.MYSQL_PASSWORD,
        db=config.MYSQL_DB
    )
    cursor = db.cursor()
    
    # Add columns if they don't exist
    try:
        cursor.execute("ALTER TABLE claims ADD COLUMN patient_name VARCHAR(100) AFTER patient_id;")
    except Exception as e:
        print(f"Column patient_name might already exist: {e}")
        
    try:
        cursor.execute("ALTER TABLE claims ADD COLUMN provider_name VARCHAR(100) AFTER provider_id;")
    except Exception as e:
        print(f"Column provider_name might already exist: {e}")

    db.commit()
    print("Database altered successfully!")
    cursor.close()
    db.close()
except Exception as e:
    print(f"Error altering database: {e}")
