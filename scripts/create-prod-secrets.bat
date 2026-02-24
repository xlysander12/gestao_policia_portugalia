@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "FORCE=true"

:parse_args
if "%~1"=="" goto after_args
if /I "%~1"=="--no-force" (
  set "FORCE=false"
  shift
  goto parse_args
)
if /I "%~1"=="--force" (
  set "FORCE=true"
  shift
  goto parse_args
)
if /I "%~1"=="--help" goto usage
if /I "%~1"=="-h" goto usage
if /I "%~1"=="/?" goto usage

echo Unknown argument: %~1
call :usage
exit /b 1

:after_args
where docker >nul 2>nul
if errorlevel 1 (
  echo Missing required command: docker
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Missing required command: node
  exit /b 1
)

set "SWARM_STATE="
for /f "delims=" %%S in ('docker info --format "{{.Swarm.LocalNodeState}}" 2^>nul') do set "SWARM_STATE=%%S"
if /I not "%SWARM_STATE%"=="active" (
  echo Docker Swarm is not active. Initializing swarm...
  docker swarm init >nul 2>nul
  set "SWARM_STATE="
  for /f "delims=" %%S in ('docker info --format "{{.Swarm.LocalNodeState}}" 2^>nul') do set "SWARM_STATE=%%S"
  if /I not "%SWARM_STATE%"=="active" (
    echo Failed to initialize Docker Swarm. Initialize it manually and retry.
    exit /b 1
  )
)

if not defined DB_HOST set "DB_HOST=db"
if not defined DB_USER set "DB_USER=portal_user"
if not defined DB_DATABASE set "DB_DATABASE=portal_prod"
if not defined DB_PORT set "DB_PORT=3306"
if not defined HTTP_PORT set "HTTP_PORT=8080"
if not defined GH_APP_ID set "GH_APP_ID=0"
if not defined GH_INSTALLATION_ID set "GH_INSTALLATION_ID=0"
if not defined GH_REPO_OWNER set "GH_REPO_OWNER=changeme-owner"
if not defined GH_REPO_NAME set "GH_REPO_NAME=changeme-repo"
if not defined DISCORD_CLIENT_ID set "DISCORD_CLIENT_ID=changeme-discord-client-id"

if not defined DISCORD_CLIENT_SECRET call :gen_random DISCORD_CLIENT_SECRET 32
if not defined SESSION_SECRET call :gen_random SESSION_SECRET 48
if not defined DB_PASSWORD call :gen_random DB_PASSWORD 32
if not defined DB_ROOT_PASSWORD call :gen_random DB_ROOT_PASSWORD 32

call :upsert_secret db_host "%DB_HOST%"
call :upsert_secret db_user "%DB_USER%"
call :upsert_secret db_database "%DB_DATABASE%"
call :upsert_secret db_password "%DB_PASSWORD%"
call :upsert_secret db_root_password "%DB_ROOT_PASSWORD%"
call :upsert_secret db_port "%DB_PORT%"
call :upsert_secret http_port "%HTTP_PORT%"
call :upsert_secret gh_app_id "%GH_APP_ID%"
call :upsert_secret gh_installation_id "%GH_INSTALLATION_ID%"
call :upsert_secret gh_repo_owner "%GH_REPO_OWNER%"
call :upsert_secret gh_repo_name "%GH_REPO_NAME%"
call :upsert_secret discord_client_id "%DISCORD_CLIENT_ID%"
call :upsert_secret discord_client_secret "%DISCORD_CLIENT_SECRET%"
call :upsert_secret session_secret "%SESSION_SECRET%"

echo All production secrets are ready.
exit /b 0

:gen_random
set "TARGET_NAME=%~1"
set "BYTES=%~2"
set "RANDOM_VALUE="
for /f "delims=" %%R in ('node -e "process.stdout.write(require('crypto').randomBytes(%BYTES%).toString('base64'))"') do set "RANDOM_VALUE=%%R"
if not defined RANDOM_VALUE (
  echo Failed to generate random value for %TARGET_NAME%.
  exit /b 1
)
set "%TARGET_NAME%=%RANDOM_VALUE%"
exit /b 0

:upsert_secret
set "SECRET_NAME=%~1"
set "SECRET_VALUE=%~2"

docker secret inspect "%SECRET_NAME%" >nul 2>nul
if not errorlevel 1 (
  if /I "%FORCE%"=="true" (
    docker secret rm "%SECRET_NAME%" >nul 2>nul
  ) else (
    echo Skipping existing secret: %SECRET_NAME%
    exit /b 0
  )
)

set "TEMP_SECRET_FILE=%TEMP%\secret_%SECRET_NAME%_%RANDOM%.tmp"
powershell -NoProfile -Command "Set-Content -LiteralPath '%TEMP_SECRET_FILE%' -Value $env:SECRET_VALUE -NoNewline" >nul 2>nul
if errorlevel 1 (
  echo Failed to prepare secret value for: %SECRET_NAME%
  if exist "%TEMP_SECRET_FILE%" del "%TEMP_SECRET_FILE%" >nul 2>nul
  exit /b 1
)
docker secret create "%SECRET_NAME%" "%TEMP_SECRET_FILE%" >nul
set "SECRET_CREATE_ERRORLEVEL=%ERRORLEVEL%"
if exist "%TEMP_SECRET_FILE%" del "%TEMP_SECRET_FILE%" >nul 2>nul
if not "%SECRET_CREATE_ERRORLEVEL%"=="0" (
  echo Failed to create secret: %SECRET_NAME%
  exit /b 1
)

echo Created secret: %SECRET_NAME%
exit /b 0

:usage
echo Usage:
echo   scripts\create-prod-secrets.bat [--force ^| --no-force]
echo.
echo Optional environment overrides:
echo   DB_HOST DB_USER DB_DATABASE DB_PORT HTTP_PORT
echo   GH_APP_ID GH_INSTALLATION_ID GH_REPO_OWNER GH_REPO_NAME
echo   DISCORD_CLIENT_ID DISCORD_CLIENT_SECRET SESSION_SECRET DB_PASSWORD DB_ROOT_PASSWORD
exit /b 0
