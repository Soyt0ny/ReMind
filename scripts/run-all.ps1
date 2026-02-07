Param()
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptRoot "..")
$root = $root.Path
Write-Host "Project root: $root"

# Frontend: abre una nueva ventana PowerShell y ejecuta `npm run dev`
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","Set-Location -Path '$root'; npm run dev"
Start-Sleep -Milliseconds 500

# Backend: usa el Python del venv y arranca uvicorn en otra ventana PowerShell
$python = Join-Path $root ".venv\Scripts\python.exe"
$backendDir = Join-Path $root "backend"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","Set-Location -Path '$backendDir'; & '$python' -m uvicorn main:app --reload --port 8000"

Write-Host "Front-end y Back-end están iniciándose en ventanas separadas. Revise las consolas para logs." 
