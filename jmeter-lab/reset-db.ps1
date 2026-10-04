$ErrorActionPreference = "Stop"

$labRoot = Split-Path -Parent $PSScriptRoot
$migrationPath = Join-Path $labRoot "migrations\001_create_students_table.sql"
$studentsPath = Join-Path $PSScriptRoot "data\students.csv"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is required to reset the database."
}

if (-not (Test-Path $migrationPath)) {
    throw "Migration file not found: $migrationPath"
}

if (-not (Test-Path $studentsPath)) {
    throw "Student fixture not found: $studentsPath"
}

Write-Host "Starting the PostgreSQL service..."
docker compose -f (Join-Path $labRoot "docker-compose.yml") up -d postgres

Write-Host "Waiting for PostgreSQL to become ready..."
for ($attempt = 1; $attempt -le 30; $attempt++) {
    docker compose -f (Join-Path $labRoot "docker-compose.yml") exec -T postgres `
        pg_isready -U cst_admin -d cst_sms *> $null
    if ($LASTEXITCODE -eq 0) {
        break
    }
    if ($attempt -eq 30) {
        throw "PostgreSQL did not become ready within 30 attempts."
    }
    Start-Sleep -Seconds 2
}

$composeFile = Join-Path $labRoot "docker-compose.yml"
$psqlArgs = @("-f", $composeFile, "exec", "-T", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-U", "cst_admin", "-d", "cst_sms")

Write-Host "Applying the schema migration..."
Get-Content -Raw $migrationPath | docker compose @psqlArgs -f -
if ($LASTEXITCODE -ne 0) {
    throw "Schema migration failed."
}

Write-Host "Clearing existing students..."
docker compose @psqlArgs -c "TRUNCATE TABLE students RESTART IDENTITY;"
if ($LASTEXITCODE -ne 0) {
    throw "Database cleanup failed."
}

Write-Host "Loading students from $studentsPath..."
Get-Content $studentsPath | docker compose @psqlArgs -c "\copy students (student_id, full_name, email, program) FROM STDIN WITH (FORMAT csv, HEADER true)"
if ($LASTEXITCODE -ne 0) {
    throw "Student fixture loading failed."
}

Write-Host "Database reset complete."
