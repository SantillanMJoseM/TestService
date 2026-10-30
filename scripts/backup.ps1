# Script de backup de PostgreSQL para TestService
# Uso: .\scripts\backup.ps1

param(
    [string]$DbHost = "192.168.1.23",
    [int]$DbPort = 5432,
    [string]$DbName = "testing_uat",
    [string]$DbUser = "postgres",
    [string]$BackupDir = ".\backups"
)

# Crear directorio de backups si no existe
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "testservice_backup_${timestamp}.sql"

Write-Host "Iniciando backup de $DbName en $DbHost:$DbPort..." -ForegroundColor Cyan

# Verificar si pg_dump está disponible
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Host "ERROR: pg_dump no encontrado. Instala PostgreSQL client tools." -ForegroundColor Red
    Write-Host "En Windows: agregar C:\Program Files\PostgreSQL\17\bin al PATH" -ForegroundColor Yellow
    exit 1
}

# Ejecutar backup
$env:PGPASSWORD = Read-Host "Contraseña de PostgreSQL" -AsSecureString | ConvertFrom-SecureString
# Nota: pg_dump necesita la contraseña en texto. Usar variable de entorno PGPASSWORD.
$plainPassword = Read-Host "Contraseña de PostgreSQL" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($plainPassword)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:PGPASSWORD = $password
& pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -F p -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completado: $backupFile" -ForegroundColor Green
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host "Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    
    # Limpiar backups antiguos (mantener últimos 7)
    $backups = Get-ChildItem -Path $BackupDir -Filter "testservice_backup_*.sql" | Sort-Object LastWriteTime -Descending
    if ($backups.Count -gt 7) {
        $backups | Select-Object -Skip 7 | Remove-Item -Force
        Write-Host "Se eliminaron $($backups.Count - 7) backups antiguos." -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: El backup falló." -ForegroundColor Red
    exit 1
}

# Limpiar contraseña de la memoria
$env:PGPASSWORD = $null
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)