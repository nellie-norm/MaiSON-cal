# Use official Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy the dependencies file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose port 5001 if needed
EXPOSE 5001

# Run the app
CMD ["python", "app.py"]