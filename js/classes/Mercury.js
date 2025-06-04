import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import mercuryTexturePath from '../../assets/textures/mercury_8k.jpg';


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
            0.5
        );
        this.orbitSpeed = CONFIG.MERCURY.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MERCURY.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use local high-resolution Mercury texture with enhanced properties
        const mercuryTexture = textureLoader.load(mercuryTexturePath,
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Mercury: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: mercuryTexture,
            bumpMap: mercuryTexture,
            bumpScale: 0.01,
            shininess: 1,
            specular: new THREE.Color(0x111111),
            baseColor: new THREE.Color(0x444444)
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
