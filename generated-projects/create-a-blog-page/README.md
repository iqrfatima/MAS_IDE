# Blog Page Application

This project implements a full-stack blog page application, designed to display a list of blog posts and allow users to navigate to individual post detail pages. The application is built with a responsive user interface, ensuring a seamless experience across various devices.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Deployment](#deployment)
- [Validation](#validation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

*   **Blog Post List**: Displays a paginated list of blog posts, each showing its title, a brief excerpt, and the publication date.
*   **Post Detail View**: Allows users to navigate from the post list to a dedicated page for each individual post, displaying its full content.
*   **Responsive Design**: The user interface adapts to various screen sizes, providing an optimal viewing experience on mobile, tablet, and desktop devices.
*   **Loading & Error States**: Provides visual feedback to the user during data fetching and in cases where an error occurs or no data is available.
*   **Scalable Backend**: RESTful API with pagination support for efficient data retrieval.

## Architecture Overview

The application follows a typical client-server architecture, comprising a React frontend, a FastAPI backend, and a PostgreSQL database.

*   **Frontend (React.js)**:
    *   Built with React.js, TypeScript, and Vite for a fast development experience.
    *   Styled using Tailwind CSS for a utility-first approach to styling.
    *   Uses `@tanstack/react-query` for efficient data fetching, caching, and state management.
    *   Navigation handled by `react-router-dom`.
    *   Ensures WCAG AA compliance for accessibility.

*   **Backend (FastAPI)**:
    *   Developed with Python using the FastAPI framework for high performance and ease of use.
    *   Employs Pydantic for robust data validation and serialization.
    *   Provides RESTful API endpoints for managing blog posts, complete with OpenAPI documentation.
    *   Interacts with the database via SQLAlchemy ORM.
    *   Includes robust error handling and structured logging.

*   **Database (PostgreSQL)**:
    *   A relational database used to persistently store blog post data.
    *   Includes a `posts` table with fields like `id`, `title`, `content`, `excerpt`, `created_at`, and `updated_at`.
    *   Managed with SQL migration scripts.
    *   Seed data is provided for initial setup.

*   **CI/CD Pipeline**:
    *   Automated pipeline configured to build, test, and deploy application changes.
    *   Runs linting, unit, and integration tests on feature branches.
    *   Deploys automatically to a staging environment upon successful builds.
    *   Requires manual approval for deployments to the production environment.

## API Documentation

The backend provides a RESTful API for managing blog posts. All endpoints return JSON responses.

**Base URL**: `http://localhost:8000/api` (for local development)

### 1. Get All Blog Posts

Retrieves a paginated list of blog posts.

*   **Endpoint**: `GET /api/posts`
*   **Description**: Fetches a list of blog posts, with support for pagination.
*   **Query Parameters**:
    *   `page` (optional, integer, default: `1`): The page number for results.
    *   `limit` (optional, integer, default: `10`): The maximum number of posts to return per page.
*   **Example Request**:
    
    GET /api/posts?page=2&limit=5
    
*   **Successful Response (200 OK)**:
    
    [
      {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "title": "Example Post Title 1",
        "excerpt": "This is a short excerpt of the first example post...",
        "created_at": "2023-10-27T10:00:00Z"
      },
      // ... more posts
    ]
    
*   **Error Responses**:
    *   `400 Bad Request`: If query parameters are invalid.

### 2. Get Single Blog Post

Retrieves a single blog post by its unique identifier.

*   **Endpoint**: `GET /api/posts/{post_id}`
*   **Description**: Fetches the details of a specific blog post using its ID.
*   **Path Parameters**:
    *   `post_id` (required, UUID string): The unique identifier of the post.
*   **Example Request**:
    
    GET /api/posts/a1b2c3d4-e5f6-7890-1234-567890abcdef
    
*   **Successful Response (200 OK)**:
    
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "title": "Example Post Title 1",
      "content": "This is the full content of the first example post. It can be quite long and contain rich text formatting.",
      "created_at": "2023-10-27T10:00:00Z"
    }
    
*   **Error Responses**:
    *   `404 Not Found`: If no post with the given `post_id` exists.

## Setup Instructions

Follow these instructions to set up and run the blog application locally.

### Prerequisites

Ensure you have the following installed on your system:

*   [Python 3.8+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/en/download/) (which includes npm)
*   [PostgreSQL](https://www.postgresql.org/download/)
*   (Optional) [Docker](https://www.docker.com/get-started) for easy PostgreSQL setup.

### Backend Setup

1.  **Clone the repository**:
    bash
    git clone <repository-url>
    cd <project-directory>
    

2.  **Create and activate a Python virtual environment**:
    bash
    python -m venv venv
    # On Linux/macOS:
    source venv/bin/activate
    # On Windows:
    .\venv\Scripts\activate
    

3.  **Install backend dependencies**:
    bash
    pip install -r requirements.txt
    

4.  **Configure environment variables**:
    Create a `.env` file in the project root with your PostgreSQL connection string. Replace placeholders with your actual database credentials.
    dotenv
    DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"
    

5.  **Set up the PostgreSQL database**:
    *   Connect to your PostgreSQL server (e.g., using `psql` or a GUI client).
    *   Create a dedicated user and database for the application:
        sql
        CREATE USER blog_user WITH PASSWORD 'blog_password';
        CREATE DATABASE blog_db;
        GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;
        
    *   Apply the database schema (from the project root):
        bash
        psql -U blog_user -d blog_db -f database/schema.sql
        

6.  **Seed initial data**:
    Populate the database with some sample blog posts (from the project root):
    bash
    python src/seed/seed_posts.py
    

7.  **Start the backend server**:
    bash
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
    
    The backend API will be accessible at `http://localhost:8000`.

### Frontend Setup

1.  **Install frontend dependencies** (from the project root):
    bash
    npm install
    # or yarn install
    

2.  **Start the frontend development server**:
    bash
    npm run dev
    # or yarn dev
    
    The frontend application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

This project is configured with a CI/CD pipeline to automate the build, test, and deployment processes.

*   **Continuous Integration**: Pull requests and pushes to feature branches trigger an automated pipeline that runs linting, unit, and integration tests to ensure code quality and functionality.
*   **Staging Deployment**: Upon successful completion of all tests on the main branch, the application is automatically deployed to a staging environment for further testing and review.
*   **Production Deployment**: Deployment to the production environment requires a manual approval step, ensuring stability and control over releases.

Refer to the specific CI/CD configuration files (e.g., `.github/workflows/main.yml` if GitHub Actions is used) for detailed pipeline steps.

## Validation

After setting up and running the application, follow these steps to validate its functionality:

1.  **Access the Blog Page**: Open your web browser and navigate to `http://localhost:5173`.
2.  **Verify Post List Display**: You should see a list of blog posts, each with a title, excerpt, and date.
3.  **Test Pagination**: If you have more than 10 posts, try refreshing the page or navigating to different pages (if UI for pagination is implemented) or manually adjusting the `page` and `limit` query parameters for the backend API to observe paginated results.
4.  **Navigate to Post Detail**: Click on any post title in the list. This should navigate you to `/posts/:id` (e.g., `/posts/a1b2c3d4-e5f6-7890-1234-567890abcdef`), displaying the full content of that specific post.
5.  **Check Responsiveness**: Resize your browser window or use browser developer tools to simulate different screen sizes (mobile, tablet, desktop). Observe that the layout adapts correctly.
6.  **Error Handling**: Temporarily disable the backend server (`Ctrl+C` in the backend terminal) and refresh the frontend. The frontend should display an appropriate error message or loading state.
7.  **Console Check**: Open your browser's developer console (F12). Ensure there are no JavaScript errors or network request failures when interacting with the application.

## Project Structure

The project's codebase is organized as follows:


.
├── database/
│   └── schema.sql        # PostgreSQL schema definition
├── src/
│   ├── main.py          # FastAPI application entry point
│   ├── database.py      # Database session management
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic data validation schemas
│   ├── services.py      # Business logic and data manipulation
│   ├── repositories/
│   │   └── post_repository.py # CRUD operations for posts
│   ├── routers/
│   │   └── posts.py     # FastAPI router for post-related API endpoints
│   ├── exceptions.py    # Custom exception definitions
│   ├── logger.py        # Logging configuration
│   ├── seed/
│   │   └── seed_posts.py # Script to populate initial database data
│   ├── App.tsx          # Main React application component
│   ├── index.css        # Global CSS styles (Tailwind base)
│   ├── index.tsx        # React application entry point
│   ├── router.tsx       # React Router configuration
│   ├── types.ts         # Global TypeScript type definitions
│   ├── components/
│   │   ├── Error.tsx    # Error display component
│   │   ├── Loading.tsx  # Loading indicator component
│   │   ├── PostItem.tsx # Individual post list item component
│   │   └── PostList.tsx # Component to display list of posts
│   ├── hooks/
│   │   ├── usePost.ts   # React hook for fetching a single post
│   │   └── usePosts.ts  # React hook for fetching a list of posts
│   ├── pages/
│   │   ├── Home.tsx     # Blog post list page
│   │   └── PostDetail.tsx # Individual blog post detail page
│   └── services/
│       └── api.ts       # API client for frontend data fetching
├── package.json         # Frontend (Node.js) dependencies and scripts
├── postcss.config.js    # PostCSS configuration for Tailwind CSS
├── requirements.txt     # Backend (Python) dependencies
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build tool configuration
└── .env.example         # Example environment variables file


## Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Ensure your code adheres to the project's coding standards and linting rules.
4.  Write comprehensive tests for new features and ensure existing tests pass.
5.  Submit a pull request with a clear description of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.