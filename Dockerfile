# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

COPY .env.local .env.local

# Debug: List directory contents
RUN ls -la
RUN ls -la backend/models

# Set environment variables
ENV PYTHONPATH=/app

# Expose port 8000
EXPOSE 8000

# Run the application with unbuffered output for better logging
CMD ["python", "-u", "app.py"]

ENV PGSSLMODE=require
