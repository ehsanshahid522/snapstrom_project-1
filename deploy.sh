#!/bin/bash

# SnapStream Deployment Script
# This script helps deploy the application to Vercel via GitHub

set -e

echo "🚀 Starting SnapStream Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please initialize git first."
    exit 1
fi

# Function to check if there are uncommitted changes
check_changes() {
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Please commit them first."
        echo "Run: git add . && git commit -m 'Your commit message'"
        exit 1
    fi
}

# Function to check current branch
check_branch() {
    current_branch=$(git branch --show-current)
    print_status "Current branch: $current_branch"
    
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        print_warning "You're not on the main branch. Consider switching to main for deployment."
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to run tests
run_tests() {
    print_status "Running backend tests..."
    if [ -f "test-backend.js" ]; then
        node test-backend.js || {
            print_warning "Some tests failed. Check the output above."
            read -p "Do you want to continue with deployment? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        }
    else
        print_warning "test-backend.js not found. Skipping tests."
    fi
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend..."
    cd frontend/client
    
    if [ -f "package.json" ]; then
        npm install --include=dev
        npm run build
        print_success "Frontend built successfully"
    else
        print_error "package.json not found in frontend/client"
        exit 1
    fi
    
    cd ../..
}

# Function to commit and push
deploy() {
    print_status "Preparing for deployment..."
    
    # Add all changes
    git add .
    
    # Check if there are changes to commit
    if git diff-index --quiet HEAD --; then
        print_warning "No changes to commit. Everything is up to date."
        return
    fi
    
    # Create commit
    commit_message="Deploy SnapStream - $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$commit_message"
    print_success "Changes committed: $commit_message"
    
    # Push to remote
    print_status "Pushing to GitHub..."
    git push origin $(git branch --show-current)
    print_success "Changes pushed to GitHub"
    
    print_success "Deployment initiated! Vercel will automatically deploy your changes."
    print_status "Check your Vercel dashboard for deployment status."
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo "  - Backend: https://snapstream-backend.vercel.app"
    echo "  - Frontend: https://snapstream.vercel.app"
    echo "  - Health Check: https://snapstream-backend.vercel.app/health"
    echo ""
    print_status "Environment Variables to check in Vercel:"
    echo "  - MONGO_URI: Your MongoDB connection string"
    echo "  - JWT_SECRET: Your JWT secret key"
    echo "  - VITE_API_URL: https://snapstream-backend.vercel.app"
}

# Main deployment flow
main() {
    print_status "Starting deployment process..."
    
    check_changes
    check_branch
    run_tests
    build_frontend
    deploy
    show_status
    
    print_success "Deployment script completed!"
}

# Handle command line arguments
case "${1:-}" in
    "test")
        run_tests
        ;;
    "build")
        build_frontend
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help")
        echo "SnapStream Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Run full deployment process"
        echo "  test       Run backend tests only"
        echo "  build      Build frontend only"
        echo "  status     Show deployment status"
        echo "  help       Show this help message"
        ;;
    *)
        main
        ;;
esac
