import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import CONFIG from '../config.js';

/**
 * Sun class with advanced shader-based visualization
 */
export class Sun extends CelestialBody {
    constructor(scene) {
        super(CONFIG.SUN.NAME, CONFIG.SUN.RADIUS, 0xFFCC33);
        this.rotationSpeed = CONFIG.SUN.ROTATION_SPEED;
        this.createMesh();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('/textures/sun/sun_8k_alt.jpg');
        sunTexture.anisotropy = 16;
        sunTexture.colorSpace = THREE.SRGBColorSpace;

        const brighterColor = new THREE.Color(this.primaryColor).multiplyScalar(1.25);

        super.createBaseMesh({
            map: sunTexture,
            baseColor: brighterColor,
            isEmissive: true,
            emissiveColor: new THREE.Color(0xffaa33),
            emissiveIntensity: 0.6
        });

        // Enhanced solar lighting with multiple layers for realism
        const sunLight = new THREE.PointLight(0xffffff, 1.2, 0, 1);
        sunLight.position.set(0, 0, 0);
        this.objectGroup.add(sunLight);
        
        // Add solar corona effect with larger, dimmer light
        const coronaLight = new THREE.PointLight(0xffdd88, 0.3, this.radius * 8, 2);
        coronaLight.position.set(0, 0, 0);
        this.objectGroup.add(coronaLight);
        
        // Add subtle solar wind effect
        const solarWindLight = new THREE.PointLight(0xffffcc, 0.1, this.radius * 15, 2);
        solarWindLight.position.set(0, 0, 0);
        this.objectGroup.add(solarWindLight);

        if (CONFIG.BLOOM_EFFECT && CONFIG.BLOOM_EFFECT.enabled) {
            this.mesh.layers.enable(1);
        }

        this.pulseTime = 0;
        this.pulseSpeed = 0.05; // Slower, more realistic solar pulsing
        this.pulseIntensity = 0.008; // Slightly more pronounced
        this.baseSunScale = 1.0;
        
        // Add secondary pulse for solar flare simulation
        this.flareTime = 0;
        this.flareSpeed = 0.02;
        this.flareIntensity = 0.015;
    }
    
    update(deltaTime) {
        this.pulseTime += deltaTime * this.pulseSpeed;
        this.flareTime += deltaTime * this.flareSpeed;
        
        // Combine main pulse with solar flare effect
        const mainPulse = Math.sin(this.pulseTime) * this.pulseIntensity;
        const flarePulse = Math.sin(this.flareTime * 3.7) * this.flareIntensity * Math.max(0, Math.sin(this.flareTime));
        
        const scaleFactor = this.baseSunScale + mainPulse + flarePulse;
        
        this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Slightly faster rotation for more dynamic appearance
        this.mesh.rotation.y += this.rotationSpeed * deltaTime * 0.08;
    }
}
