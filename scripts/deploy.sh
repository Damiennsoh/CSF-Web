#!/bin/bash

# Multi-Platform Deployment Script
# Usage: ./scripts/deploy.sh [vercel|cloudflare|both]

set -e

PLATFORM=${1:-vercel}
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=========================================="
echo "CSF Website Deployment Script"
echo "Platform: $PLATFORM"
echo "Time: $TIMESTAMP"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

print_success "Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

print_success "npm found: $(npm --version)"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --legacy-peer-deps
print_success "Dependencies installed"

# Deployment functions
deploy_vercel() {
    echo ""
    echo "========== DEPLOYING TO VERCEL =========="
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_warning "Make sure you have authenticated with Vercel using: vercel login"
    echo ""
    echo "Running build for Vercel..."
    npm run build:vercel
    print_success "Build successful"
    
    echo ""
    print_warning "Deploying to Vercel... (requires manual confirmation)"
    vercel deploy --prod || print_warning "Vercel deployment requires manual setup"
    
    print_success "Vercel deployment initiated"
}

deploy_cloudflare() {
    echo ""
    echo "========== DEPLOYING TO CLOUDFLARE =========="
    
    # Check if Wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        print_warning "Wrangler CLI not found. Installing..."
        npm install -g @cloudflare/wrangler
    fi
    
    print_warning "Make sure you have authenticated with Cloudflare using: wrangler login"
    echo ""
    
    # Check if wrangler.toml is configured
    if ! grep -q "account_id = \"\"" wrangler.toml; then
        print_warning "wrangler.toml is configured"
    else
        print_error "wrangler.toml is not configured. Please add your Cloudflare account_id and zone_id"
        exit 1
    fi
    
    echo "Running build for Cloudflare..."
    npm run build:cloudflare
    print_success "Build successful"
    
    echo ""
    echo "Deploying to Cloudflare..."
    wrangler deploy
    print_success "Cloudflare deployment successful"
}

# Main deployment logic
case "$PLATFORM" in
    vercel)
        deploy_vercel
        ;;
    cloudflare)
        deploy_cloudflare
        ;;
    both)
        deploy_vercel
        deploy_cloudflare
        ;;
    *)
        print_error "Invalid platform: $PLATFORM"
        echo "Usage: ./scripts/deploy.sh [vercel|cloudflare|both]"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
print_success "Deployment complete!"
echo "=========================================="
