import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateMoonPosition } from '../utils/AstronomicalCalculations.js';


/**
 * Moon class representing Earth's moon
 */
export class Moon extends CelestialBody {
    /**
     * @param {CelestialBody} parentBody - The parent celestial body (e.g., Earth)
     */
    constructor(parentBody) {
        const inclinationDegrees = 5.1;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.MOON.NAME,
            CONFIG.MOON.RADIUS,
            CONFIG.MOON.COLOR,
            CONFIG.MOON.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.5
        );
        this.parentBody = parentBody;
        this.orbitSpeed = CONFIG.MOON.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MOON.ROTATION_SPEED;
        this.orbitAngle = calculateMoonPosition();
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use local high-resolution Moon texture with enhanced properties
        const moonTexture = textureLoader.load('/textures/moon_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Moon: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: moonTexture,
            bumpMap: moonTexture,
            bumpScale: 0.002,
            emissive: new THREE.Color(0x111111),
            emissiveIntensity: 0.1
        });
    }
    
    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the moon
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
