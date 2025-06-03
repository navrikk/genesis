import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

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
            2.2
        );
        this.orbitSpeed = CONFIG.VENUS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.VENUS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const venusTexture = textureLoader.load('/textures/venus_surface_8k.jpg');

        // Create Venus with a slightly emissive material to make it appear brighter
        super.createBaseMesh({
            map: venusTexture,
            bumpMap: venusTexture,
            bumpScale: 0.005,
            shininess: 15,  // Increased shininess for better light reflection
            specular: new THREE.Color(0x444444)  // Slightly brighter specular highlight
        });
    }

    /**
     * Override the addLighting method to add custom lighting for Venus
     */
    addLighting() {
        // Add standard ambient light from parent class with increased intensity
        super.addLighting();
        
        // Add a subtle point light inside Venus to enhance its brightness
        // This simulates the bright reflective nature of Venus's atmosphere
        const venusLight = new THREE.PointLight(0xffcc88, 0.5, this.radius * 4);
        venusLight.position.set(0, 0, 0);
        this.objectGroup.add(venusLight);
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
