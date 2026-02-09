#!/bin/bash
set -o errexit  # Exit on error

echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
python3.9 -m pip install -r requirements.txt

# Debug: List installed packages to verify Django is there
echo "🔍 Verifying installation..."
python3.9 -m pip list

# Run collectstatic
echo "🎨 Collecting static files..."
python3.9 manage.py collectstatic --noinput --clear

echo "✅ Build finished successfully."
