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
     * @param {THREE.Vector3} parentPosition - Position of Mars
     */
    constructor(parentPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.PHOBOS.NAME, CONFIG.PHOBOS.RADIUS, CONFIG.PHOBOS.COLOR, false, null, 0.15); // Further reduced ambientLightIntensity // isEmissive, customGeometry (null for now, handled in createMesh), ambientLightIntensity
        this.parentPosition = parentPosition;
        this.orbitRadius = CONFIG.PHOBOS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.PHOBOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.PHOBOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        // Phobos's actual dimensions (approximate): 27 km x 22 km x 18 km
        const radiusX = (27 / 2) / CONFIG.SCALE_FACTOR;
        const radiusY = (22 / 2) / CONFIG.SCALE_FACTOR;
        const radiusZ = (18 / 2) / CONFIG.SCALE_FACTOR;

        const geometry = new THREE.SphereGeometry(1, 32, 32); 
        geometry.scale(radiusX, radiusY, radiusZ); // Scale to approximate Phobos' shape

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            '/assets/textures/phobos_nasa_texture.jpg',
            (phobosTexture) => { // Success callback
                // Ensure texture settings if needed (e.g., anisotropy)
                // phobosTexture.anisotropy = renderer.getMaxAnisotropy(); // If renderer is accessible

                console.log(`[${this.name}] Applying Phobos texture.`);
                const material = LightingUtils.createNaturalLightingMaterial({
                    map: phobosTexture,
                    // Phobos is quite dark, so ensure ambient/diffuse are appropriate
                    // It doesn't have a significant normal map in most low-poly representations
                    // baseColor: this.primaryColor, // primaryColor is from CelestialBody, might be too bright
                    ambientLightIntensity: this.ambientLightIntensity, // Use the value set in constructor
                    // No specular map for Phobos typically
                });

                this.createBaseMesh(geometry, material);
                // If there's an update loop or a need to refresh the scene, ensure it happens.
                // For example, if App.js has a render function, this change should be picked up.
            },
            undefined, // onProgress callback (optional)
            (error) => { // onError callback
                console.error(`[${this.name}] Error loading texture:`, error);
                // Fallback: Create mesh with a basic material or color
                console.error(`[${this.name}] Texture load error. Falling back to basic material.`);
                const fallbackMaterial = new THREE.MeshLambertMaterial({ color: this.primaryColor || 0x888888 });
                this.createBaseMesh(geometry, fallbackMaterial);
            }
        );
    }
    
    /**
     * Update the position based on orbit around Mars
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the moon
     */
    update(deltaTime = 0, animate = true) {
        if (animate && deltaTime) {
            // Update orbit angle based on orbit speed
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
        const effectiveOrbitRadius = this.orbitRadius * 0.999735; // User-specified value for fine-tuning
        const x = Math.cos(this.orbitAngle) * effectiveOrbitRadius;
        const z = Math.sin(this.orbitAngle) * effectiveOrbitRadius;
        
        // Update position relative to Mars
        const calculatedX = this.parentPosition.x + x;
        const calculatedY = this.parentPosition.y; // Assuming orbit is in Y=0 plane relative to parent
        const calculatedZ = this.parentPosition.z + z;
        
        this.objectGroup.position.set(calculatedX, calculatedY, calculatedZ);

    }
    
    /**
     * Update the parent planet's position
     * @param {THREE.Vector3} position - New parent position
     */
    updateParentPosition(position) {
        this.parentPosition.copy(position);
        if (this.orbitPath) {
            const oldPathPos = this.orbitPath.position.clone();
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
        for (let i = 0; i <= 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            orbitPoints.push(
                Math.cos(angle) * this.orbitRadius,
                0,
                Math.sin(angle) * this.orbitRadius
            );
        }
        
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbitPath.position.copy(this.parentPosition); // Path is centered on parent
        console.log(`[Phobos createOrbitPath] Created for ${this.name} with radius ${this.orbitRadius.toFixed(3)} at parent X=${this.parentPosition.x.toFixed(3)}, Y=${this.parentPosition.y.toFixed(3)}, Z=${this.parentPosition.z.toFixed(3)}`);
        
        // Add the orbit path to the scene
        scene.add(this.orbitPath);
        console.log(`[Phobos createOrbitPath] OrbitPath scale: X=${this.orbitPath.scale.x.toFixed(3)}, Y=${this.orbitPath.scale.y.toFixed(3)}, Z=${this.orbitPath.scale.z.toFixed(3)}`);
        
        return this.orbitPath;
    }

    /**
     * Toggles the visibility of the orbit path.
     * @param {boolean} visible - Whether the orbit path should be visible.
     */
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
            console.log(`[${this.name}] Orbit path visibility set to: ${visible}`);
        } else {
            console.warn(`[${this.name}] Attempted to toggle orbit path, but orbitPath is null.`);
        }
    }
}
