import * as THREE from 'three';

/**
 * Base class for all celestial bodies in the solar system
 */
export class CelestialBody {
    /**
     * @param {string} name - Name of the celestial body
     * @param {number} radius - Radius in scene units
     * @param {number} primaryColor - Primary color as a hex value
     */
    constructor(name, radius, primaryColor = 0xffffff) {
        this.name = name;
        this.radius = radius;
        this.primaryColor = primaryColor;
        this.mesh = null;
        this.objectGroup = new THREE.Group(); // Group to hold mesh and any effects
    }

    /**
     * Creates the 3D mesh for this celestial body
     * To be implemented by subclasses
     */
    createMesh() {
        // Example: Basic sphere
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        const material = new THREE.MeshBasicMaterial({ color: this.primaryColor });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
    }

    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // To be implemented by subclasses if needed (e.g., rotation)
    }

    /**
     * Get the Three.js object group for this body
     * @returns {THREE.Group} The object group
     */
    getObject() {
        return this.objectGroup;
    }

    /**
     * Set position of the entire celestial body group
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     */
    setPosition(x, y, z) {
        this.objectGroup.position.set(x, y, z);
    }
}
