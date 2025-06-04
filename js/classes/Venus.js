import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import venusTexturePath from '../../assets/textures/venus_surface_8k.jpg';

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
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        // Use local high-resolution Venus texture with enhanced properties
        const venusTexture = textureLoader.load(venusTexturePath,
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
            specular: new THREE.Color(0x222222),
            baseColor: new THREE.Color(0x555555)
        });
    }


    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the planet
     */
    update(deltaTime, animate = true) {
        super.update(deltaTime, animate);
    }
}
