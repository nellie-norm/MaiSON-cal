#!/bin/bash

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating template .env file..."
    cat > .env << EOL
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
PGSSLMODE=require
EOL
    echo "Please update .env with your actual database credentials before running docker-compose"
    exit 1
fi

# Start the services
echo "Starting services..."
docker-compose up --build