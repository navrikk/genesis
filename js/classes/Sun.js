import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import LightingUtils from '../utils/LightingUtils.js';
import CONFIG from '../config.js';

/**
 * Sun class with advanced shader-based visualization
 */
export class Sun extends CelestialBody {
    constructor() {
        super(CONFIG.SUN.NAME, CONFIG.SUN.RADIUS, 0xFFCC33); // Base yellow color
        this.rotationSpeed = CONFIG.SUN.ROTATION_SPEED;
        this.createMesh();
    }

    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('/textures/high_res/sun_8k_alt.jpg');
        // Set texture properties for better quality
        sunTexture.anisotropy = 16; // Improve texture quality at angles
        sunTexture.encoding = THREE.sRGBEncoding; // Use proper color encoding
        
        // Create slightly brighter color for the sun (5% brighter)
        const brighterColor = new THREE.Color(this.primaryColor).multiplyScalar(1.05);
        
        // Use base class implementation but specify this is an emissive body
        this.createBaseMesh({
            map: sunTexture,
            baseColor: brighterColor,
            isEmissive: true // Important: mark as emissive body
        });
        
        // Add a point light at the center of the sun
        const sunLight = new THREE.PointLight(0xffffff, 0.84, 0, 1);
        sunLight.position.set(0, 0, 0);
        this.objectGroup.add(sunLight);

        // Add this line to make the Sun's material emissive for the bloom effect
        if (CONFIG.BLOOM_EFFECT && CONFIG.BLOOM_EFFECT.enabled) {
            this.mesh.layers.enable(1); // BLOOM_SCENE layer
        }
    }
    
    update(deltaTime) {
        // Sun rotation
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
    }
}
