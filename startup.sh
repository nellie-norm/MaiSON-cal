#!/bin/bash
echo "Starting application..."
echo "Current directory: $(pwd)"
echo "Listing files: $(ls -la)"
echo "Python version: $(python --version)"
echo "Gunicorn version: $(gunicorn --version)"

# Make sure the script is executable
chmod +x /app/startup.sh

# Start Gunicorn
gunicorn --bind 0.0.0.0:8000 app:app