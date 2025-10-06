<#
PowerShell helper to deploy Supabase infra from repository files.

This script expects the following environment variables to be set (locally or via CI secrets):
- SUPABASE_ACCESS_TOKEN  : Supabase CLI access token
- SUPABASE_PROJECT_REF   : Supabase project ref (like 'abcd1234')
- SUPABASE_DB_URL        : Postgres connection string (postgresql://user:pass@host:port/dbname)
- SUPABASE_SERVICE_ROLE_KEY : (optional) service_role key for certain admin operations

The script will:
- verify required env vars
- install supabase CLI if missing
- login and link to project
- apply SQL migrations and seeds using psql (if available)
- create a storage bucket `avatars` (if possible)
- deploy Edge Functions from `functions/edge` folder

This is a best-effort automation — running it without the required secrets will exit early.
#>

Set-StrictMode -Version Latest

Write-Host "Supabase local deploy runner"

$required = @('SUPABASE_ACCESS_TOKEN','SUPABASE_PROJECT_REF','SUPABASE_DB_URL')
$missing = @()
foreach ($v in $required) {
    $val = [System.Environment]::GetEnvironmentVariable($v)
    if ([string]::IsNullOrEmpty($val)) {
        $missing += $v
    }
}
if ($missing.Count -gt 0) {
    Write-Host "Missing environment variables: $($missing -join ', ')" -ForegroundColor Yellow
    Write-Host "Cannot proceed. Please set these env vars locally or add them to CI secrets." -ForegroundColor Yellow
    exit 2
}

function Ensure-Command($name, $installCmd) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "$name not found. Installing..."
        iex $installCmd
        if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
            Write-Host "Failed to install $name. Please install it manually and re-run." -ForegroundColor Red
            exit 3
        }
    }
}

# Ensure supabase CLI (installed via npm)
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "supabase CLI not found. Installing via npm (may require Node.js)..."
    npm install -g supabase
}

Write-Host "Logging into supabase CLI..."
$token = [System.Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN')
supabase login --no-open --token $token

Write-Host "Linking to project ref: $([System.Environment]::GetEnvironmentVariable('SUPABASE_PROJECT_REF'))"
supabase link --project-ref $([System.Environment]::GetEnvironmentVariable('SUPABASE_PROJECT_REF'))

# Apply migrations and seeds using psql if available
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "Applying migrations (via psql)"
    $migrationsPath = Join-Path $PSScriptRoot 'migrations/0001_init.sql'
    if (Test-Path $migrationsPath) {
    $dbUrl = [System.Environment]::GetEnvironmentVariable('SUPABASE_DB_URL')
    Write-Host "Running: psql $dbUrl -f $migrationsPath"
    & psql $dbUrl -f $migrationsPath
    } else {
        Write-Host "Migration file not found at $migrationsPath" -ForegroundColor Yellow
    }

    $seedPath = Join-Path $PSScriptRoot 'seeds/seed_initial.sql'
    if (Test-Path $seedPath) {
    $dbUrl = [System.Environment]::GetEnvironmentVariable('SUPABASE_DB_URL')
    Write-Host "Running seeds: psql $dbUrl -f $seedPath"
    & psql $dbUrl -f $seedPath
    } else {
        Write-Host "Seed file not found at $seedPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "psql not found on PATH. SQL migrations/seeds will be skipped. Install 'postgresql-client' (Linux) or psql (Windows) to enable DB operations." -ForegroundColor Yellow
}

Write-Host "Ensuring storage bucket 'avatars' exists (best-effort)"
try {
    supabase storage create-bucket avatars --public --project-ref $([System.Environment]::GetEnvironmentVariable('SUPABASE_PROJECT_REF')) -y
} catch {
    Write-Host "Bucket create step failed or bucket may already exist. Proceeding." -ForegroundColor Yellow
}

Write-Host "Deploying Edge Functions from functions/edge (best-effort)"
$functionsDir = Join-Path $PSScriptRoot '..\..\functions\edge'
if (Test-Path $functionsDir) {
    Get-ChildItem -Path $functionsDir -Filter "*.ts" | ForEach-Object {
        $funcName = $_.BaseName
        Write-Host "Deploying function: $funcName"
        try {
            supabase functions deploy $funcName --project-ref $([System.Environment]::GetEnvironmentVariable('SUPABASE_PROJECT_REF')) --no-verify
        } catch {
            Write-Host "Failed to deploy function $funcName. Continue to next." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Functions directory not found at $functionsDir" -ForegroundColor Yellow
}

Write-Host "Local deploy script finished. Please review Supabase dashboard to confirm migrations, buckets, and functions." -ForegroundColor Green
