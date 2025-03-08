# Use official Python image
FROM python:3.9-slim

# Install PostgreSQL dependencies and SSL certificates
RUN apt-get update && apt-get install -y \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the dependencies file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# ✅ Copy .env file (if needed)
COPY .env .env

# Expose port 5001 if needed
EXPOSE 5001

# Run the app
CMD ["python", "app.py"]