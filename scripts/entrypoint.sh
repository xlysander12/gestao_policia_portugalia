#!/bin/sh
set -e

cd Backend

echo "Running migrations..."
npm run migrate

echo "Starting backend..."
exec npm exec pm2-runtime ecosystem.config.js