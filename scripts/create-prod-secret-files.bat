@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "FORCE=true"
set "SECRETS_DIR=secrets"

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
if /I "%~1"=="--dir" (
  if "%~2"=="" (
    echo Missing value for --dir
    exit /b 1
  )
  set "SECRETS_DIR=%~2"
  shift
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
where node >nul 2>nul
if errorlevel 1 (
  echo Missing required command: node
  exit /b 1
)

if not exist "%SECRETS_DIR%" mkdir "%SECRETS_DIR%"

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

call :write_secret db_host "%DB_HOST%"
call :write_secret db_user "%DB_USER%"
call :write_secret db_database "%DB_DATABASE%"
call :write_secret db_password "%DB_PASSWORD%"
call :write_secret db_root_password "%DB_ROOT_PASSWORD%"
call :write_secret db_port "%DB_PORT%"
call :write_secret http_port "%HTTP_PORT%"
call :write_secret gh_app_id "%GH_APP_ID%"
call :write_secret gh_installation_id "%GH_INSTALLATION_ID%"
call :write_secret gh_repo_owner "%GH_REPO_OWNER%"
call :write_secret gh_repo_name "%GH_REPO_NAME%"
call :write_secret discord_client_id "%DISCORD_CLIENT_ID%"
call :write_secret discord_client_secret "%DISCORD_CLIENT_SECRET%"
call :write_secret session_secret "%SESSION_SECRET%"

echo Local secret files are ready in "%SECRETS_DIR%".
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

:write_secret
set "SECRET_NAME=%~1"
set "SECRET_VALUE=%~2"
set "TARGET_FILE=%SECRETS_DIR%\%SECRET_NAME%"

if exist "%TARGET_FILE%" (
  if /I "%FORCE%"=="true" (
    > "%TARGET_FILE%" (echo|set /p="%SECRET_VALUE%")
    echo Wrote secret file: %TARGET_FILE%
    exit /b 0
  ) else (
    echo Skipping existing secret file: %TARGET_FILE%
    exit /b 0
  )
)

> "%TARGET_FILE%" (echo|set /p="%SECRET_VALUE%")
echo Wrote secret file: %TARGET_FILE%
exit /b 0

:usage
echo Usage:
echo   scripts\create-prod-secret-files.bat [--force ^| --no-force] [--dir path]
echo.
echo Default output directory: secrets
exit /b 0
