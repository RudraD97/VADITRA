$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
Set-Location android
.\gradlew.bat assembleDebug
if ($?) { Write-Host "APK: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Green }
