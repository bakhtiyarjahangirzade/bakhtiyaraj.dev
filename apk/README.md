# KuryeBro Android wrapper

Capacitor shell that opens https://www.bakhtiyaraj.dev/budgettracker/ (so the app is always the live web app).
Debug build (needs JDK 17 and the Android SDK, platform 34 / build-tools 34.0.0; `android/local.properties` must contain `sdk.dir=` with forward slashes):

    cd apk && npm install && npx cap sync android
    cd android && gradlew.bat assembleDebug --no-daemon   # run in a normal terminal

Output: `android/app/build/outputs/apk/debug/app-debug.apk`, copied to `storefront/public/budgettracker/kuryebro.apk`.
Permissions: internet, fine/coarse location, camera. Background tracking is not included yet.
