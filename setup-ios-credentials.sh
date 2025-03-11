#!/bin/bash

# This script helps set up iOS credentials using App Store Connect API Key
# Make sure to replace the placeholder values with your actual values

# Set environment variables for App Store Connect API Key
export EXPO_APPLE_APP_SPECIFIC_PASSWORD=""
export EXPO_APPLE_TEAM_ID="4W9658Z948"
# If you have an App Store Connect App ID, add it here
export EXPO_APPLE_ASC_APP_ID=""
# Key ID from your screenshot
export EXPO_APPLE_ASC_KEY_ID="P38NEIP49S41"
# Issuer ID from the URL
export EXPO_APPLE_ASC_ISSUER_ID="a7e50a07-a5f4-436b-ac1f-7f0936f33de1"
export EXPO_APPLE_ASC_KEY_PATH="./credentials/ios/AuthKey.p8"

# Run the credentials command
echo "Running EAS credentials command with App Store Connect API Key..."
eas credentials -p ios

echo "If the above command fails, try running the configure-build command:"
echo "eas credentials:configure-build -p ios -e production" 