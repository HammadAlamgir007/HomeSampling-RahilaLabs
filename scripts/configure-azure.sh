#!/bin/bash
# ==============================================================================
# Rahila Labs - Azure Infrastructure Provisioning & Configuration Script
# ==============================================================================
# This script provisions Azure Cache for Redis and configures the
# Azure App Service with the necessary environment variables.
# Run this directly in the Azure Cloud Shell!
# ==============================================================================

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration Variables ---
RESOURCE_GROUP="rahila-labs-rg"
LOCATION="centralindia"
WEBAPP_NAME="rahila-labs-api"
REDIS_NAME="rahilalabs-redis-$(date +%s)"

echo "================================================================="
echo " Starting Azure Infrastructure Provisioning (Redis Only)"
echo " Resource Group: $RESOURCE_GROUP"
echo " Location: $LOCATION"
echo " App Service: $WEBAPP_NAME"
echo "================================================================="

# 1. Provision Azure Cache for Redis
echo "Provisioning Azure Cache for Redis: $REDIS_NAME (This may take 15-20 minutes)..."
az redis create \
    --name $REDIS_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Basic \
    --vm-size c0 \
    -o none

# Fetch Redis Primary Key
REDIS_KEY=$(az redis list-keys --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query primaryKey -o tsv)
REDIS_URL="rediss://:${REDIS_KEY}@${REDIS_NAME}.redis.cache.windows.net:6380/0"
echo "✔ Azure Cache for Redis ready."

# 2. Configure App Service Environment Variables
echo "Configuring Azure App Service: $WEBAPP_NAME..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEBAPP_NAME \
    --settings \
    REDIS_URL="$REDIS_URL" \
    CELERY_BROKER_URL="$REDIS_URL" \
    CELERY_RESULT_BACKEND="$REDIS_URL" \
    FLASK_ENV="production" \
    -o none
echo "✔ App Service settings updated."

echo "================================================================="
echo " Provisioning Complete!"
echo " The Web App now has the required REDIS_URL."
echo "================================================================="
