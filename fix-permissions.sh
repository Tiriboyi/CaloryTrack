#!/bin/bash

# Fix SQLite Database Permissions Script
# Run this if you get SQLITE_READONLY error

echo "Fixing CaloryTrack database permissions..."

# Change to app directory (update this path if different)
APP_DIR="/var/www/calorietrack"
cd "$APP_DIR" || exit 1

# Get current user
CURRENT_USER=$(whoami)

echo "Current user: $CURRENT_USER"
echo "App directory: $APP_DIR"

# Fix directory permissions
echo "Setting directory permissions..."
sudo chmod 775 "$APP_DIR"

# Fix database file if it exists
if [ -f "$APP_DIR/leaderboard.db" ]; then
    echo "Setting database file permissions..."
    sudo chmod 664 "$APP_DIR/leaderboard.db"
    sudo chown $CURRENT_USER:www-data "$APP_DIR/leaderboard.db"
    echo "✓ Database file permissions fixed"
else
    echo "⚠ Database file not found (will be created on first run)"
fi

# Fix ownership
echo "Setting ownership..."
sudo chown -R $CURRENT_USER:www-data "$APP_DIR"

# Show final permissions
echo ""
echo "Final permissions:"
ls -la "$APP_DIR" | grep -E "leaderboard.db|^d"

echo ""
echo "✓ Permissions fixed!"
echo "Now restart your app with: pm2 restart calorietrack"
