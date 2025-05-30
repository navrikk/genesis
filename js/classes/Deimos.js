import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

import LightingUtils from '../utils/LightingUtils.js';
import deimosTexturePath from '../../assets/textures/deimos_nasa_texture.jpg';

/**
 * Deimos class representing Mars' smaller moon
 * Deimos is highly irregular in shape with dimensions of 15 × 12.2 × 11 km
 * and has a smoother surface than Phobos
 */
export class Deimos extends CelestialBody {
    /**
     * @param {THREE.Vector3} parentPosition - Position of Mars
     */
    constructor(parentPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.DEIMOS.NAME, CONFIG.DEIMOS.RADIUS, CONFIG.DEIMOS.COLOR, false, null, 0.02); // Further reduced ambientLightIntensity, isEmissive, customGeometry (sphere), ambientLightIntensity
        this.parentPosition = parentPosition;
        this.orbitRadius = CONFIG.DEIMOS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.DEIMOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.DEIMOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.createMesh();
        this.updatePosition(); // Ensure initial position is set
    }
    
    createMesh() {
        // Deimos actual dimensions (approximate): 15 km x 12.2 km x 11 km
        // We will use this.radius (derived from CONFIG.DEIMOS.DIAMETER_KM) for a sphere representation.
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            deimosTexturePath,
            (deimosTexture) => { // Success callback
                const material = LightingUtils.createNaturalLightingMaterial({
                    map: deimosTexture,
                    baseColor: new THREE.Color(0x333333), // Slightly darker base color for Deimos
                    // ambientLightIntensity: this.ambientLightIntensity, // This is not used by createNaturalLightingMaterial directly
                });
                this.createBaseMesh(geometry, material);
            },
            undefined, // onProgress callback (optional)
            (error) => { // onError callback
                console.error(`[${this.name}] Error loading texture from ${deimosTextureUrl}:`, error);
                console.warn(`[${this.name}] Texture load error. Applying fallback material.`);
                const fallbackMaterial = new THREE.MeshLambertMaterial({ color: this.primaryColor || 0x777777 });
                this.createBaseMesh(geometry, fallbackMaterial);
            }
        );
    }

    // createFallbackSphereMesh method removed as GLTF loading is removed.
    
    /**
     * Update the position based on orbit around Mars
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the moon
     */
    update(deltaTime = 0, animate = true) {
        if (animate && deltaTime) {
            // Update orbit angle based on orbit speed (slower than Phobos)
            this.orbitAngle += this.orbitSpeed * deltaTime;
            if (this.orbitAngle > Math.PI * 2) {
                this.orbitAngle -= Math.PI * 2;
            }
            
            // Apply rotation around own axis
            if (this.mesh) {
                this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            }
            
            // Update position
            this.updatePosition();
        }
    }
    
    /**
     * Update the position based on current orbit angle
     */
    updatePosition() {
        // Calculate position based on orbit angle
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        // Update position relative to Mars
        this.objectGroup.position.set(
            this.parentPosition.x + x,
            this.parentPosition.y,
            this.parentPosition.z + z
        );
    }
    
    /**
     * Update the parent planet's position
     * @param {THREE.Vector3} position - New parent position
     */
    updateParentPosition(position) {
        this.parentPosition.copy(position);
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.parentPosition); // Update orbit path position when parent moves
        }
    }
    
    /**
     * Set the sun position (used for lighting effects)
     * @param {THREE.Vector3} position - Sun position
     */
    setSunPosition(position) {
        // We're using the base class implementation which doesn't need this
        // but we need to implement it for compatibility with Mars.js
    }
    
    /**
     * Get the orbit path for external use
     * @returns {THREE.Line} The orbit path visualization
     */
    getOrbitPath() {
        return this.orbitPath;
    }
    
    /**
     * Creates an orbit path visualization and adds it to the scene
     * @param {THREE.Scene} scene - Scene to add the orbit path to
     */
    createOrbitPath(scene) {
        // Create the orbit path visualization
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0xaaaaaa,
            opacity: 0.5,
            transparent: true
        });
        
        // Create orbit path with a resolution of 128 segments
        const orbitPoints = [];
        for (let i = 0; i <= 512; i++) {
            const angle = (i / 512) * Math.PI * 2;
            orbitPoints.push(
                Math.cos(angle) * this.orbitRadius,
                0,
                Math.sin(angle) * this.orbitRadius
            );
        }
        
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbitPath.position.copy(this.parentPosition); // Set orbit path position to parent's position
        scene.add(this.orbitPath);
        
        return this.orbitPath;
    }

    /**
     * Toggles the visibility of the orbit path.
     * @param {boolean} visible - Whether the orbit path should be visible.
     */
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        } else {
        }
    }
}
