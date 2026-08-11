#!/usr/bin/env bash
set -e

echo "=== 1. Checking and Installing Java & Utilities ==="
export DEBIAN_FRONTEND=noninteractive
export UCF_FORCE_CONFFOLD=true

if ! command -v java &> /dev/null; then
  echo "Java not found. Installing Java 21 & System Utilities..."
  
  # Clean up any stale apt/dpkg lock files
  echo "Cleaning up any stale package manager locks..."
  killall apt apt-get dpkg 2>/dev/null || true
  rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock /var/cache/apt/archives/lock
  dpkg --configure -a --force-confdef --force-confold || true

  apt-get update
  apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" openjdk-21-jdk-headless unzip wget
else
  echo "Java is already installed: $(java -version 2>&1 | head -n 1)"
fi

echo "=== 2. Setting up Android SDK ==="
chmod +x setup_sdk.sh
./setup_sdk.sh

echo "=== 3. Restoring Clean Gradle Wrapper ==="
wget -q https://raw.githubusercontent.com/gradle/gradle/v8.14.3/gradle/wrapper/gradle-wrapper.jar -O android/gradle/wrapper/gradle-wrapper.jar

echo "=== 4. Setting Environment Variables & local.properties ==="
JAVA_REAL_PATH=$(readlink -f $(which java 2>/dev/null) 2>/dev/null || true)
if [ -n "$JAVA_REAL_PATH" ]; then
  export JAVA_HOME=$(dirname $(dirname "$JAVA_REAL_PATH"))
else
  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
fi
export ANDROID_HOME=/opt/android-sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# Explicitly define sdk.dir in local.properties
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
echo "Created android/local.properties with sdk.dir=$ANDROID_HOME"

echo "=== 4.5. Building Web App & Syncing to Capacitor Android ==="
npm run build
npx cap copy android || npx cap sync android

echo "=== 5. Compiling Android Debug APK ==="
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon --max-workers=1 -Dorg.gradle.jvmargs="-Xmx1024m" -Dorg.gradle.workers.max=1

echo "=== 6. Copying APK to Target Directories & Public Endpoints ==="
cd ..
mkdir -p .build-outputs
mkdir -p APK_DOWNLOAD
mkdir -p stark
mkdir -p public/APK_DOWNLOAD
mkdir -p public/stark
mkdir -p dist/APK_DOWNLOAD
mkdir -p dist/stark

SRC_APK="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$SRC_APK" ]; then
  # Root & output targets
  cp "$SRC_APK" .build-outputs/app-debug.apk
  cp "$SRC_APK" .build-outputs/app-debug.zip
  cp "$SRC_APK" APK_DOWNLOAD/app-debug.apk
  cp "$SRC_APK" APK_DOWNLOAD/app-debug.zip
  cp "$SRC_APK" stark/app-debug.apk
  cp "$SRC_APK" stark/app-debug.zip

  # Public web endpoints
  cp "$SRC_APK" public/app-debug.apk
  cp "$SRC_APK" public/app-debug.zip
  cp "$SRC_APK" public/APK_DOWNLOAD/app-debug.apk
  cp "$SRC_APK" public/APK_DOWNLOAD/app-debug.zip
  cp "$SRC_APK" public/stark/app-debug.apk

  # Dist web endpoints
  cp "$SRC_APK" dist/app-debug.apk
  cp "$SRC_APK" dist/app-debug.zip
  cp "$SRC_APK" dist/APK_DOWNLOAD/app-debug.apk
  cp "$SRC_APK" dist/APK_DOWNLOAD/app-debug.zip
  cp "$SRC_APK" dist/stark/app-debug.apk

  echo "=== Success: APK (17MB) copied to all public, dist, stark, and APK_DOWNLOAD directories ==="
else
  echo "=== Error: Compiled APK was not found at $SRC_APK ==="
  exit 1
fi
