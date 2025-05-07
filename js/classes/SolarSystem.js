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
            if (body.update.length > 1) {
                // If the body's update method accepts an animation parameter
                body.update(deltaTime, this.animationEnabled);
            } else {
                // For backward compatibility with bodies that don't have the animation parameter
                body.update(deltaTime);
            }
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
     * Toggle animation state for all celestial bodies
     * @param {boolean} enabled - Whether animation should be enabled
     */
    toggleAnimation(enabled) {
        this.animationEnabled = enabled;
    }
    
    /**
     * Toggle visibility of orbit paths for all planets
     * @param {boolean} visible - Whether orbit paths should be visible
     */
    toggleOrbitPaths(visible) {
        this.celestialBodies.forEach(body => {
            if (body.toggleOrbitPath) {
                body.toggleOrbitPath(visible);
            }
        });
    }
    
    /**
     * Toggle visibility of labels for all celestial bodies
     * @param {boolean} visible - Whether labels should be visible
     */
    toggleLabels(visible) {
        this.celestialBodies.forEach(body => {
            if (body.toggleLabel) {
                body.toggleLabel(visible);
            }
        });
    }
}
