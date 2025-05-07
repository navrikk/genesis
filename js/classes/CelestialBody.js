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
     * Creates the 3D mesh for this celestial body with proper lighting setup
     * @param {Object} options - Options for mesh creation
     * @param {THREE.Texture} options.map - Base color texture
     * @param {THREE.Texture} [options.normalMap] - Normal map texture
     * @param {THREE.Texture} [options.specularMap] - Specular map texture
     * @param {THREE.Texture} [options.bumpMap] - Bump map texture
     * @param {number} [options.bumpScale=0.02] - Bump scale
     * @param {number} [options.shininess=5] - Material shininess
     * @param {THREE.Color} [options.specular] - Specular color
     */
    createBaseMesh(options) {
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create material with moderate lighting
        const materialOptions = {
            map: options.map,
            normalMap: options.normalMap,
            specularMap: options.specularMap,
            bumpMap: options.bumpMap,
            bumpScale: options.bumpScale || 0.02,
            shininess: options.shininess || 5,
            specular: options.specular || new THREE.Color(0x111111)
        };
        
        const material = new THREE.MeshPhongMaterial(materialOptions);
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
        
        // Add ambient light for moderate illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.objectGroup.add(ambientLight);
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

    /**
     * Set the sun position (no longer used for lighting)
     * @param {THREE.Vector3} position - Position of the sun
     */
    setSunPosition(position) {
        // This method is kept for compatibility but no longer updates lighting
    }
    
    /**
     * Toggle label visibility (placeholder for backward compatibility)
     * @param {boolean} visible - Whether the label should be visible
     */
    toggleLabel(visible) {
        // Labels have been removed, this is just a placeholder for compatibility
    }
}
