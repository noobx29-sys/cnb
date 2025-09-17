#!/bin/bash

echo "🚀 App Store Submission Script for NEWTEX"
echo "=========================================="

# Function to check build status
check_build_status() {
    echo "📋 Checking latest iOS build status..."
    npx eas build:list --platform ios --limit 1 --json | grep -E '"status":|"id":'
}

# Function to submit to App Store
submit_to_app_store() {
    echo "📱 Submitting to App Store..."
    npx eas submit --platform ios --profile production --latest
}

# Main execution
echo "🔍 Current build status:"
check_build_status

echo ""
echo "⏳ Waiting for build to complete..."
echo "💡 You can also check build status at: https://expo.dev"
echo ""
echo "🎯 Once build is complete, run the following command:"
echo "   npx eas submit --platform ios --profile production --latest"
echo ""
echo "📝 App Store Connect checklist:"
echo "   ✅ App metadata and description"
echo "   ✅ Screenshots for all device sizes"
echo "   ✅ Privacy policy (if required)"
echo "   ✅ App category and age rating"
echo "   ✅ Keywords and subtitle"
echo ""
echo "🏆 Ready for App Store submission!" 