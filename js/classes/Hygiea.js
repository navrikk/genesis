import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

/**
 * Hygiea class representing the asteroid 10 Hygiea
 * The fourth-largest asteroid in the asteroid belt
 */
export class Hygiea extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 3.8;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.HYGIEA.NAME,
            CONFIG.HYGIEA.RADIUS,
            CONFIG.HYGIEA.COLOR,
            CONFIG.HYGIEA.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.15
        );
        this.orbitSpeed = CONFIG.HYGIEA.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.HYGIEA.ROTATION_SPEED;
        this.orbitAngle = 0;
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use Hygiea texture with enhanced properties
        const hygieaTexture = textureLoader.load('/textures/hygiea_texture.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Hygiea: Error loading texture:`, err); }
        );

        // Hygiea is roughly spherical but with some irregularities
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        // Apply moderate deformation to simulate slightly irregular shape
        geometry.scale(1.0, 0.95, 0.92);

        super.createBaseMesh({
            map: hygieaTexture,
            bumpMap: hygieaTexture,
            bumpScale: 0.006,
            shininess: 1,
            specular: new THREE.Color(0x0f0f0f),
            baseColor: new THREE.Color(0x5c5148)
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