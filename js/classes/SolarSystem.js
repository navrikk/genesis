import * as THREE from 'three';

/**
 * Manages all celestial bodies in the solar system
 */
export class SolarSystem {
    /**
     * @param {THREE.Scene} scene - The three.js scene to add bodies to
     */
    constructor(scene) {
        this.scene = scene;
        this.celestialBodies = [];
        this.animationEnabled = true;
        
        // Add global lighting for all celestial bodies
        this.setupGlobalLighting();
    }

    /**
     * Add a celestial body to the solar system
     * @param {CelestialBody} body - The body to add
     */
    addBody(body) {
        this.celestialBodies.push(body);
        this.scene.add(body.getObject());
        console.log(`${body.name} added to the solar system.`);
    }

    /**
     * Remove a celestial body from the solar system by name
     * @param {string} name - Name of the body to remove
     */
    removeBody(name) {
        const bodyIndex = this.celestialBodies.findIndex(b => b.name === name);
        if (bodyIndex !== -1) {
            const body = this.celestialBodies[bodyIndex];
            this.scene.remove(body.getObject());
            this.celestialBodies.splice(bodyIndex, 1);
            console.log(`${name} removed from the solar system.`);
        }
    }

    /**
     * Update all celestial bodies
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        this.celestialBodies.forEach(body => {
            // Only update rotation, no orbit movement
            body.update(deltaTime, false);
        });
    }

    /**
     * Get a celestial body by name
     * @param {string} name - Name of the body to retrieve
     * @returns {CelestialBody|undefined} The found body or undefined
     */
    getBody(name) {
        return this.celestialBodies.find(b => b.name === name);
    }
    
    /**
     * Get all celestial bodies in the solar system
     * @returns {Array} Array of all celestial bodies
     */
    getBodies() {
        return this.celestialBodies;
    }
    
    /**
     * Toggle animation state for all celestial bodies
     * @param {boolean} enabled - Whether animation should be enabled
     */
    toggleAnimation(enabled) {
        this.animationEnabled = enabled;
    }
    
    /**
     * Setup global lighting for the entire scene
     * This provides moderate lighting for all celestial bodies
     */
    setupGlobalLighting() {
        // Add ambient light for basic illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light for some shadows and highlights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 0.5, 1).normalize();
        this.scene.add(directionalLight);
        
        // Add hemisphere light for better color variation
        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        this.scene.add(hemisphereLight);
    }
    
    /**
     * Get the Sun object from the celestial bodies
     * @returns {CelestialBody|undefined} The Sun object or undefined if not found
     */
    getSun() {
        return this.getBody('Sun');
    }

    /**
     * Toggle visibility of all orbit paths in the solar system.
     * @param {boolean} visible - True to show orbit paths, false to hide them.
     */
    toggleAllOrbitPaths(visible) {
        this.celestialBodies.forEach(body => {
            if (body.toggleOrbitPath) { // Check if the method exists
                body.toggleOrbitPath(visible);
            }
        });
        console.log(`All orbit paths set to visible: ${visible}`);
    }
}
