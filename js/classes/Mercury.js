import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';


/**
 * Mercury class representing the planet Mercury
 */
export class Mercury extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 7.0; // Mercury's orbital inclination
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.MERCURY.NAME,
            CONFIG.MERCURY.RADIUS,
            CONFIG.MERCURY.COLOR,
            CONFIG.MERCURY.ORBIT_RADIUS, // orbitalRadius
            inclinationRadians,         // orbitalInclination
            false,                      // isEmissive
            null,                       // customGeometry
            2.2                         // ambientLightIntensity
        );
        this.orbitSpeed = CONFIG.MERCURY.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MERCURY.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.createMesh();
        this.createOrbitPath(scene);
        this.updatePosition();
    }

    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const mercuryTexture = textureLoader.load('/textures/mercury_8k.jpg');
        
        // Use base class implementation for mesh creation with proper lighting
        super.createBaseMesh({
            map: mercuryTexture,
            bumpMap: mercuryTexture,
            bumpScale: 0.02,
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

        this.updatePosition(); // Use base class method
    }

}
