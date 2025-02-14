#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load GitHub token from environment variable
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GITHUB_TOKEN environment variable is not set${NC}"
    exit 1
fi

# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo -e "${GREEN}Pulling latest changes from GitHub...${NC}"

# Pull latest changes using token
git pull "https://oauth2:$GITHUB_TOKEN@github.com/aijunglefun/aijungle.fun.git" $BRANCH

echo -e "${GREEN}Pull complete!${NC}" 