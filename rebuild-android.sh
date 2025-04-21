#!/bin/bash

# Clean caches
rm -rf .expo
rm -rf android/app/build

# Remove generated icon resources
rm -rf android/app/src/main/res/mipmap-*
rm -rf android/app/src/main/res/drawable-*

# Run prebuild to regenerate resources from app.json
npx expo prebuild --platform android --clean

echo "Please answer 'y' to any prompts"
echo "Rebuild completed. Now you can build a new APK with:"
echo "npx expo build:android -t apk" 