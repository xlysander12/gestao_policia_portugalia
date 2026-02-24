param(
    [bool]$Force = $true,
    [string]$DbHost = $env:DB_HOST,
    [string]$DbUser = $env:DB_USER,
    [string]$DbDatabase = $env:DB_DATABASE,
    [string]$DbPort = $env:DB_PORT,
    [string]$HttpPort = $env:HTTP_PORT,
    [string]$GhAppId = $env:GH_APP_ID,
    [string]$GhInstallationId = $env:GH_INSTALLATION_ID,
    [string]$GhRepoOwner = $env:GH_REPO_OWNER,
    [string]$GhRepoName = $env:GH_REPO_NAME,
    [string]$DiscordClientId = $env:DISCORD_CLIENT_ID,
    [string]$DiscordClientSecret = $env:DISCORD_CLIENT_SECRET,
    [string]$SessionSecret = $env:SESSION_SECRET,
    [string]$DbPassword = $env:DB_PASSWORD,
    [string]$DbRootPassword = $env:DB_ROOT_PASSWORD
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

function New-RandomBase64 {
    param([int]$Bytes)

    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    [Convert]::ToBase64String($buffer)
}

function Set-Default {
    param(
        [string]$Value,
        [string]$Fallback
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $Fallback
    }

    return $Value
}

function Upsert-DockerSecret {
    param(
        [string]$Name,
        [string]$Value,
        [bool]$Replace
    )

    $exists = $false
    docker secret inspect $Name *> $null
    if ($LASTEXITCODE -eq 0) {
        $exists = $true
    }

    if ($exists -and -not $Replace) {
        Write-Host "Skipping existing secret: $Name"
        return
    }

    if ($exists -and $Replace) {
        docker secret rm $Name *> $null
    }

    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($tempFile, $Value, [System.Text.UTF8Encoding]::new($false))
        docker secret create $Name $tempFile *> $null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create secret: $Name"
        }
    }
    finally {
        Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Created secret: $Name"
}

Require-Command docker

$swarmState = docker info --format "{{.Swarm.LocalNodeState}}" 2>$null
if ($LASTEXITCODE -ne 0 -or $swarmState.Trim() -ne "active") {
    Write-Host "Docker Swarm is not active. Initializing swarm..."
    docker swarm init *> $null
    $swarmState = docker info --format "{{.Swarm.LocalNodeState}}" 2>$null
    if ($LASTEXITCODE -ne 0 -or $swarmState.Trim() -ne "active") {
        throw "Failed to initialize Docker Swarm. Initialize it manually and retry."
    }
}

$DbHost = Set-Default $DbHost "db"
$DbUser = Set-Default $DbUser "portal_user"
$DbDatabase = Set-Default $DbDatabase "portal_prod"
$DbPort = Set-Default $DbPort "3306"
$HttpPort = Set-Default $HttpPort "8080"
$GhAppId = Set-Default $GhAppId "0"
$GhInstallationId = Set-Default $GhInstallationId "0"
$GhRepoOwner = Set-Default $GhRepoOwner "changeme-owner"
$GhRepoName = Set-Default $GhRepoName "changeme-repo"
$DiscordClientId = Set-Default $DiscordClientId "changeme-discord-client-id"
$DiscordClientSecret = Set-Default $DiscordClientSecret (New-RandomBase64 32)
$SessionSecret = Set-Default $SessionSecret (New-RandomBase64 48)
$DbPassword = Set-Default $DbPassword (New-RandomBase64 32)
$DbRootPassword = Set-Default $DbRootPassword (New-RandomBase64 32)

Upsert-DockerSecret -Name "db_host" -Value $DbHost -Replace $Force
Upsert-DockerSecret -Name "db_user" -Value $DbUser -Replace $Force
Upsert-DockerSecret -Name "db_database" -Value $DbDatabase -Replace $Force
Upsert-DockerSecret -Name "db_password" -Value $DbPassword -Replace $Force
Upsert-DockerSecret -Name "db_root_password" -Value $DbRootPassword -Replace $Force
Upsert-DockerSecret -Name "db_port" -Value $DbPort -Replace $Force
Upsert-DockerSecret -Name "http_port" -Value $HttpPort -Replace $Force
Upsert-DockerSecret -Name "gh_app_id" -Value $GhAppId -Replace $Force
Upsert-DockerSecret -Name "gh_installation_id" -Value $GhInstallationId -Replace $Force
Upsert-DockerSecret -Name "gh_repo_owner" -Value $GhRepoOwner -Replace $Force
Upsert-DockerSecret -Name "gh_repo_name" -Value $GhRepoName -Replace $Force
Upsert-DockerSecret -Name "discord_client_id" -Value $DiscordClientId -Replace $Force
Upsert-DockerSecret -Name "discord_client_secret" -Value $DiscordClientSecret -Replace $Force
Upsert-DockerSecret -Name "session_secret" -Value $SessionSecret -Replace $Force

Write-Host "All production secrets are ready."
