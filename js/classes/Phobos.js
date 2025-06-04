import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import LightingUtils from '../utils/LightingUtils.js';



/**
 * Phobos class representing Mars' larger moon
 * Phobos is highly irregular in shape with dimensions of 27 × 22 × 18 km
 * and has a large impact crater called Stickney
 */
export class Phobos extends CelestialBody {
    /**
     * @param {CelestialBody} parentBody - The parent celestial body (Mars)
     */
    constructor(parentBody) {
        const inclinationDegrees = 1.09;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.PHOBOS.NAME,
            CONFIG.PHOBOS.RADIUS,
            CONFIG.PHOBOS.COLOR,
            CONFIG.PHOBOS.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.15
        );
        this.parentBody = parentBody;
        this.orbitSpeed = CONFIG.PHOBOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.PHOBOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        
        // Override radius to match the visual size (largest dimension)
        this.radius = (27 * 200 / 2) / CONFIG.SCALE_FACTOR;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        // Use this.radius (which is now set to the largest dimension) as base
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        
        // Apply scaling for irregular shape: 27 × 22 × 18 km
        const scaleY = 22 / 27; // Y relative to X (largest dimension)
        const scaleZ = 18 / 27; // Z relative to X (largest dimension)
        
        geometry.scale(1, scaleY, scaleZ);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            '/textures/phobos_nasa_texture.jpg',
            (phobosTexture) => {
                // Enhanced texture properties for better visual quality
                phobosTexture.anisotropy = 16;
                phobosTexture.colorSpace = THREE.SRGBColorSpace;

                const materialOptions = {
                    map: phobosTexture,
                    bumpMap: phobosTexture,
                    bumpScale: 0.003,
                    baseColor: new THREE.Color(0x444444),
                    shininess: 2,
                    specular: new THREE.Color(0x111111)
                };
                super.createBaseMesh(materialOptions, geometry);

            },
            undefined,
            (error) => {
                console.error(`[${this.name}] Error loading texture:`, error);

                console.error(`[${this.name}] Texture load error. Falling back to basic material.`);
                const fallbackMaterialOptions = {
                    baseColor: new THREE.Color(this.primaryColor)
                };
                super.createBaseMesh(fallbackMaterialOptions, geometry);
            }
        );
    }
    
    /**
     * Update the position based on orbit around Mars
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the moon
     */
    update(deltaTime = 0, animate = true) {
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
