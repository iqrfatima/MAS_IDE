# Stage 1: Builder - for installing Python dependencies
FROM python:3.11-slim-bookworm AS builder

# Set working directory inside the container
WORKDIR /app

# Copy requirements.txt and install Python dependencies
# This leverages Docker cache: if requirements.txt doesn't change, pip install is skipped.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runner - for the final, lean production image
FROM python:3.11-slim-bookworm AS runner

# Install necessary system dependencies for the application runtime.
# Specifically, libpq5 is needed by psycopg2-binary.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for better logging and behavior.
# PYTHONUNBUFFERED=1 ensures that Python's stdout and stderr are unbuffered.
ENV PYTHONUNBUFFERED=1

# Create a non-root user and group for security best practices.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Set working directory for the application
WORKDIR /app

# Copy only the installed Python packages and executables from the builder stage to the runner stage.
# This ensures that only runtime dependencies are included, minimizing image size.
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# Copy the application code into the image.
# Ensure the copied files are owned by the non-root user.
COPY --chown=appuser:appgroup . .

# Expose the port on which the application will listen.
EXPOSE 8000

# Define the command to run the application using Gunicorn as a process manager
# for Uvicorn workers. This is a production-ready setup for FastAPI.
# -w N: number of worker processes (e.g., 4).
# -k uvicorn.workers.UvicornWorker: specify Uvicorn as the worker class.
# -b 0.0.0.0:8000: bind to all network interfaces on port 8000.
# --log-level info: Set the logging level for Gunicorn.
# main:app: specifies the entry point (the FastAPI app instance named 'app' in 'main.py').
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--log-level", "info", "main:app"]
