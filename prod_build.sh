#!/usr/bin/bash
# This script will delete the 'dist' folder in all projects and then build them
# Start working in the API Types
cd API\ Types || exit

# Delete 'dist' folder in API Types
rm -rf dist

# Create a clean install of all modules
npm ci

# Build API Types
npm run build

# Move out of API Types
cd ..

echo "API Types built successfully"
read -p "Press enter to continue"

# Start working in the Backend
cd Backend || exit

# Delete 'dist' folder in Backend
rm -rf dist

# Create a clean install of all modules
npm ci

# Build Backend
npm run build

# Move out of Backend
cd ..

echo "Backend built successfully"
read -p "Press enter to continue"

# Start working in the Frontend
cd Frontend || exit

# Delete 'dist' folder in Frontend
rm -rf dist

# Create a clean install of all modules
npm ci

# Build Frontend
npm run build

# Move out of Frontend
cd ..

echo "Frontend built successfully"
read -p "Press enter to continue"

# Create the node_modules folder in the Backend dist folder
mkdir Backend/dist/node_modules

# Create the @portalseguranca folder in the Backend dist node_modules folder
mkdir Backend/dist/node_modules/@portalseguranca

# Create the api-types folder in the Backend dist node_modules @portalseguranca folder
mkdir Backend/dist/node_modules/@portalseguranca/api-types

# Move the dist contents from API Types to Backend
cp -r API\ Types/dist/* Backend/dist/node_modules/@portalseguranca/api-types

echo "Build Completed"