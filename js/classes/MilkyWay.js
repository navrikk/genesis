import * as THREE from 'three';
import CONFIG from '../config.js';

/**
 * Creates and manages the Milky Way galaxy backdrop using a local panoramic texture.
 */
export class MilkyWay {
    /**
     * @param {THREE.Scene} scene - The three.js scene to add the Milky Way to.
     * @param {function} [onLoadCallback] - Optional callback to execute when texture loading is complete or fails.
     */
    constructor(scene, onLoadCallback = null) {
        this.scene = scene;
        this.mesh = null;
        this.geometry = null;
        this.material = null;
        this.onLoadCallback = onLoadCallback;
        this.createMilkyWay();
    }

    /**
     * Creates the Milky Way backdrop using a local panoramic texture on a sphere.
     */
    createMilkyWay() {
        this.geometry = new THREE.SphereGeometry(CONFIG.STARFIELD.RADIUS * 0.95, 64, 64);

        this.material = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            color: 0x000010,
        });

        const textureLoader = new THREE.TextureLoader();

        textureLoader.load(
            '/textures/milkyway_eso_16k_processed.jpg',
            (loadedTexture) => {
                if (this.material.map) {
                    this.material.map.dispose();
                }
                loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                this.material.map = loadedTexture;
                this.material.color.set(0x303030);
                this.material.needsUpdate = true;
                if (this.onLoadCallback) this.onLoadCallback();
            },
            undefined,
            (error) => {
                if (this.material.map) {
                     this.material.map.dispose();
                     this.material.map = null;
                }
                this.material.color.set(0x000010);
                this.material.needsUpdate = true;
                if (this.onLoadCallback) this.onLoadCallback();
            }
        );
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        this.mesh.rotation.order = 'YXZ';
        this.mesh.rotation.y = Math.PI;
        this.mesh.rotation.x = Math.PI / 6;
        
        this.scene.add(this.mesh);
    }

    /**
     * Updates the Milky Way backdrop. Currently static.
     * @param {number} deltaTime - Time since the last frame (in seconds).
     */
    update(deltaTime) {
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
                this.material.map.dispose();
            }
            this.material.dispose();
            this.material = null;
        }
        this.mesh = null;
    }
}
