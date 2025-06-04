import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

/**
 * Mars class representing the planet Mars
 */
export class Mars extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 1.85;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.MARS.NAME,
            CONFIG.MARS.RADIUS,
            CONFIG.MARS.COLOR,
            CONFIG.MARS.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.8
        );
        this.orbitSpeed = CONFIG.MARS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MARS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use local high-resolution Mars texture with enhanced properties
        const marsTexture = textureLoader.load('/textures/mars_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Mars: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: marsTexture,
            bumpMap: marsTexture,
            bumpScale: 0.01,
            shininess: 5,
            specular: new THREE.Color(0x222222)
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
