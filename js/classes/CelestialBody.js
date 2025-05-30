import * as THREE from 'three';
import LightingUtils from '../utils/LightingUtils.js';
import { ColorUtils } from '../utils/ColorUtils.js';

/**
 * Base class for all celestial bodies in the solar system
 */
export class CelestialBody {
    /**
     * @param {string} name - Name of the celestial body
     * @param {number} radius - Radius in scene units
     * @param {number} primaryColor - Primary color as a hex value
     * @param {boolean} isEmissive - Whether the body is emissive
     * @param {THREE.Geometry} customGeometry - Optional custom geometry
     */
    constructor(name, radius, primaryColor, isEmissive = false, customGeometry = null, ambientLightIntensity = 1.0) { // Default ambient intensity
        this.name = name;
        this.radius = radius;
        this.primaryColor = primaryColor;
        this.ambientLightIntensity = ambientLightIntensity; // Store it
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
     * @param {THREE.Geometry} [customGeometry] - Optional custom geometry
     */
    createBaseMesh(options, customGeometry = null) {
        let geometry, material;

        // Check if 'options' is actual geometry and 'customGeometry' is a pre-made material (our debug case)
        if (options instanceof THREE.BufferGeometry && customGeometry instanceof THREE.Material) {
            geometry = options;     // 'options' (1st arg) is the geometry
            material = customGeometry; // 'customGeometry' (2nd arg) is the material
        } else if (customGeometry) {
            // Standard case: custom geometry provided, create material from options object
            geometry = customGeometry;
            const isEmissive = options.isEmissive || false;
            const materialParams = {
                map: options.map,
                bumpMap: options.bumpMap,
                bumpScale: options.bumpScale || 0.01,
                baseColor: options.baseColor || new THREE.Color(0x333333),
                emissive: isEmissive
            };
            if (options.normalMap) {
                materialParams.normalMap = options.normalMap;
            }
            material = LightingUtils.createNaturalLightingMaterial(materialParams);
        } else {
            // Default case: no custom geometry, create sphere and material from options object
            geometry = new THREE.SphereGeometry(this.radius, 32, 32);
            const isEmissive = options.isEmissive || false;
            const materialParams = {
                map: options.map,
                bumpMap: options.bumpMap,
                bumpScale: options.bumpScale || 0.01,
                baseColor: options.baseColor || new THREE.Color(0x333333),
                emissive: isEmissive
            };
            if (options.normalMap) {
                materialParams.normalMap = options.normalMap;
            }
            material = LightingUtils.createNaturalLightingMaterial(materialParams);
        }

        if (!geometry) {
            console.error(`[${this.name}] FATAL: Geometry is undefined in createBaseMesh!`);
            // Optionally, create a tiny fallback cube to prevent further errors down the line
            geometry = new THREE.BoxGeometry(0.001, 0.001, 0.001); 
        }
        if (!material) {
            console.error(`[${this.name}] FATAL: Material is undefined in createBaseMesh!`);
            material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = false; // Disable shadows for better visibility
        this.mesh.receiveShadow = true; // But do receive shadows for natural appearance
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
        this.addLighting();
        
    }

    addLighting() {
        // Add ambient lighting based on the body's specified intensity
        // Increased by 20% for all non-emissive bodies
        if (!this.isEmissive) {
            LightingUtils.addAmbientLight(this.objectGroup, this.ambientLightIntensity * 3.9); // 20% increase from 3.25
        }
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
        // Update the material to ensure shine only appears on the side facing the Sun
        if (this.mesh && this.mesh.material) {
            // Create a directional light that points from the sun to this object
            const sunDirection = new THREE.Vector3()
                .subVectors(this.objectGroup.position, position)
                .normalize();
            
            // Update the material's light direction
            if (!this.mesh.material.userData.sunDirection) {
                this.mesh.material.userData.sunDirection = new THREE.Vector3();
            }
            this.mesh.material.userData.sunDirection.copy(sunDirection);
            
            // Reduce specular intensity based on angle to sun (only shine on sun-facing side)
            if (this.mesh.material.specular) {
                // Store original specular color if not already stored
                if (!this.mesh.material.userData.originalSpecular) {
                    this.mesh.material.userData.originalSpecular = this.mesh.material.specular.clone();
                }
            }
        }
    }
    
    /**
     * Toggle label visibility (placeholder for backward compatibility)
     * @param {boolean} visible - Whether the label should be visible
     */
    toggleLabel(visible) {
        // Labels have been removed, this is just a placeholder for compatibility
    }
}
