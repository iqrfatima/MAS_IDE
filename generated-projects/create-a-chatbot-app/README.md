# Chatbot Application

## Project Overview

This project implements a secure and interactive chatbot application designed to facilitate text-based conversations between users and an automated agent. It provides a robust backend API for managing users, conversations, and messages, coupled with a (placeholder) frontend interface for a seamless user experience. The chatbot is capable of providing basic, predefined, or echo responses based on user input, and maintains a persistent history of all interactions.

## Features

*   **Text Input & Output**: Intuitive interface for users to send text messages and receive chatbot responses.
*   **Conversation History**: Maintains and displays a chronological history of all messages within each conversation.
*   **User Management**: Secure user registration, login, and authentication using JWT (JSON Web Tokens).
*   **Conversation Management**: Users can create new conversations and retrieve past conversation threads.
*   **Basic Chatbot Logic**: The backend integrates a basic chatbot module capable of generating simple, rule-based, or echo responses.
*   **Scalable Architecture**: Designed with a layered architecture (Frontend, Backend API, Chatbot Logic, Database) for maintainability and scalability.
*   **Secure Communication**: Employs industry-standard security practices for data handling, authentication, and communication encryption.
*   **Deployable**: Containerized for easy deployment to production environments using Docker and CI/CD pipelines.

## Technologies Used

### Backend (`./`)

*   **Framework**: Python 3.10, FastAPI
*   **Web Server**: Uvicorn (ASGI), Gunicorn (Production WSGI server)
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy
*   **Database Driver**: Psycopg2
*   **Authentication**: `passlib[bcrypt]` for password hashing, `python-jose[cryptography]` for JWT handling
*   **Configuration**: `pydantic-settings`, `python-dotenv`
*   **Logging**: Standard Python `logging` module

### Frontend (`./frontend/` - *Planned/Placeholder*)

*   **Framework**: React (with TypeScript)
*   **Build Tool**: Vite (or Webpack)
*   **HTTP Client**: Axios
*   **Styling**: (e.g., Tailwind CSS, Material-UI, custom CSS)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed:

*   **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
*   **Poetry** (recommended for dependency management) or **pip**: `pip install poetry`
*   **PostgreSQL**: [Download PostgreSQL](https://www.postgresql.org/download/) or use Docker (recommended for local dev)
*   **Docker & Docker Compose** (optional, but highly recommended for database setup and simplified deployment):
    *   [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
*   **Node.js & npm/yarn** (for frontend development):
    *   [Download Node.js](https://nodejs.org/en/download/)

### 1. Clone the Repository

bash
git clone <your-repository-url>
cd <your-repository-name>


### 2. Backend Setup

Navigate to the project root directory (where `main.py` is located).

#### A. Database Setup (using Docker Compose - Recommended)

Create a `docker-compose.yml` (if not already present) for your PostgreSQL database. For example:

yaml
version: '3.8'
services:
  db:
    image: postgres:13
    container_name: chatbot_db
    environment:
      POSTGRES_DB: chatbot_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:


Then, run:

bash
docker-compose up -d db


#### B. Environment Variables

Create a `.env` file in the project root directory with the following variables. Replace values as appropriate (especially `SECRET_KEY`).

ini
DATABASE_URL="postgresql+psycopg2://user:password@localhost:5432/chatbot_db"
SECRET_KEY="your_super_secret_jwt_key_here_at_least_32_chars_long"
ALGORITHM="HS256"


#### C. Install Dependencies

It's recommended to use a virtual environment.

bash
# Using pip (from requirements.txt)
pip install -r requirements.txt

# Or, if using Poetry (if poetry.lock/pyproject.toml were present)
# poetry install
# poetry shell


#### D. Apply Database Schema

Initialize your database with the provided schema.

bash
pip install psycopg2-binary # Ensure psycopg2-binary is installed for local schema application
python -c "from app.database.connection import create_all_tables; create_all_tables()" # This will execute the ORM models to create tables.
# Alternatively, for direct SQL application (if no ORM migrations are set up yet):
# psql -h localhost -p 5432 -U user -d chatbot_db -f database/schema.sql


#### E. Run the Backend Application

bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000


This will start the FastAPI application locally, accessible at `http://localhost:8000`.

### 3. Frontend Setup (*Placeholder - assumes `frontend/` directory*)

Navigate into the `frontend` directory.

bash
cd frontend
npm install  # or yarn install


#### A. Environment Variables (Frontend)

Create a `.env` file in the `frontend` directory (e.g., `.env.development`) with the API URL:

ini
VITE_API_BASE_URL=http://localhost:8000/api/v1


#### B. Run the Frontend Application

bash
npm start # or npm run dev


This will typically start the React development server, accessible at `http://localhost:3000` (or similar).

## API Documentation

The backend API is built with FastAPI and automatically generates interactive OpenAPI (Swagger UI) documentation.

*   **Swagger UI**: Access at `http://localhost:8000/docs`
*   **ReDoc**: Access at `http://localhost:8000/redoc`

### Key Endpoints

Below is a summary of the core API endpoints:

| Method | Endpoint                                   | Description                                       | Authentication |
| :----- | :----------------------------------------- | :------------------------------------------------ | :------------- |
| `POST` | `/api/v1/auth/register`                    | Register a new user.                              | None           |
| `POST` | `/api/v1/auth/login`                       | Authenticate user and receive JWT token.          | None           |
| `GET`  | `/api/v1/users/me`                         | Retrieve details of the current authenticated user. | JWT Required   |
| `POST` | `/api/v1/conversations`                    | Create a new conversation.                        | JWT Required   |
| `GET`  | `/api/v1/conversations`                    | List all conversations for the authenticated user.  | JWT Required   |
| `GET`  | `/api/v1/conversations/{conversation_id}` | Retrieve a specific conversation.                 | JWT Required   |
| `POST` | `/api/v1/conversations/{conversation_id}/messages` | Send a message to a conversation and get a chatbot response. | JWT Required   |
| `GET`  | `/api/v1/conversations/{conversation_id}/messages` | Retrieve messages for a specific conversation.    | JWT Required   |

All authenticated endpoints require a `Bearer` token in the `Authorization` header.

## Deployment

The application is containerized using Docker for efficient and consistent deployments.

### Building the Docker Image

Ensure you are in the project root directory (where `Dockerfile` and `.dockerignore` are located).

bash
docker build -t chatbot-backend:latest .


This will build a production-ready Docker image for the backend service, incorporating dependencies via `requirements.txt` and following best practices like multi-stage builds and non-root user execution.

### Running the Docker Container

bash
docker run -d -p 8000:8000 --name chatbot-app \
  -e DATABASE_URL="postgresql+psycopg2://user:password@host.docker.internal:5432/chatbot_db" \
  -e SECRET_KEY="your_super_secret_jwt_key_here_at_least_32_chars_long" \
  -e ALGORITHM="HS256" \
  chatbot-backend:latest


**Note**: Replace `host.docker.internal` with the actual IP or hostname of your PostgreSQL database server if it's not running on the Docker host or within the same Docker network. For production, consider using environment management tools and secrets management services.

For a full-stack deployment, you would typically use `docker-compose` to orchestrate both the backend, frontend, and database services within a defined network.

## Validation

After setting up or deploying the application, follow these steps to validate its functionality:

1.  **Access the Frontend**: Open your browser to the frontend application's URL (e.g., `http://localhost:3000`).
2.  **Register a User**: Use the registration form to create a new user account.
3.  **Log In**: Log in with the newly created user credentials.
4.  **Create a New Conversation**: Initiate a new chat session.
5.  **Send a Message**: Type a message into the input field and send it.
    *   **Expected**: The chatbot should respond with a basic message (e.g., an echo or a predefined response).
6.  **Check Conversation History**: Verify that both your message and the chatbot's response are displayed in the conversation history.
7.  **Switch Conversations (if implemented)**: If the UI supports multiple conversations, try switching between them and ensure history is correctly loaded.
8.  **API Verification**: Optionally, use a tool like Postman or curl to directly test the API endpoints (e.g., `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/conversations`). Ensure you include the `Authorization: Bearer <JWT_TOKEN>` header for protected endpoints.

This process confirms that the core functionalities (user interaction, backend processing, database persistence, and chatbot logic) are operational.