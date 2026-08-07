# Cabs Frontend Release APK Builder
# PowerShell script with better error handling

param(
    [switch]$Clean = $false,
    [switch]$SkipInstall = $false
)

# Set console colors
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "           CABS FRONTEND APK BUILDER" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Project paths
$ProjectRoot = "c:\Users\Av957\OneDrive\Desktop\hrs\cabs\frontend"
$AndroidDir = Join-Path $ProjectRoot "android" 
$OutputDir = "c:\Users\Av957\OneDrive\Desktop\hrs\cabs\RELEASE_BUILDS"

# Function to log steps
function Write-Step {
    param($Step, $Total, $Message)
    Write-Host "[$Step/$Total] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message -ForegroundColor White
}

# Function to check command success
function Test-Command {
    param($Command, $ErrorMessage)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: $ErrorMessage" -ForegroundColor Red
        Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}

try {
    # Step 1: Change directory
    Write-Step 1 8 "Changing to project directory..."
    Set-Location $ProjectRoot
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
    Write-Host ""

    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        throw "package.json not found! Make sure you're in the correct directory."
    }

    # Step 2: Install dependencies
    if (-not $SkipInstall -and (-not (Test-Path "node_modules") -or $Clean)) {
        Write-Step 2 8 "Installing dependencies..."
        Write-Host "This may take a few minutes..." -ForegroundColor Gray
        
        if ($Clean -and (Test-Path "node_modules")) {
            Write-Host "Removing existing node_modules..." -ForegroundColor Gray
            Remove-Item -Recurse -Force "node_modules"
        }
        
        & npm install
        Test-Command "npm install" "Failed to install dependencies!"
    } else {
        Write-Step 2 8 "Dependencies check - skipping installation"
    }
    Write-Host ""

    # Step 3: Expo prebuild
    Write-Step 3 8 "Running Expo prebuild for Android..."
    & npx expo prebuild --platform android
    Test-Command "expo prebuild" "Expo prebuild failed!"
    Write-Host ""

    # Step 4: Change to Android directory
    Write-Step 4 8 "Changing to Android directory..."
    Set-Location $AndroidDir
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
    Write-Host ""

    # Check if gradlew exists
    $GradlewPath = if ($IsWindows -or $env:OS -match "Windows") { "gradlew.bat" } else { "./gradlew" }
    if (-not (Test-Path $GradlewPath)) {
        throw "gradlew not found! Make sure Android project is properly initialized."
    }

    # Step 5: Clean build
    Write-Step 5 8 "Cleaning previous builds..."
    & $GradlewPath clean
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Gradle clean failed, continuing anyway..." -ForegroundColor Yellow
    }
    Write-Host ""

    # Step 6: Build release APK
    Write-Step 6 8 "Building Release APK..."
    Write-Host "This will take several minutes..." -ForegroundColor Gray
    Write-Host "Building..." -ForegroundColor Yellow
    
    & $GradlewPath assembleRelease
    Test-Command "gradlew assembleRelease" "APK build failed!"
    Write-Host ""

    # Step 7: Find and copy APK
    Write-Step 7 8 "Locating and copying APK..."
    
    $ApkPath = Get-ChildItem -Path "app\build\outputs\apk\release" -Filter "*.apk" -Recurse | Select-Object -First 1
    
    if (-not $ApkPath) {
        throw "APK not found in build output!"
    }

    Write-Host "Found APK: $($ApkPath.FullName)" -ForegroundColor Gray

    # Create output directory
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    }

    # Copy APK with timestamp
    $Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $NewApkName = "CabsFrontend-Release-$Timestamp.apk"
    $NewApkPath = Join-Path $OutputDir $NewApkName
    
    Copy-Item $ApkPath.FullName $NewApkPath -Force
    Write-Host ""

    # Step 8: Success
    Write-Step 8 8 "Build Complete!"
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "           BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    
    $ApkInfo = Get-Item $NewApkPath
    Write-Host "APK Location: " -NoNewline -ForegroundColor White
    Write-Host $NewApkPath -ForegroundColor Cyan
    Write-Host "APK Size: " -NoNewline -ForegroundColor White
    Write-Host "$([math]::Round($ApkInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Build Time: " -NoNewline -ForegroundColor White
    Write-Host $Timestamp -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You can now install this APK on Android devices." -ForegroundColor Green
    Write-Host ""
    
    # Open output directory
    Start-Process explorer.exe -ArgumentList $OutputDir
    
} catch {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "           BUILD FAILED!" -ForegroundColor Red  
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")