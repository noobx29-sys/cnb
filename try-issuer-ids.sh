#!/bin/bash

# This script tries different potential Issuer ID values
# Place your AuthKey.p8 file in the credentials/ios directory before running this script

# Make sure the credentials directory exists
mkdir -p credentials/ios

# Set common environment variables
export EXPO_APPLE_TEAM_ID="4W9658Z948"
export EXPO_APPLE_ASC_KEY_ID="P38NEIP49S41"
export EXPO_APPLE_ASC_KEY_PATH="./credentials/ios/AuthKey.p8"

# Check if the .p8 file exists
if [ ! -f "$EXPO_APPLE_ASC_KEY_PATH" ]; then
  echo "Error: $EXPO_APPLE_ASC_KEY_PATH not found!"
  echo "Please place your AuthKey.p8 file in the credentials/ios directory."
  exit 1
fi

# Try with User ID from URL as Issuer ID (most likely)
echo "Trying with User ID from URL as Issuer ID (most likely)..."
export EXPO_APPLE_ASC_ISSUER_ID="a7e50a07-a5f4-436b-ac1f-7f0936f33de1"
eas credentials -p ios

# If the above fails, try with Developer ID as Issuer ID
if [ $? -ne 0 ]; then
  echo "Trying with Developer ID as Issuer ID..."
  export EXPO_APPLE_ASC_ISSUER_ID="8e6f3f06-9794-4b9a-965d-f7cd47360237"
  eas credentials -p ios
fi

# If the above fails, try with Team ID as Issuer ID
if [ $? -ne 0 ]; then
  echo "Trying with Team ID as Issuer ID..."
  export EXPO_APPLE_ASC_ISSUER_ID="4W9658Z948"
  eas credentials -p ios
fi

# If all fail, try with the Shared Secret
if [ $? -ne 0 ]; then
  echo "Trying with Shared Secret as Issuer ID..."
  export EXPO_APPLE_ASC_ISSUER_ID="527e579dc7564fe98625737ca737d442"
  eas credentials -p ios
fi

echo "If all attempts failed, you may need to contact Apple Developer Support to find the correct Issuer ID." 