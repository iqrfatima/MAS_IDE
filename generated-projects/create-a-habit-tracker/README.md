# Habit Tracker

## Project Goal

The Habit Tracker is a full-stack application designed to help users establish, monitor, and maintain daily habits. It provides tools for tracking progress, visualizing streaks, and gaining insights into long-term consistency, promoting a healthier and more disciplined lifestyle.

## Features

The application offers the following core functionalities:

*   **User Authentication**: Secure user registration, login, and session management using JWT (JSON Web Tokens).
*   **Habit Management**: Create, view, edit, and delete personal habits.
*   **Daily Tracking**: Mark habits as complete or incomplete for any given day.
*   **Streak Calculation**: Automatically calculate and display current and longest streaks for each habit.
*   **Calendar View**: Visualize habit completion history over time with an intuitive calendar interface.
*   **User-friendly Interface**: A responsive and interactive frontend for a smooth user experience.

## Technologies Used

### Backend

*   **Language**: Python 3.9+
*   **Web Framework**: FastAPI
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy with Pydantic for data validation
*   **Authentication**: JWT (JSON Web Tokens)
*   **Dependency Management**: `pip`
*   **Logging**: Standard Python `logging` module

### Frontend

*   **Framework**: React (with TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM
*   **State Management**: React Context API / React Hooks
*   **Dependency Management**: `npm` or `yarn`

## Getting Started

Follow these instructions to set up and run the Habit Tracker locally.

### Prerequisites

Ensure you have the following installed on your machine:

*   Python 3.9 or higher
*   Node.js 18 or higher
*   npm or yarn
*   Docker (recommended for easy PostgreSQL setup)

### 1. Clone the Repository

bash
git clone https://github.com/your-username/habit-tracker.git
cd habit-tracker


### 2. Backend Setup (Python/FastAPI)

Navigate to the `backend` directory:

bash
cd backend


#### Create Virtual Environment and Install Dependencies

bash
python -m venv .venv
source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
pip install -r requirements.txt


#### Database Setup (PostgreSQL)

It's recommended to use Docker for running a local PostgreSQL instance:

1.  **Start PostgreSQL with Docker**: 
    bash
docker run --name habit-tracker-pg -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=habit_tracker -p 5432:5432 -d postgres:14-alpine
    

2.  **Configure Database Connection**: Create a `.env` file in the `backend/` directory with your database connection string. Ensure it matches the Docker command above.
    dotenv
    DATABASE_URL=postgresql://user:password@localhost/habit_tracker
    SECRET_KEY="your_very_secret_key_for_jwt_signing"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    
    *Replace `your_very_secret_key_for_jwt_signing` with a strong, random key.*

3.  **Apply Database Schema**: The schema is defined in `database/schema.sql`. You can apply it manually using a PostgreSQL client or integrate with an ORM migration tool if one is set up (not explicitly generated in current state).
    *For demonstration, you might use `psql` or a GUI client to connect to your database and execute the `database/schema.sql` file.* (Assuming manual application or implicit ORM migration for now as no explicit script for `schema.sql` application from backend is provided).

#### Run the Backend Server

bash
uvicorn src.main:app --reload


The backend API will be accessible at `http://localhost:8000`.

### 3. Frontend Setup (React/TypeScript)

Open a new terminal and navigate to the `frontend` directory:

bash
cd ../frontend


#### Install Dependencies

bash
npm install  # or yarn install


#### Configure API Base URL

Create a `.env` file in the `frontend/` directory to point to your backend API:

dotenv
VITE_API_BASE_URL=http://localhost:8000


#### Run the Frontend Development Server

bash
npm run dev  # or yarn dev


The frontend application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## API Documentation

The Habit Tracker backend exposes a RESTful API. All API calls require a JWT Bearer token after successful login for authenticated endpoints.

**Base URL**: `http://localhost:8000`

### Authentication

*   **`POST /auth/register`**: Register a new user.
    *   **Request Body**: `{"username": "string", "password": "string"}`
    *   **Response**: `{"message": "User created successfully"}`
*   **`POST /auth/login`**: Authenticate a user and receive a JWT.
    *   **Request Body**: `{"username": "string", "password": "string"}`
    *   **Response**: `{"access_token": "jwt_token", "token_type": "bearer"}`

### Habits

(Requires `Authorization: Bearer <token>` header)

*   **`GET /habits`**: Retrieve all habits for the authenticated user.
    *   **Response**: `[{"id": "uuid", "name": "string", "description": "string", ...}]`
*   **`POST /habits`**: Create a new habit.
    *   **Request Body**: `{"name": "string", "description": "string"}`
    *   **Response**: `{"id": "uuid", "name": "string", "description": "string", ...}`
*   **`GET /habits/{habit_id}`**: Retrieve a specific habit by ID.
    *   **Response**: `{"id": "uuid", "name": "string", "description": "string", ...}`
*   **`PUT /habits/{habit_id}`**: Update an existing habit.
    *   **Request Body**: `{"name": "string", "description": "string"}` (partial updates possible)
    *   **Response**: `{"id": "uuid", "name": "string", "description": "string", ...}`
*   **`DELETE /habits/{habit_id}`**: Delete a habit.
    *   **Response**: `{"message": "Habit deleted successfully"}`

### Habit Tracking

(Requires `Authorization: Bearer <token>` header)

*   **`POST /habits/{habit_id}/entries`**: Record or update a habit entry for a specific date.
    *   **Request Body**: `{"date": "YYYY-MM-DD", "completed": true}`
    *   **Response**: `{"id": "uuid", "habit_id": "uuid", "user_id": "uuid", "date": "YYYY-MM-DD", "completed": true}`
*   **`GET /habits/{habit_id}/entries`**: Retrieve all entries for a specific habit.
    *   **Query Params**: `start_date=YYYY-MM-DD`, `end_date=YYYY-MM-DD` (optional for filtering)
    *   **Response**: `[{"id": "uuid", "habit_id": "uuid", "user_id": "uuid", "date": "YYYY-MM-DD", "completed": true}, ...]`
*   **`GET /habits/{habit_id}/streak`**: Get streak information for a specific habit.
    *   **Response**: `{"current_streak": "int", "longest_streak": "int"}`

## Deployment

This application is designed for deployment to cloud environments with CI/CD pipelines. Key considerations include:

*   **Containerization**: Both frontend and backend can be containerized using Docker for consistent environments.
*   **CI/CD**: Set up automated build, test, and deployment pipelines (e.g., GitHub Actions, GitLab CI, Jenkins) for staging and production environments, as outlined in task `T_021_CICD_Setup`.
*   **Environment Variables**: Manage sensitive configurations (database URLs, JWT secrets) using environment variables for different deployment stages.
*   **Database Hosting**: Utilize managed database services (e.g., AWS RDS, Azure Database for PostgreSQL) for production databases.
*   **Frontend Hosting**: Host the static frontend assets on a CDN or services like Vercel, Netlify, or AWS S3/CloudFront.
*   **Backend Hosting**: Deploy the FastAPI backend on platforms supporting Python web applications (e.g., AWS EC2, Google Cloud Run, Heroku, Docker Swarm/Kubernetes).
*   **Monitoring & Logging**: Implement robust monitoring and centralized logging solutions for production environments (`T_022_Monitoring_Setup`).

## Validation

After setting up the application, follow these steps to validate its functionality:

1.  **Access Frontend**: Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
2.  **Register User**: Click on "Register" and create a new user account.
3.  **Login**: Use your newly registered credentials to log in to the application.
4.  **Create Habit**: Navigate to the dashboard (or habits list) and create a new habit. Provide a name and optional description.
5.  **Track Habit**: Go to the detail page for the habit you just created. Click "Mark Complete" for the current day.
6.  **Verify Tracking**: Observe the calendar view on the habit detail page or the overall calendar page to ensure the habit is marked as complete for the day. You should see streak information updating.
7.  **Edit/Delete Habit**: Test editing a habit's details or deleting a habit to ensure these operations are reflected correctly.
8.  **Logout**: Ensure you can successfully log out of the application.

This validates the end-to-end user flow, from authentication to habit management and tracking.