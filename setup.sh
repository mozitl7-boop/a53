#!/bin/bash

# Setup script for A53 - TypeScript Strict & CI/CD

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}A53 - Setup & Migration Script${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Step 1: Install/Update dependencies
echo -e "${GREEN}Step 1: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install dependencies${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 2: Run TypeScript check
echo -e "${GREEN}Step 2: Running TypeScript strict mode check...${NC}"
npx tsc --noEmit --strict --skipLibCheck false
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠ TypeScript errors found. Review and fix them before deploying.${NC}"
else
  echo -e "${GREEN}✓ TypeScript check passed${NC}"
fi
echo

# Step 3: Run ESLint
echo -e "${GREEN}Step 3: Running ESLint...${NC}"
npm run lint
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠ Linting issues found. Fix them for best practices.${NC}"
else
  echo -e "${GREEN}✓ Linting passed${NC}"
fi
echo

# Step 4: Build project
echo -e "${GREEN}Step 4: Building project...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Fix TypeScript/build errors before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}\n"

echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${YELLOW}========================================${NC}\n"

echo "Next steps:"
echo "1. Set up GitHub Actions secrets in your repository:"
echo "   - NEXT_PUBLIC_APP_URL"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - DATABASE_URL"
echo "   - secrets.SUPABASE_SECRET_KEY"
echo "   - MAILJET_API_KEY"
echo "   - MAILJET_SECRET_KEY"
echo "   - EMAIL_FROM"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_PROJECT_ID"
echo ""
echo "2. Push to 'develop' or 'main' branch to trigger CI/CD pipeline"
echo "3. Check GitHub Actions tab for build status"
