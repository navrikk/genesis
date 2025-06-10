import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

/**
 * Europa class representing Jupiter's moon Europa
 */
export class Europa extends CelestialBody {
    constructor(parentBody) {
        const inclinationDegrees = 0.47; // Europa's orbital inclination
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.EUROPA.NAME,
            CONFIG.EUROPA.RADIUS,
            CONFIG.EUROPA.COLOR,
            CONFIG.EUROPA.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.8
        );
        this.parentBody = parentBody;
        this.config = CONFIG.EUROPA;
        this.orbitSpeed = CONFIG.EUROPA.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.EUROPA.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const europaTexture = textureLoader.load('/textures/jupiter/europa/europa_8k.jpg?v=' + Date.now(),
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.flipY = false;
                texture.repeat.set(1, 1);
                texture.offset.set(0, 0);
                texture.generateMipmaps = true;
            },
            undefined,
            (err) => { console.error(`Europa: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: europaTexture,
            bumpMap: europaTexture,
            bumpScale: 0.005, // Smooth icy surface
            shininess: 0.3,
            specular: new THREE.Color(0x111111),
            baseColor: new THREE.Color(0xffffff)
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