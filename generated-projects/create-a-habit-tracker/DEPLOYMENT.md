# Habit Tracker Deployment Guide

This guide outlines the steps to deploy the Habit Tracker application.

## 1. Prerequisites

*   **Docker and Docker Compose:** Installed on your deployment server.
*   **Git:** To clone the repository.
*   **GitHub Container Registry (GHCR) Access:** Ensure your deployment environment has access to pull images from GHCR (usually via `docker login ghcr.io`). A GitHub Personal Access Token (PAT) with `package:read` scope is required.

## 2. Local Development/Testing with Docker Compose

For local development or testing, you can use `docker-compose` to run all services.

1.  **Clone the repository:**
    bash
    git clone https://github.com/your-org/habit-tracker.git # Replace with your actual repo URL
    cd habit-tracker
    
2.  **Build and run the services:**
    bash
    docker-compose up --build
    
    This command will:
    *   Build the frontend and backend Docker images based on their respective Dockerfiles.
    *   Start the PostgreSQL database service.
    *   Start the backend API service (available on `http://localhost:3000`).
    *   Start the frontend client service (available on `http://localhost:80`).

    To run in detached mode:
    bash
    docker-compose up --build -d
    
3.  **Stop the services:**
    bash
    docker-compose down
    

## 3. Production Deployment using Docker Compose (with pre-built images)

For production, it's recommended to use pre-built Docker images from your CI/CD pipeline (e.g., GitHub Container Registry).

1.  **Clone the repository:**
    bash
    git clone https://github.com/your-org/habit-tracker.git # Replace with your actual repo URL
    cd habit-tracker
    
2.  **Adjust `docker-compose.yml` for production:**
    Modify `docker-compose.yml` to pull images from GHCR instead of building them locally. 
    
    **Example `docker-compose.yml` (production ready with image pulls):**
    yaml
    version: '3.8'
    services:
      frontend:
        image: ghcr.io/your-org/habit-tracker/frontend:latest # Use your actual image name and tag
        ports:
          - "80:80"
        depends_on:
          - backend
        networks:
          - app-network

      backend:
        image: ghcr.io/your-org/habit-tracker/backend:latest # Use your actual image name and tag
        ports:
          - "3000:3000"
        environment:
          # IMPORTANT: Use strong passwords and ideally secrets management (e.g., Docker secrets, .env files, cloud secrets managers)
          DATABASE_URL: postgres://user:password@db:5432/habit_tracker_db # Replace with actual secure values
          JWT_SECRET: your_production_jwt_secret_key # Replace with a strong, random secret
          NODE_ENV: production
        depends_on:
          - db
        networks:
          - app-network

      db:
        image: postgres:13-alpine
        environment:
          POSTGRES_DB: habit_tracker_db
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password # IMPORTANT: Replace with a strong password
        volumes:
          - db-data:/var/lib/postgresql/data
        networks:
          - app-network

    volumes:
      db-data:

    networks:
      app-network:
        driver: bridge
    
    **Note:** For production, environment variables like `DATABASE_URL`, `POSTGRES_PASSWORD`, and `JWT_SECRET` must be managed securely. Using direct values in `docker-compose.yml` is for example purposes only. Consider Docker secrets, external `.env` files, or cloud-native secrets management solutions.

3.  **Login to GHCR (if not already logged in on the deployment server):**
    bash
    echo YOUR_GH_PAT | docker login ghcr.io -u YOUR_GH_USERNAME --password-stdin
    
    Replace `YOUR_GH_PAT` with a GitHub Personal Access Token that has `package:read` scope, and `YOUR_GH_USERNAME` with your GitHub username.

4.  **Pull and run the services:**
    bash
    docker-compose pull
    docker-compose up -d
    

## 4. Environment Variables and Secrets Management

*   **Development:** `.env` files can be used with `docker-compose` (e.g., `env_file: ./.env` in `docker-compose.yml`).
*   **Production:** Consider more robust solutions:
    *   Docker Swarm secrets (if using Docker Swarm)
    *   Kubernetes secrets (if using Kubernetes)
    *   Cloud-specific secrets managers (e.g., AWS Secrets Manager, Azure Key Vault, Google Secret Manager).
    *   Directly setting environment variables on the host system running `docker-compose` is also an option, though less scalable.

## 5. Further Enhancements for Production

*   **Reverse Proxy (Nginx/Caddy):** To handle SSL termination, load balancing, and routing if you have multiple services or domains. This would typically sit in front of the frontend service.
*   **Container Orchestration:** For scalability, high availability, and easier management (e.g., Kubernetes, Docker Swarm) beyond simple `docker-compose`.
*   **Monitoring and Logging:** Integrate with Prometheus, Grafana, ELK stack, or cloud-native logging solutions to observe application health and performance.
*   **Database Backups:** Implement a robust strategy for regular database backups.
*   **Health Checks:** Configure Docker health checks for services in `docker-compose.yml` to ensure they are truly ready and responsive before routing traffic.
*   **Automated Deployment:** Set up a Continuous Deployment (CD) pipeline to automatically deploy changes to production after successful CI.
