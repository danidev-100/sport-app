# Sport Dev Launcher
# Starts both backend and frontend in separate windows

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Write-Host "🚀 Starting Sport Dev Environment" -ForegroundColor Cyan
Write-Host ""

# Check node_modules
if (-not (Test-Path (Join-Path $backendPath "node_modules"))) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $backendPath
    npm install
    Pop-Location
}

if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    Pop-Location
}

Write-Host "✅ Dependencies ready" -ForegroundColor Green
Write-Host ""

# Start backend in new window
Write-Host "🔧 Starting Backend (Express on :3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal

# Start frontend in new window
Write-Host "🎨 Starting Frontend (Vite on :5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers starting!" -ForegroundColor Green
Write-Host "   Backend: http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White