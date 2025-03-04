# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the startup script first
COPY startup.sh /app/
RUN chmod +x /app/startup.sh

# Copy the current directory contents into the container at /app
COPY . /app

# Add these lines to your Dockerfile before installing Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run the startup script when the container launches
CMD ["/app/startup.sh"]
