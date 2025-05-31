import * as THREE from 'three';
import CONFIG from '../config.js';

/**
 * Creates and manages the Milky Way galaxy backdrop using a local panoramic texture.
 */
export class MilkyWay {
    /**
     * @param {THREE.Scene} scene - The three.js scene to add the Milky Way to.
     */
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.geometry = null;
        this.material = null;
        this.createMilkyWay();
    }

    /**
     * Creates the Milky Way backdrop using a local panoramic texture on a sphere.
     */
    createMilkyWay() {
        // Use a slightly smaller radius than the starfield to avoid z-fighting.
        this.geometry = new THREE.SphereGeometry(CONFIG.STARFIELD.RADIUS * 0.95, 64, 64);
        
        // Initialize material with a fallback color and basic properties.
        // The texture will be loaded and applied asynchronously.
        this.material = new THREE.MeshBasicMaterial({
            side: THREE.BackSide, // Render on the inside of the sphere.
            color: 0x000010,      // Dark blue/black fallback if texture fails.
        });

        const textureLoader = new THREE.TextureLoader();
        const localTexturePath = 'assets/textures/skybox/milkyway_8k_panorama.jpg';

        textureLoader.load(
            localTexturePath,
            (loadedTexture) => {
                console.log(`Local Milky Way texture loaded successfully: ${localTexturePath}`);
                // Ensure any pre-existing map (e.g., from a previous attempt or fallback) is disposed.
                if (this.material.map) {
                    this.material.map.dispose();
                }
                loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
                loadedTexture.encoding = THREE.sRGBEncoding; // sRGB is common for color textures.
                this.material.map = loadedTexture;
                this.material.color.set(0x606060); // Darken the texture to 37.5% brightness.
                this.material.needsUpdate = true;
            },
            undefined, // onProgress callback, not used here.
            (error) => {
                console.error(`Error loading local Milky Way texture from ${localTexturePath}:`, error);
                // Fallback color is already set, but ensure map is null if it was partially set.
                if (this.material.map) {
                     this.material.map.dispose();
                     this.material.map = null;
                }
                this.material.color.set(0x000010); // Re-ensure fallback color is active.
                this.material.needsUpdate = true;
                console.error('Using fallback color for Milky Way backdrop.');
            }
        );
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        // Adjust rotation to position the galaxy.
        // This aims for a horizontal galactic plane, slightly tilted.
        this.mesh.rotation.order = 'YXZ'; // Set rotation order for clarity.
        this.mesh.rotation.y = Math.PI;    // Rotate to orient a specific part of the panorama (e.g., galactic center).
        this.mesh.rotation.x = Math.PI / 6;  // Tilt for a more 'realistic' view from an Earth-like perspective (approx 30 deg).
        
        this.scene.add(this.mesh);
    }

    /**
     * Updates the Milky Way backdrop. Currently static.
     * @param {number} deltaTime - Time since the last frame (in seconds).
     */
    update(deltaTime) {
        // The backdrop is static, so no updates are typically needed here.
    }

    /**
     * Cleans up resources used by the Milky Way backdrop to prevent memory leaks.
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }
        if (this.material) {
            if (this.material.map) {
                this.material.map.dispose(); // Dispose the texture.
            }
            this.material.dispose();     // Dispose the material.
            this.material = null;
        }
        this.mesh = null;
    }
}


