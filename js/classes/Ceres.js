import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';

/**
 * Ceres class representing the dwarf planet Ceres
 * The largest object in the asteroid belt between Mars and Jupiter
 */
export class Ceres extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 10.6;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.CERES.NAME,
            CONFIG.CERES.RADIUS,
            CONFIG.CERES.COLOR,
            CONFIG.CERES.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.1
        );
        this.orbitSpeed = CONFIG.CERES.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.CERES.ROTATION_SPEED;
        this.orbitAngle = calculateOrbitalAngle('CERES');
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use Ceres texture with enhanced properties
        const ceresTexture = textureLoader.load('/textures/asteroids/ceres_texture.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Ceres: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: ceresTexture,
            bumpMap: ceresTexture,
            bumpScale: 0.003,
            shininess: 2,
            specular: new THREE.Color(0x444444),
            baseColor: new THREE.Color(0xffffff),
            isEmissive: false
        });
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