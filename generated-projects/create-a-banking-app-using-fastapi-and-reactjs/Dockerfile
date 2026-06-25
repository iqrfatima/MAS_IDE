FROM python:3.10-slim-buster

WORKDIR /app

# Install system dependencies if any (e.g., for psycopg2-binary to work)
# Uncomment if you face issues with database drivers
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     libpq-dev \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt and install Python dependencies
# Assumes requirements.txt is at the project root now (moved from src/)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
# Assumes all backend src lives in ./src relative to Dockerfile
COPY src ./src

# Expose the port FastAPI will run on
EXPOSE 8000

# Health check (useful for container orchestration systems)
# Checks if the /health endpoint is reachable after startup
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost:8000/health || exit 1

# Command to run the FastAPI application using Uvicorn
# The entry point is src/main.py with the FastAPI app instance named 'app'
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]