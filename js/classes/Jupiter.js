import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';

/**
 * Jupiter class representing the planet Jupiter
 */
export class Jupiter extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 1.31; // Jupiter's orbital inclination
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.JUPITER.NAME,
            CONFIG.JUPITER.RADIUS,
            CONFIG.JUPITER.COLOR,
            CONFIG.JUPITER.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.8
        );
        this.config = CONFIG.JUPITER;
        this.orbitSpeed = CONFIG.JUPITER.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.JUPITER.ROTATION_SPEED;
        this.orbitAngle = calculateOrbitalAngle('JUPITER');
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use local high-resolution Jupiter texture with enhanced properties
        const jupiterTexture = textureLoader.load('/textures/jupiter_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Jupiter: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: jupiterTexture,
            bumpMap: jupiterTexture,
            bumpScale: 0.005, // Subtle bump for gas giant appearance
            shininess: 8,
            specular: new THREE.Color(0x444444)
        });
    }

    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the planet
     */
    update(deltaTime, animate = true) {
        if (animate && this.orbitSpeed > 0) {
            this.orbitAngle += this.orbitSpeed * deltaTime;
            if (this.orbitAngle > Math.PI * 2) {
                this.orbitAngle -= Math.PI * 2;
            }
        }

        if (animate && this.rotationSpeed > 0 && this.mesh) {
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        }

        this.updatePosition();
    }
}