# Script para configurar backup automático de PostgreSQL en Windows Task Scheduler
# Ejecutar como Administrador

param(
    [string]$TaskName = "TestService-PostgreSQL-Backup",
    [string]$BackupTime = "02:00",
    [string]$ScriptPath = (Join-Path $PSScriptRoot "backup.ps1")
)

# Verificar que el script de backup existe
if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: No se encontró el script de backup en: $ScriptPath" -ForegroundColor Red
    exit 1
}

# Crear la acción
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""

# Crear el trigger (diario a las 2:00 AM)
$trigger = New-ScheduledTaskTrigger -Daily -At $BackupTime

# Crear la configuración
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Registrar la tarea
try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Backup automático de la base de datos TestService PostgreSQL" -Force
    Write-Host "Tarea programada '$TaskName' creada exitosamente." -ForegroundColor Green
    Write-Host "Se ejecutará diariamente a las $BackupTime." -ForegroundColor Green
    Write-Host "Para modificar: Task Scheduler -> $TaskName" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: No se pudo crear la tarea programada. Ejecutar como Administrador." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}