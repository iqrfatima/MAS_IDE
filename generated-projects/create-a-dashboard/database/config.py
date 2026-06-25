import os

# Define the path for the SQLite database file
DB_PATH: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'students_marks.db')
