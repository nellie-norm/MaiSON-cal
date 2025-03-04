#!/bin/bash

# Build the Docker image for AMD64 architecture
docker buildx build --platform linux/amd64 -t propertycalendarnn.azurecr.io/mycalendar-app:latest .

# Push the image to Azure Container Registry
docker push propertycalendarnn.azurecr.io/mycalendar-app:latest

# Update the Azure Web App
az webapp config container set --name new-property-api --resource-group property-api-rg --docker-custom-image-name propertycalendarnn.azurecr.io/mycalendar-app:latest

# Restart the web app
az webapp restart --name new-property-api --resource-group property-api-rg 