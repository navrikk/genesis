import * as THREE from 'three';

/**
 * Manages all celestial bodies in the solar system
 */
export class SolarSystem {
    /**
     * @param {THREE.Scene} scene - The three.js scene to add bodies to
     * @param {THREE.Object3D} [parentContainer] - Optional parent container for celestial bodies (like solarSystemGroup)
     */
    constructor(scene, parentContainer = null) {
        this.scene = scene;
        this.parentContainer = parentContainer || scene; // Use parentContainer if provided, otherwise scene
        this.celestialBodies = [];
        this.animationEnabled = true;
        this.orbitLines = [];
        this.orbitsVisible = false;

        this.setupGlobalLighting();
    }

    /**
     * Add a celestial body to the solar system
     * @param {CelestialBody} body - The body to add
     */
    addBody(body) {
        this.celestialBodies.push(body);
        
        // Add moons to their parent's group, planets/asteroids/etc to parentContainer
        if (body.parentBody && body.parentBody.getObject) {
            body.parentBody.getObject().add(body.getObject());
        } else {
            // For planets, asteroids, comets, etc - add to parentContainer
            this.parentContainer.add(body.getObject());
        }
        
        // Create and add orbit visualization
        this.createOrbitForBody(body);
        
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
        }
    }

    /**
     * Update all celestial bodies
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        this.celestialBodies.forEach(body => {
            body.update(deltaTime, this.animationEnabled);
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
     * Create orbit visualization for a celestial body
     * @param {CelestialBody} body - The body to create an orbit for
     */
    createOrbitForBody(body) {
        if (body.orbitalRadius === 0) return;

        // Check if this body already has an orbit line in our tracking array
        const existingOrbit = this.orbitLines.find(line => line.name === `${body.name}_orbit`);
        if (existingOrbit) {
            return; // Orbit already exists, don't create another
        }

        // Generate random vibrant colors for orbits
        const randomOrbitColors = [
            0x8C7853, 0xFFC649, 0x6B93D6, 0xCD5C5C, 0xD2691E, 0x9B870C, 
            0xB8860B, 0xDAA520, 0xFFD700, 0xC0C0C0, 0xF4A460, 0xDEB887,
            0x4169E1, 0x8B4513, 0x2F4F4F, 0xFF6B6B, 0x4ECDC4, 0x45B7D1,
            0x96CEB4, 0xFECEA8, 0xD63031, 0x74B9FF, 0xA29BFE, 0xFD79A8,
            0xE17055, 0x81ECEC, 0x00B894, 0xE84393, 0x0984E3, 0x6C5CE7
        ];
        const orbitColor = randomOrbitColors[Math.floor(Math.random() * randomOrbitColors.length)];
        
        // Always create the orbit line, but set visibility based on orbitsVisible
        const orbitLine = body.createOrbitVisualization(orbitColor, true);
        
        if (orbitLine) {
            // Set initial visibility
            orbitLine.visible = this.orbitsVisible;
            
            // For moons, add orbit to parent's group
            if (body.parentBody && body.parentBody.getObject) {
                body.parentBody.getObject().add(orbitLine);
            } else {
                // For planets, asteroids, comets, etc - add orbit to same parentContainer
                this.parentContainer.add(orbitLine);
            }
            
            this.orbitLines.push(orbitLine);
        }
    }

    /**
     * Toggle visibility of all orbit lines
     * @param {boolean} visible - Whether orbits should be visible
     */
    toggleOrbits(visible) {
        this.orbitsVisible = visible;
        this.orbitLines.forEach(orbitLine => {
            orbitLine.visible = visible;
        });
        
        // Also update individual body orbit visibility
        this.celestialBodies.forEach(body => {
            body.setOrbitVisibility(visible);
        });
    }

    /**
     * Create orbits for all existing bodies (useful for initialization)
     */
    createAllOrbits() {
        this.celestialBodies.forEach(body => {
            this.createOrbitForBody(body);
        });
    }


}
