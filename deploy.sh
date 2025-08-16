#!/usr/bin/bash
# This script will run the build script in all components of the project

# Store arguments
SKIP_INTERACTION=false
AUTO_START=false
UPDATE=false
RESTART_PM2=false

# Go through all arguments
for arg in "$@"
do
  if [[ $arg == "-skip" ]]; then
    SKIP_INTERACTION=true
  elif [[ $arg == "-start" ]]; then
    AUTO_START=true
  elif [[ $arg == "-update" ]]; then
    UPDATE=true
  elif [[ $arg == "-restart" ]]; then
    RESTART_PM2=true
  fi
done

# Check if the user wants to update the project
if [[ $UPDATE == true ]]; then
  echo "Updating project..."
  git pull || exit
  echo "Project updated"
  if [[ $SKIP_INTERACTION == false ]]; then
    read -p "Press enter to continue"
  fi
fi

# Start working in the Backend
# ! Backend already builds the API Types
cd Backend || exit

# Create a clean install of all modules
npm ci

# Build Backend
npm run build

# Move out of Backend
cd ..
echo "Backend built successfully"
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
echo "Build Completed"

# Auto start the server if arg is present
if [[ $AUTO_START == true ]]; then
  echo "Starting server..."
  cd Backend || exit
  npm run start
fi

# Restart the server if arg is present
if [[ $RESTART_PM2 == true ]]; then
  echo "Restarting server..."
  pm2 restart Portal-Seguranca --update-env
fi
