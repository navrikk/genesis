import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';

/**
 * Venus class representing the planet Venus
 */
export class Venus extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 3.4;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.VENUS.NAME,
            CONFIG.VENUS.RADIUS,
            CONFIG.VENUS.COLOR,
            CONFIG.VENUS.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.3
        );
        this.orbitSpeed = CONFIG.VENUS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.VENUS.ROTATION_SPEED;
        this.orbitAngle = calculateOrbitalAngle('VENUS');
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const venusTexture = textureLoader.load('/textures/venus/venus_surface_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Venus: Error loading texture:`, err); }
        );

        // Venus should be a normal planet - no glow, minimal reflectivity
        super.createBaseMesh({
            map: venusTexture,
            bumpMap: venusTexture,
            bumpScale: 0.001,
            shininess: 2,
            specular: new THREE.Color(0x444444),
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
