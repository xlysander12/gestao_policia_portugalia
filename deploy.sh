#!/usr/bin/bash
# This script will run the build script in all components of the project

# Store arguments
SKIP_INTERACTION=false
AUTO_START=false

# Go through all arguments
for arg in "$@"
do
  if [[ $arg == "-skip" ]]; then
    SKIP_INTERACTION=true
  elif [[ $arg == "-start" ]]; then
    AUTO_START=true
  fi
done

# Start working in the API Types
cd API-Types || exit

# Create a clean install of all modules
npm ci

# Build API Types
npm run build

# Move out of API Types
cd ..

echo "API Types built successfully"
if [[ $SKIP_INTERACTION == false ]]; then
  read -p "Press enter to continue"
fi

# Start working in the Frontend
cd Frontend || exit

# Create a clean install of all modules
npm ci

# Build Frontend
npm run build

# Move out of Frontend
cd ..

echo "Frontend built successfully"
if [[ $SKIP_INTERACTION == false ]]; then
  read -p "Press enter to continue"
fi

# Start working in the Backend
cd Backend || exit

# Create a clean install of all modules
npm ci

# Build Backend
npm run build
echo "Backend built successfully"
echo "Build Completed"

# Auto start the server if arg is present
if [[ $AUTO_START == true ]]; then
  echo "Starting server..."
  npm run start
fi
