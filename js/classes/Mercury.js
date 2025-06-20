import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';


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
        this.orbitAngle = calculateOrbitalAngle('MERCURY');
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const mercuryTexture = textureLoader.load('/textures/mercury/mercury_8k.jpg',
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
            baseColor: new THREE.Color(0xffffff)
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
