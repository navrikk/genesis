import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import LightingUtils from '../utils/LightingUtils.js';
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
        const sunTexture = textureLoader.load('/textures/sun_8k_alt.jpg');
        sunTexture.anisotropy = 16;
        sunTexture.colorSpace = THREE.SRGBColorSpace;

        const brighterColor = new THREE.Color(this.primaryColor).multiplyScalar(1.25);

        this.createBaseMesh({
            map: sunTexture,
            baseColor: brighterColor,
            isEmissive: true
        });

        const sunLight = new THREE.PointLight(0xffffff, 0.9, 0, 1);
        sunLight.position.set(0, 0, 0);
        this.objectGroup.add(sunLight);

        if (CONFIG.BLOOM_EFFECT && CONFIG.BLOOM_EFFECT.enabled) {
            this.mesh.layers.enable(1);
        }

        this.pulseTime = 0;
        this.pulseSpeed = 0.1;
        this.pulseIntensity = 0.003;
        this.baseSunScale = 1.0;
    }
    
    update(deltaTime) {
        this.pulseTime += deltaTime * this.pulseSpeed;
        
        const scaleFactor = this.baseSunScale + Math.sin(this.pulseTime) * this.pulseIntensity;
        
        this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        this.mesh.rotation.y += this.rotationSpeed * deltaTime * 0.05;
    }
}
