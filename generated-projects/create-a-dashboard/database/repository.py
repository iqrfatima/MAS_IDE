import sqlite3
import logging
from typing import List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

from database.config import DB_PATH

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@dataclass
class Student:
    id: Optional[int]
    name: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

@dataclass
class Mark:
    id: Optional[int]
    student_id: int
    subject: str
    score: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class DatabaseRepository:
    """
    A repository class for interacting with the students and marks SQLite database.
    Provides methods for CRUD operations on Student and Mark objects.
    """
    def __init__(self, db_path: str = DB_PATH) -> None:
        self.db_path: str = db_path
        self.conn: Optional[sqlite3.Connection] = None

    def connect(self) -> Optional[sqlite3.Connection]:
        """
        Establishes a connection to the database.
        """
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row # Allows accessing columns by name
            logging.info(f"Connected to database: {self.db_path}")
            return self.conn
        except sqlite3.Error as e:
            logging.error(f"Error connecting to database: {e}")
            return None

    def close(self) -> None:
        """
        Closes the database connection.
        """
        if self.conn:
            try:
                self.conn.close()
                self.conn = None
                logging.info(f"Disconnected from database: {self.db_path}")
            except sqlite3.Error as e:
                logging.error(f"Error closing database connection: {e}")

    def add_student(self, name: str) -> Optional[Student]:
        """
        Adds a new student to the database.
        """
        if not self.conn:
            logging.error("Database connection not established.")
            return None
        try:
            cursor: sqlite3.Cursor = self.conn.cursor()
            cursor.execute("INSERT INTO students (name) VALUES (?) RETURNING id, name, created_at, updated_at", (name,))
            row = cursor.fetchone()
            self.conn.commit()
            if row:
                logging.info(f"Student '{name}' added with ID: {row['id']}")
                return Student(id=row['id'], name=row['name'], created_at=row['created_at'], updated_at=row['updated_at'])
            return None
        except sqlite3.Error as e:
            logging.error(f"Error adding student '{name}': {e}")
            self.conn.rollback()
            return None

    def get_student_by_id(self, student_id: int) -> Optional[Student]:
        """
        Retrieves a student by their ID.
        """
        if not self.conn:
            logging.error("Database connection not established.")
            return None
        try:
            cursor: sqlite3.Cursor = self.conn.cursor()
            cursor.execute("SELECT id, name, created_at, updated_at FROM students WHERE id = ?", (student_id,))
            row = cursor.fetchone()
            if row:
                return Student(id=row['id'], name=row['name'], created_at=row['created_at'], updated_at=row['updated_at'])
            return None
        except sqlite3.Error as e:
            logging.error(f"Error retrieving student with ID {student_id}: {e}")
            return None

    def get_all_students(self) -> List[Student]:
        """
        Retrieves all students from the database.
        """
        if not self.conn:
            logging.error("Database connection not established.")
            return []
        try:
            cursor: sqlite3.Cursor = self.conn.cursor()
            cursor.execute("SELECT id, name, created_at, updated_at FROM students")
            rows = cursor.fetchall()
            return [Student(id=row['id'], name=row['name'], created_at=row['created_at'], updated_at=row['updated_at']) for row in rows]
        except sqlite3.Error as e:
            logging.error(f"Error retrieving all students: {e}")
            return []

    def add_mark(self, student_id: int, subject: str, score: int) -> Optional[Mark]:
        """
        Adds a new mark for a student.
        """
        if not self.conn:
            logging.error("Database connection not established.")
            return None
        if not (0 <= score <= 100):
            logging.error(f"Invalid score {score}. Score must be between 0 and 100.")
            return None
        try:
            cursor: sqlite3.Cursor = self.conn.cursor()
            cursor.execute("INSERT INTO marks (student_id, subject, score) VALUES (?, ?, ?) RETURNING id, student_id, subject, score, created_at, updated_at",
                           (student_id, subject, score))
            row = cursor.fetchone()
            self.conn.commit()
            if row:
                logging.info(f"Mark '{subject}' with score {score} added for student ID: {student_id}")
                return Mark(id=row['id'], student_id=row['student_id'], subject=row['subject'], score=row['score'], created_at=row['created_at'], updated_at=row['updated_at'])
            return None
        except sqlite3.IntegrityError:
            logging.error(f"Student with ID {student_id} does not exist.")
            self.conn.rollback()
            return None
        except sqlite3.Error as e:
            logging.error(f"Error adding mark for student ID {student_id}: {e}")
            self.conn.rollback()
            return None

    def get_marks_by_student_id(self, student_id: int) -> List[Mark]:
        """
        Retrieves all marks for a given student ID.
        """
        if not self.conn:
            logging.error("Database connection not established.")
            return []
        try:
            cursor: sqlite3.Cursor = self.conn.cursor()
            cursor.execute("SELECT id, student_id, subject, score, created_at, updated_at FROM marks WHERE student_id = ?", (student_id,))
            rows = cursor.fetchall()
            return [Mark(id=row['id'], student_id=row['student_id'], subject=row['subject'], score=row['score'], created_at=row['created_at'], updated_at=row['updated_at']) for row in rows]
        except sqlite3.Error as e:
            logging.error(f"Error retrieving marks for student ID {student_id}: {e}")
            return []

    def get_all_marks(self) -> List[Mark]:
        """
        Retrieves all marks from the database.
        """
        if not self.conn:
            logging.error("Database connection not established.")
            return []
        try:
            cursor: sqlite3.Cursor = self.conn.cursor()
            cursor.execute("SELECT id, student_id, subject, score, created_at, updated_at FROM marks")
            rows = cursor.fetchall()
            return [Mark(id=row['id'], student_id=row['student_id'], subject=row['subject'], score=row['score'], created_at=row['created_at'], updated_at=row['updated_at']) for row in rows]
        except sqlite3.Error as e:
            logging.error(f"Error retrieving all marks: {e}")
            return []

    def delete_student(self, student_id: int) -> bool:
        """
        Deletes a student and all their associated marks from the database.
        """
        if not self.conn:
            logging.error("Database connection not established.")
            return False
        try:
            cursor: sqlite3.Cursor = self.conn.cursor()
            cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
            self.conn.commit()
            if cursor.rowcount > 0:
                logging.info(f"Student with ID {student_id} and associated marks deleted successfully.")
                return True
            else:
                logging.warning(f"No student found with ID {student_id} to delete.")
                return False
        except sqlite3.Error as e:
            logging.error(f"Error deleting student with ID {student_id}: {e}")
            self.conn.rollback()
            return False
