# Устанавливаем кодировку для корректного отображения
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# Получаем путь к корню проекта (на уровень выше скрипта)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Apply Migration Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[>] Compiling application..." -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray

# Переходим в корень проекта
Set-Location $projectRoot

# Запускаем билд с выводом в консоль
$buildResult = & nest build 2>&1
$buildExitCode = $LASTEXITCODE

# Выводим результат билда
Write-Host $buildResult

if ($buildExitCode -ne 0) {
    Write-Host "`n[ERROR] Build failed! Migration application aborted." -ForegroundColor Red
    exit $buildExitCode
}

Write-Host "`n[OK] Compilation completed successfully!" -ForegroundColor Green
Write-Host "`n[>] Applying migrations..." -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray

# Применяем миграции
$datasourcePath = Join-Path $projectRoot "dist\db\datasource.js"

$migrationResult = & npx typeorm-ts-node-esm migration:run -d $datasourcePath 2>&1
$migrationExitCode = $LASTEXITCODE

# Выводим результат применения миграций
Write-Host $migrationResult

if ($migrationExitCode -ne 0) {
    Write-Host "`n[ERROR] Migration application failed!" -ForegroundColor Red
    exit $migrationExitCode
}

Write-Host "`n[OK] Migrations applied successfully!" -ForegroundColor Green
Write-Host "`n[DONE]`n" -ForegroundColor Cyan