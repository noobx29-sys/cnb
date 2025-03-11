#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}   CNB Carpets App Publishing Tool   ${NC}"
echo -e "${BLUE}===================================${NC}"

# Function to display steps
show_step() {
  echo -e "\n${GREEN}[$1]${NC} $2"
}

# Check for required tools
show_step "1" "Checking prerequisites"
if ! command -v eas &> /dev/null; then
  echo -e "${RED}EAS CLI not found. Please install it with: npm install -g eas-cli${NC}"
  exit 1
fi

# EAS Update
show_step "2" "Updating EAS CLI to latest version"
npm install -g eas-cli

# Ask which platform to build for
echo -e "\n${YELLOW}Which platform would you like to build for?${NC}"
select platform in "iOS" "Android" "Both"; do
  case $platform in
    iOS )
      platforms="ios"
      break
      ;;
    Android )
      platforms="android"
      break
      ;;
    Both )
      platforms="ios android"
      break
      ;;
    * )
      echo -e "${RED}Invalid selection${NC}"
      ;;
  esac
done

# Check if we need to configure EAS credentials
show_step "3" "Setting up EAS credentials"
for p in $platforms; do
  echo -e "${YELLOW}Do you need to configure EAS credentials for $p? (y/n)${NC}"
  read configure
  if [[ $configure == "y" ]]; then
    eas credentials --platform $p
  fi
done

# Build the app
show_step "4" "Building production app"
for p in $platforms; do
  echo -e "${YELLOW}Building $p app...${NC}"
  eas build --platform $p --profile production --no-wait
done

echo -e "\n${YELLOW}Builds have been started in the Expo cloud.${NC}"
echo -e "${YELLOW}You can monitor build progress with: eas build:list${NC}"

show_step "5" "Next steps"
echo -e "${BLUE}Once your builds complete, submit to the app stores with:${NC}"
echo -e "  iOS:     ${GREEN}eas submit --platform ios${NC}"
echo -e "  Android: ${GREEN}eas submit --platform android${NC}"

echo -e "\n${YELLOW}Remember to update eas.json with your app store credentials before submitting.${NC}"
echo -e "${YELLOW}For iOS, you need: appleId, ascAppId, and appleTeamId${NC}"
echo -e "${YELLOW}For Android, you need: serviceAccountKeyPath to your Play Store service account JSON${NC}"

echo -e "\n${BLUE}Happy publishing!${NC}" 