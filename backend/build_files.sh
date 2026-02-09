#!/bin/bash
set -o errexit

echo "🚀 Starting build process..."

# Ensure pip is available
echo "🔍 Checking for pip..."
if ! python3.9 -m pip --version > /dev/null 2>&1; then
    echo "⚠️ pip not found. Attempting to install via ensurepip..."
    python3.9 -m ensurepip --default-pip
fi

# Upgrade pip
echo "⬆️ Upgrading pip..."
python3.9 -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
python3.9 -m pip install -r requirements.txt

# Run collectstatic
echo "🎨 Collecting static files..."
python3.9 manage.py collectstatic --noinput --clear

echo "✅ Build finished successfully."
