import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import LightingUtils from '../utils/LightingUtils.js';
import deimosTexturePath from '../../assets/textures/deimos_nasa_texture.jpg';


/**
 * Deimos class representing Mars' smaller moon
 * Deimos is highly irregular in shape with dimensions of 15 × 12.2 × 11 km
 * and has a smoother surface than Phobos
 */
export class Deimos extends CelestialBody {
    /**
     * @param {CelestialBody} parentBody - The parent celestial body (Mars)
     */
    constructor(parentBody) {
        const inclinationDegrees = 0.93; // Deimos's orbital inclination to Mars's equator
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.DEIMOS.NAME,
            CONFIG.DEIMOS.RADIUS,
            CONFIG.DEIMOS.COLOR,
            CONFIG.DEIMOS.ORBIT_RADIUS,
            inclinationRadians,
            false,                    // isEmissive
            null,                     // customGeometry (handled in createMesh)
            0.02                      // ambientLightIntensity
        );
        this.parentBody = parentBody;
        this.orbitSpeed = CONFIG.DEIMOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.DEIMOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.createMesh();
        this.updatePosition(); // Ensure initial position is set
    }
    
    createMesh() {
        // Deimos actual dimensions (approximate): 15 km x 12.2 km x 11 km
        // We will use this.radius (derived from CONFIG.DEIMOS.DIAMETER_KM) for a sphere representation.
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            deimosTexturePath,
            (deimosTexture) => { // Success callback
                const materialOptions = {
                    map: deimosTexture,
                    baseColor: new THREE.Color(0x333333) // Slightly darker base color for Deimos
                };
                super.createBaseMesh(materialOptions, geometry);
            },
            undefined, // onProgress callback (optional)
            (error) => { // onError callback
                console.error(`[${this.name}] Error loading texture from ${deimosTexturePath}:`, error);
                console.warn(`[${this.name}] Texture load error. Applying fallback material.`);
                const fallbackMaterialOptions = {
                    baseColor: new THREE.Color(this.primaryColor) // Use primaryColor from constructor
                };
                super.createBaseMesh(fallbackMaterialOptions, geometry);
            }
        );
    }


    /**
     * Update the position based on orbit around Mars
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the moon
     */
    update(deltaTime = 0, animate = true) {
        if (animate && this.orbitSpeed > 0) {
            this.orbitAngle += this.orbitSpeed * deltaTime;
            if (this.orbitAngle > Math.PI * 2) {
                this.orbitAngle -= Math.PI * 2;
            }
        }

        if (animate && this.rotationSpeed > 0 && this.mesh) {
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        }

        // After updating angles, update the position using the base class method
        this.updatePosition(); 
    }
}
