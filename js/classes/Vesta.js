import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';

/**
 * Vesta class representing the asteroid 4 Vesta
 * The second-most massive asteroid in the asteroid belt
 */
export class Vesta extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 7.1;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.VESTA.NAME,
            CONFIG.VESTA.RADIUS,
            CONFIG.VESTA.COLOR,
            CONFIG.VESTA.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.25
        );
        this.orbitSpeed = CONFIG.VESTA.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.VESTA.ROTATION_SPEED;
        this.orbitAngle = calculateOrbitalAngle('VESTA');
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use Vesta texture with enhanced properties
        const vestaTexture = textureLoader.load('/textures/vesta_texture.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Vesta: Error loading texture:`, err); }
        );

        // Vesta has an irregular shape, so we'll create a slightly deformed sphere
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        // Apply slight deformation to simulate irregular shape
        geometry.scale(1.0, 0.9, 0.85);

        super.createBaseMesh({
            map: vestaTexture,
            bumpMap: vestaTexture,
            bumpScale: 0.008,
            shininess: 2,
            specular: new THREE.Color(0x222222),
            baseColor: new THREE.Color(0x8a7f72)
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