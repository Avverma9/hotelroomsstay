@echo off
title Building Cabs Frontend Release APK
echo ================================================
echo           CABS FRONTEND APK BUILDER
echo ================================================
echo.

REM Set color
color 0A

REM Change to project directory
echo [1/8] Changing to project directory...
cd /d "c:\Users\Av957\OneDrive\Desktop\hrs\cabs\frontend"
echo Current directory: %CD%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found! Make sure you're in the correct directory.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [2/8] Installing dependencies...
    echo This may take a few minutes...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo [2/8] Dependencies already installed, skipping...
)
echo.

REM Prebuild for native code
echo [3/8] Running Expo prebuild for Android...
call npx expo prebuild --platform android --clear
if errorlevel 1 (
    echo ERROR: Expo prebuild failed!
    pause
    exit /b 1
)
echo.

REM Change to android directory
echo [4/8] Changing to Android directory...
cd android
echo Current directory: %CD%
echo.

REM Clean previous builds
echo [5/8] Cleaning previous builds...
call gradlew clean
if errorlevel 1 (
    echo WARNING: Gradle clean failed, continuing anyway...
)
echo.

REM Check if gradlew exists
if not exist "gradlew.bat" (
    echo ERROR: gradlew.bat not found! Make sure Android project is properly initialized.
    pause
    exit /b 1
)

REM Build release APK
echo [6/8] Building Release APK...
echo This will take several minutes...
echo.
call gradlew assembleRelease
if errorlevel 1 (
    echo ERROR: APK build failed!
    echo Check the error messages above for details.
    pause
    exit /b 1
)
echo.

REM Find and copy APK
echo [7/8] Locating and copying APK...
set APK_PATH=""
for /r "app\build\outputs\apk\release" %%f in (*.apk) do (
    set APK_PATH="%%f"
    goto found
)

:found
if %APK_PATH%=="" (
    echo ERROR: APK not found in build output!
    pause
    exit /b 1
)

REM Create output directory
set OUTPUT_DIR="c:\Users\Av957\OneDrive\Desktop\hrs\cabs\RELEASE_BUILDS"
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

REM Copy APK with timestamp
for /f "tokens=1-4 delims=/ " %%i in ('date /t') do (
    set mydate=%%l-%%j-%%k
)
for /f "tokens=1-2 delims=: " %%i in ('time /t') do (
    set mytime=%%i-%%j
)
set mytime=%mytime: =0%

set NEW_APK_NAME="CabsFrontend-Release-%mydate%-%mytime:.=%.apk"
copy %APK_PATH% "%OUTPUT_DIR%\%NEW_APK_NAME%"

echo [8/8] Build Complete!
echo ================================================
echo           BUILD SUCCESSFUL! 
echo ================================================
echo.
echo APK Location: %OUTPUT_DIR%\%NEW_APK_NAME%
echo APK Size: 
for %%A in (%OUTPUT_DIR%\%NEW_APK_NAME%) do echo %%~zA bytes
echo.
echo You can now install this APK on Android devices.
echo.
pause
exit /b 0