#!/bin/bash
# Script to download the Milky Way panoramic texture

TEXTURE_URL="https://www.solarsystemscope.com/textures/download/8k_stars_milky_way.jpg"
DOWNLOAD_DIR="/Users/nikshepav/tech/moonknight/genesis/assets/textures/skybox"
OUTPUT_FILENAME="milkyway_8k_panorama.jpg"
OUTPUT_PATH="$DOWNLOAD_DIR/$OUTPUT_FILENAME"

# Create the directory if it doesn't exist
mkdir -p "$DOWNLOAD_DIR"

echo "Downloading Milky Way texture to $OUTPUT_PATH..."
# Using curl with -L to follow redirects and -o to specify output file
curl -L -o "$OUTPUT_PATH" "$TEXTURE_URL"

if [ $? -eq 0 ]; then
  echo "Download successful!"
  echo "Texture saved as $OUTPUT_PATH"
else
  echo "Download failed. Please check the URL or your internet connection."
fi
