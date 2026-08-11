#!/usr/bin/env bash
set -e

SDK_DIR="/opt/android-sdk"
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

if [ ! -d "$SDK_DIR/cmdline-tools/latest" ]; then
  echo "=== Creating Android SDK directories ==="
  mkdir -p "$SDK_DIR/cmdline-tools"

  echo "=== Downloading Command Line Tools ==="
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip

  echo "=== Unpacking Command Line Tools ==="
  unzip -q /tmp/cmdline-tools.zip -d "$SDK_DIR/cmdline-tools"
  mv "$SDK_DIR/cmdline-tools/cmdline-tools" "$SDK_DIR/cmdline-tools/latest"
  rm -f /tmp/cmdline-tools.zip
fi

export ANDROID_HOME="$SDK_DIR"
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "=== Accepting Licenses ==="
yes | sdkmanager --licenses || true

echo "=== Installing SDK Platforms and Build Tools ==="
sdkmanager "platform-tools" "platforms;android-34" "platforms;android-35" "platforms;android-36" "build-tools;34.0.0" "build-tools;35.0.0"

echo "=== Android SDK Setup Complete ==="
