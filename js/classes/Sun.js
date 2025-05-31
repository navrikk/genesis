import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import LightingUtils from '../utils/LightingUtils.js';
import CONFIG from '../config.js';

/**
 * Sun class with advanced shader-based visualization
 */
export class Sun extends CelestialBody {
    constructor(scene) {
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
        
        // Create moderately brighter color for the sun (25% brighter)
        const brighterColor = new THREE.Color(this.primaryColor).multiplyScalar(1.25);
        
        // Use base class implementation but specify this is an emissive body
        this.createBaseMesh({
            map: sunTexture,
            baseColor: brighterColor,
            isEmissive: true // Important: mark as emissive body
        });
        
        // Add a moderate point light at the center of the sun
        const sunLight = new THREE.PointLight(0xffffff, 0.9, 0, 1);
        sunLight.position.set(0, 0, 0);
        this.objectGroup.add(sunLight);

        // Add this line to make the Sun's material emissive for the bloom effect
        if (CONFIG.BLOOM_EFFECT && CONFIG.BLOOM_EFFECT.enabled) {
            this.mesh.layers.enable(1); // BLOOM_SCENE layer
        }
        
        // Extremely minimal pulsation effect
        this.pulseTime = 0;
        this.pulseSpeed = 0.1; // Very slow pulsation
        this.pulseIntensity = 0.003; // Extremely subtle intensity (0.3% variation)
        this.baseSunScale = 1.0; // Base scale to animate around
    }
    
    update(deltaTime) {
        // Extremely minimal animation for the sun
        this.pulseTime += deltaTime * this.pulseSpeed;
        
        // Calculate scale factor with extremely subtle variation
        const scaleFactor = this.baseSunScale + Math.sin(this.pulseTime) * this.pulseIntensity;
        
        // Apply extremely subtle pulsating scale
        this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Extremely slow rotation to maintain texture visibility
        this.mesh.rotation.y += this.rotationSpeed * deltaTime * 0.05;
    }
}
