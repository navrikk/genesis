import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';

/**
 * Pallas class representing the asteroid 2 Pallas
 * The third-largest asteroid in the asteroid belt
 */
export class Pallas extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 34.8;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.PALLAS.NAME,
            CONFIG.PALLAS.RADIUS,
            CONFIG.PALLAS.COLOR,
            CONFIG.PALLAS.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.2
        );
        this.orbitSpeed = CONFIG.PALLAS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.PALLAS.ROTATION_SPEED;
        this.orbitAngle = calculateOrbitalAngle('PALLAS');
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use Pallas texture with enhanced properties
        const pallasTexture = textureLoader.load('/textures/pallas_texture.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Pallas: Error loading texture:`, err); }
        );

        // Pallas has a very irregular shape, so we'll create a more deformed sphere
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        // Apply significant deformation to simulate very irregular shape
        geometry.scale(1.0, 0.8, 0.75);

        super.createBaseMesh({
            map: pallasTexture,
            bumpMap: pallasTexture,
            bumpScale: 0.008,
            shininess: 0.8,
            specular: new THREE.Color(0x151515),
            baseColor: new THREE.Color(0x7e6858)
        }, geometry);
    }

    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the asteroid
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