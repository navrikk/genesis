import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';


/**
 * Mercury class representing the planet Mercury
 */
export class Mercury extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 7.0;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.MERCURY.NAME,
            CONFIG.MERCURY.RADIUS,
            CONFIG.MERCURY.COLOR,
            CONFIG.MERCURY.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            2.2
        );
        this.orbitSpeed = CONFIG.MERCURY.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MERCURY.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {

        const textureLoader = new THREE.TextureLoader();
        const mercuryTexture = textureLoader.load('/textures/mercury_8k.jpg');
        

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
        // Completely static - no rotation or orbit movement
    }

}
