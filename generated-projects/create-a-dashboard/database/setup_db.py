import sqlite3
import os
import logging
from typing import Optional

from database.config import DB_PATH

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def create_database(db_path: str = DB_PATH, schema_file: str = os.path.join(os.path.dirname(__file__), 'schema.sql')) -> Optional[sqlite3.Connection]:
    """
    Initializes the SQLite database and creates tables based on the schema file.
    """
    conn: Optional[sqlite3.Connection] = None
    try:
        conn = sqlite3.connect(db_path)
        cursor: sqlite3.Cursor = conn.cursor()

        with open(schema_file, 'r') as f:
            schema_sql: str = f.read()
            cursor.executescript(schema_sql)
        conn.commit()
        logging.info(f"Database '{db_path}' initialized and tables created successfully.")
        return conn
    except sqlite3.Error as e:
        logging.error(f"Error initializing database: {e}")
        if conn:
            conn.close()
        return None
    except FileNotFoundError:
        logging.error(f"Schema file not found at {schema_file}")
        return None

def seed_data(conn: sqlite3.Connection) -> None:
    """
    Inserts initial dummy data into the students and marks tables.
    """
    try:
        cursor: sqlite3.Cursor = conn.cursor()

        # Seed students
        cursor.execute("INSERT INTO students (name) VALUES (?)", ("Alice Smith",))
        alice_id: int = cursor.lastrowid
        cursor.execute("INSERT INTO students (name) VALUES (?)", ("Bob Johnson",))
        bob_id: int = cursor.lastrowid

        # Seed marks for Alice
        if alice_id:
            cursor.execute("INSERT INTO marks (student_id, subject, score) VALUES (?, ?, ?)", (alice_id, "Math", 85))
            cursor.execute("INSERT INTO marks (student_id, subject, score) VALUES (?, ?, ?)", (alice_id, "Science", 92))
        
        # Seed marks for Bob
        if bob_id:
            cursor.execute("INSERT INTO marks (student_id, subject, score) VALUES (?, ?, ?)", (bob_id, "Math", 78))
            cursor.execute("INSERT INTO marks (student_id, subject, score) VALUES (?, ?, ?)", (bob_id, "English", 88))

        conn.commit()
        logging.info("Initial data seeded successfully.")
    except sqlite3.Error as e:
        logging.error(f"Error seeding data: {e}")
        if conn:
            conn.rollback()

if __name__ == "__main__":
    logging.info("Starting database setup...")
    if os.path.exists(DB_PATH):
        logging.warning(f"Existing database found at '{DB_PATH}'. Deleting and recreating.")
        os.remove(DB_PATH)

    connection: Optional[sqlite3.Connection] = create_database()
    if connection:
        seed_data(connection)
        connection.close()
        logging.info("Database setup complete.")
    else:
        logging.error("Database setup failed.")
