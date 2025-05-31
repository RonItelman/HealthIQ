#!/bin/bash

# Development helper script for Dots
# This script helps manage development workflow

echo "🛠️  Dots Development Helper"
echo "========================="

# Function to show current status
show_status() {
    echo "📊 Current Status:"
    echo "   Branch: $(git branch --show-current)"
    echo "   Status: $(git status --short | wc -l) uncommitted changes"
    echo ""
}

# Function to start new feature
start_feature() {
    echo "Starting new feature: $1"
    git checkout development
    git pull origin development
    git checkout -b "feature/$1"
    echo "✅ Created feature branch: feature/$1"
}

# Function to finish feature
finish_feature() {
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ ! "$CURRENT_BRANCH" =~ ^feature/ ]]; then
        echo "❌ Error: Not on a feature branch"
        echo "   Current branch: $CURRENT_BRANCH"
        exit 1
    fi
    
    echo "Finishing feature: $CURRENT_BRANCH"
    git add .
    git commit
    git checkout development
    git merge "$CURRENT_BRANCH" --no-ff
    git branch -d "$CURRENT_BRANCH"
    echo "✅ Feature merged into development"
}

# Main menu
case "$1" in
    "status"|"s")
        show_status
        ;;
    "feature"|"f")
        if [ -z "$2" ]; then
            echo "❌ Error: Please provide a feature name"
            echo "   Usage: ./dev.sh feature <feature-name>"
            exit 1
        fi
        start_feature "$2"
        ;;
    "finish"|"done")
        finish_feature
        ;;
    "dev"|"d")
        echo "Switching to development branch..."
        git checkout development
        git pull origin development
        show_status
        ;;
    "main"|"m")
        echo "Switching to main branch..."
        git checkout main
        git pull origin main
        show_status
        ;;
    *)
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  status, s        Show current git status"
        echo "  dev, d           Switch to development branch"
        echo "  main, m          Switch to main branch"
        echo "  feature, f       Start a new feature branch"
        echo "                   Example: ./dev.sh feature add-export"
        echo "  finish, done     Finish current feature and merge to development"
        echo ""
        echo "Workflow:"
        echo "  1. ./dev.sh dev                    # Switch to development"
        echo "  2. ./dev.sh feature my-feature     # Start new feature"
        echo "  3. # ... make changes ..."
        echo "  4. ./dev.sh finish                 # Merge back to development"
        echo "  5. ./deploy.sh                     # Deploy to production"
        ;;
esac