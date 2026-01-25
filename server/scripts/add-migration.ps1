# Устанавливаем кодировку для корректного отображения
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# Получаем путь к корню проекта (на уровень выше скрипта)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Add Migration Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Запрашиваем имя миграции
Write-Host "[*] Enter migration name:" -ForegroundColor Yellow -NoNewline
$NAME = Read-Host " "
Write-Host "   Migration name: " -ForegroundColor Gray -NoNewline
Write-Host "$NAME" -ForegroundColor White

if ([string]::IsNullOrWhiteSpace($NAME)) {
    Write-Host "`n[ERROR] Migration name cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[>] Compiling application..." -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray

# Переходим в корень проекта
Set-Location $projectRoot

# Запускаем билд с выводом в консоль
$buildResult = & nest build 2>&1
$buildExitCode = $LASTEXITCODE

# Выводим результат билда
Write-Host $buildResult

if ($buildExitCode -ne 0) {
    Write-Host "`n[ERROR] Build failed! Migration generation aborted." -ForegroundColor Red
    exit $buildExitCode
}

Write-Host "`n[OK] Compilation completed successfully!" -ForegroundColor Green
Write-Host "`n[>] Generating migration..." -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray

# Генерируем миграцию
$migrationPath = Join-Path $projectRoot "src\db\migrations\$NAME"
$datasourcePath = Join-Path $projectRoot "dist\db\datasource.js"

$migrationResult = & npx typeorm-ts-node-esm migration:generate $migrationPath -d $datasourcePath 2>&1
$migrationExitCode = $LASTEXITCODE

# Выводим результат генерации миграции
Write-Host $migrationResult

if ($migrationExitCode -ne 0) {
    Write-Host "`n[ERROR] Migration generation failed!" -ForegroundColor Red
    exit $migrationExitCode
}

Write-Host "`n[OK] Migration '$NAME' generated successfully!" -ForegroundColor Green
Write-Host "   Location: $migrationPath" -ForegroundColor Gray
Write-Host "`n[DONE]`n" -ForegroundColor Cyan