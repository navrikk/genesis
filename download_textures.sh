#!/bin/bash

# Create textures directory if it doesn't exist
mkdir -p assets/textures

# Download Sun texture
echo "Downloading Sun texture..."
curl -o assets/textures/sun_8k.jpg https://www.solarsystemscope.com/textures/download/8k_sun.jpg

# Download Earth textures
echo "Downloading Earth textures..."
curl -o assets/textures/earth_daymap_8k.jpg https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg
curl -o assets/textures/earth_nightmap_8k.jpg https://www.solarsystemscope.com/textures/download/8k_earth_nightmap.jpg
curl -o assets/textures/earth_normal_8k.jpg https://www.solarsystemscope.com/textures/download/8k_earth_normal_map.jpg
curl -o assets/textures/earth_specular_8k.jpg https://www.solarsystemscope.com/textures/download/8k_earth_specular_map.jpg
curl -o assets/textures/earth_clouds_8k.jpg https://www.solarsystemscope.com/textures/download/8k_earth_clouds.jpg

# Download Moon texture
echo "Downloading Moon textures..."
curl -o assets/textures/moon_8k.jpg https://www.solarsystemscope.com/textures/download/8k_moon.jpg
curl -o assets/textures/moon_normal_8k.jpg https://www.solarsystemscope.com/textures/download/8k_moon_normal.jpg

# Download Mars texture
echo "Downloading Mars textures..."
curl -o assets/textures/mars_8k.jpg https://www.solarsystemscope.com/textures/download/8k_mars.jpg
curl -o assets/textures/mars_normal_8k.jpg https://www.solarsystemscope.com/textures/download/8k_mars_normal.jpg

# Download Phobos and Deimos textures
echo "Downloading Mars moons textures..."
curl -o assets/textures/phobos_4k.jpg https://www.solarsystemscope.com/textures/download/4k_phobos.jpg
curl -o assets/textures/deimos_4k.jpg https://www.solarsystemscope.com/textures/download/4k_deimos.jpg

# Download Mercury and Venus textures
echo "Downloading Mercury and Venus textures..."
curl -o assets/textures/mercury_8k.jpg https://www.solarsystemscope.com/textures/download/8k_mercury.jpg
curl -o assets/textures/venus_atmosphere_8k.jpg https://www.solarsystemscope.com/textures/download/8k_venus_atmosphere.jpg
curl -o assets/textures/venus_surface_8k.jpg https://www.solarsystemscope.com/textures/download/8k_venus_surface.jpg

echo "All textures downloaded successfully!"
