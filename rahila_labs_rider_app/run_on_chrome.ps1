# Add Flutter to PATH for this PowerShell session
$env:Path += ";C:\scr\flutter\bin"

Write-Host "========================================"
Write-Host "  Rahila Labs Rider App - Chrome"
Write-Host "========================================"
Write-Host ""

# Check if backend is running
Write-Host "Checking backend connection..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -UseBasicParsing
    Write-Host "[OK] Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Backend might not be running!" -ForegroundColor Yellow
    Write-Host "Please start backend in another terminal:" -ForegroundColor Yellow
    Write-Host "  cd e:\Rahila-Labs-website\backend" -ForegroundColor Yellow
    Write-Host "  python app.py" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway"
}

Write-Host ""
Write-Host "Starting Flutter app on Chrome..."
Write-Host "This may take 1-2 minutes on first run..."
Write-Host ""

# Navigate to project directory
Set-Location "e:\Rahila-Labs-website\rahila_labs_rider_app"

# Run Flutter
flutter run -d chrome

# Keep window open
Write-Host ""
Read-Host "Press Enter to close"
