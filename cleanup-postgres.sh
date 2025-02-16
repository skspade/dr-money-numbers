#!/bin/bash

echo "🧹 Cleaning up PostgreSQL installation..."

# Stop PostgreSQL service
brew services stop postgresql@16

# Uninstall PostgreSQL
brew uninstall postgresql@16

# Remove PostgreSQL data directory
rm -rf /opt/homebrew/var/postgresql@16

echo "✅ PostgreSQL has been removed!"