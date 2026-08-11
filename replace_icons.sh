#!/usr/bin/env bash
set -e

LOGO_SRC="src/assets/images/app_logo_1784456159775.jpg"

if [ ! -f "$LOGO_SRC" ]; then
  echo "Error: Source logo $LOGO_SRC not found!"
  exit 1
fi

echo "=== Resizing and replacing mipmap launcher icons ==="

# Define standard launcher icon sizes (square and round)
declare -A LAUNCHER_SIZES=(
  ["mdpi"]="48x48"
  ["hdpi"]="72x72"
  ["xhdpi"]="96x96"
  ["xxhdpi"]="144x144"
  ["xxxhdpi"]="192x192"
)

# Define adaptive foreground icon sizes
declare -A FOREGROUND_SIZES=(
  ["mdpi"]="108x108"
  ["hdpi"]="162x162"
  ["xhdpi"]="216x216"
  ["xxhdpi"]="324x324"
  ["xxxhdpi"]="432x432"
)

for dpi in "${!LAUNCHER_SIZES[@]}"; do
  size="${LAUNCHER_SIZES[$dpi]}"
  dest_dir="android/app/src/main/res/mipmap-$dpi"
  mkdir -p "$dest_dir"
  
  # Standard launcher icon
  convert "$LOGO_SRC" -resize "$size!" "$dest_dir/ic_launcher.png"
  # Round launcher icon
  convert "$LOGO_SRC" -resize "$size!" "$dest_dir/ic_launcher_round.png"
  
  echo "Created standard & round icons for $dpi ($size)"
done

for dpi in "${!FOREGROUND_SIZES[@]}"; do
  size="${FOREGROUND_SIZES[$dpi]}"
  dest_dir="android/app/src/main/res/mipmap-$dpi"
  mkdir -p "$dest_dir"
  
  # Foreground adaptive icon
  convert "$LOGO_SRC" -resize "$size!" "$dest_dir/ic_launcher_foreground.png"
  
  echo "Created foreground icon for $dpi ($size)"
done


echo "=== Resizing and replacing splash screens ==="

# Let's define splash screens (with black background or centered logo on black)
# Since the logo is 1:1, we can create splash screen images by centering the logo on a black background of appropriate size, or stretching it.
# To make it look extremely clean, we'll compose the logo in the center of a black canvas of the destination size.

create_splash() {
  local width=$1
  local height=$2
  local dest=$3
  
  # Calculate logo size (e.g., 40% of the minimum dimension)
  local logo_size
  if [ "$width" -lt "$height" ]; then
    logo_size=$((width * 40 / 100))
  else
    logo_size=$((height * 40 / 100))
  fi
  
  # Create directory if it doesn't exist
  mkdir -p "$(dirname "$dest")"
  
  # Generate splash by placing a resized logo in the middle of a black background
  convert "$LOGO_SRC" -resize "${logo_size}x${logo_size}" /tmp/temp_logo.png
  convert -size "${width}x${height}" xc:black /tmp/temp_logo.png -gravity center -composite "$dest"
  
  echo "Created splash: $dest (${width}x${height})"
}

# Standard drawables
convert "$LOGO_SRC" -resize "512x512!" "android/app/src/main/res/drawable/splash.png"

# Landscape splash screens
create_splash 480 320 "android/app/src/main/res/drawable-land-mdpi/splash.png"
create_splash 800 480 "android/app/src/main/res/drawable-land-hdpi/splash.png"
create_splash 1280 720 "android/app/src/main/res/drawable-land-xhdpi/splash.png"
create_splash 1600 960 "android/app/src/main/res/drawable-land-xxhdpi/splash.png"
create_splash 1920 1280 "android/app/src/main/res/drawable-land-xxxhdpi/splash.png"

# Portrait splash screens
create_splash 320 480 "android/app/src/main/res/drawable-port-mdpi/splash.png"
create_splash 480 800 "android/app/src/main/res/drawable-port-hdpi/splash.png"
create_splash 720 1280 "android/app/src/main/res/drawable-port-xhdpi/splash.png"
create_splash 960 1600 "android/app/src/main/res/drawable-port-xxhdpi/splash.png"
create_splash 1280 1920 "android/app/src/main/res/drawable-port-xxxhdpi/splash.png"

echo "=== All icons and splash screens successfully replaced ==="
