import * as THREE from 'three';
import LightingUtils from '../utils/LightingUtils.js';

/**
 * Base class for all celestial bodies in the solar system
 */
export class CelestialBody {
    static ORBIT_SEGMENTS = 128; // Number of segments for orbit lines
    /**
     * @param {string} name - Name of the celestial body
     * @param {number} radius - Radius in scene units
     * @param {number} primaryColor - Primary color as a hex value
     * @param {boolean} isEmissive - Whether the body is emissive
     * @param {THREE.Geometry} customGeometry - Optional custom geometry
     */
    constructor(name, radius, primaryColor, orbitalRadius = 0, orbitalInclination = 0, isEmissive = false, customGeometry = null, ambientLightIntensity = 1.0) {
        this.name = name;
        this.radius = radius;
        this.primaryColor = primaryColor;
        this.ambientLightIntensity = ambientLightIntensity; // Store it
        this.mesh = null;
        this.objectGroup = new THREE.Group(); // Group to hold mesh and any effects
        this.orbitalRadius = orbitalRadius;
        this.orbitalInclination = orbitalInclination; // In radians
        this.orbitPath = null;
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
     * Updates the celestial body's position based on its orbital parameters.
     * Considers orbital radius, angle, and inclination.
     * If it's a moon (has a parentBody), position is relative to the parent.
     */
    updatePosition() {
        if (this.orbitalRadius === 0 && !this.parentBody) { // Sun or body not orbiting anything
            this.setPosition(0, 0, 0);
            return;
        }

        // Calculate position in the orbital plane (XZ before inclination)
        // this.orbitAngle should be updated by child classes or a central system if dynamic orbits are needed
        const xPlane = Math.cos(this.orbitAngle || 0) * this.orbitalRadius; // Default orbitAngle to 0 if undefined
        const zPlane = Math.sin(this.orbitAngle || 0) * this.orbitalRadius;

        // Apply inclination (rotation around X-axis for an orbit initially in XZ plane)
        // x' = x_plane
        // y' = 0 * cos(inclination) - z_plane * sin(inclination) = -z_plane * sin(inclination)
        // z' = 0 * sin(inclination) + z_plane * cos(inclination) =  z_plane * cos(inclination)
        const x = xPlane;
        const y = -zPlane * Math.sin(this.orbitalInclination);
        const z =  zPlane * Math.cos(this.orbitalInclination);

        if (this.parentBody && this.parentBody.getObject) { // Check if parentBody and getObject method exist
            const parentPos = this.parentBody.getObject().position;
            this.setPosition(parentPos.x + x, parentPos.y + y, parentPos.z + z);
        } else {
            this.setPosition(x, y, z);
        }
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
     * Creates the visual orbit path for this celestial body.
     * @param {THREE.Object3D} targetContainer - The scene or group to add the orbit path to.
     * @param {boolean} isMoon - Flag indicating if this body is a moon (for specific logic if needed, currently unused).
     */
    createOrbitPath(targetContainer, isMoon = false) {
        if (this.orbitalRadius === 0) {
            // console.warn(`[${this.name}] Orbital radius is 0, not creating orbit path.`);
            return;
        }

        const points = [];
        for (let i = 0; i <= CelestialBody.ORBIT_SEGMENTS; i++) {
            const angle = (i / CelestialBody.ORBIT_SEGMENTS) * Math.PI * 2;
            const x = Math.cos(angle) * this.orbitalRadius;
            const z = Math.sin(angle) * this.orbitalRadius;
            points.push(new THREE.Vector3(x, 0, z)); // Orbit in XZ plane
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({ color: 0xEEEEEE, transparent: true, opacity: 0.4 });
        this.orbitPath = new THREE.Line(geometry, material);
        this.orbitPath.name = `${this.name}OrbitPath`;

        // Apply orbital inclination (rotation around X-axis for XZ plane orbit)
        if (this.orbitalInclination) {
            this.orbitPath.rotation.x = this.orbitalInclination;
        }

        // The orbit path is centered at (0,0,0) relative to its targetContainer.
        // targetContainer (parent group or scene) is assumed to be correctly positioned.
        if (isMoon && this.parentBody) {
            // The orbit path vertices are already relative to the parent's origin.
            // Simply add it to the parent's object group.
            this.parentBody.getObject().add(this.orbitPath);
        } else {
            targetContainer.add(this.orbitPath);
        }
        this.orbitPath.visible = false; // Initially hidden
    }

    /**
     * Toggles the visibility of the orbit path.
     * @param {boolean} visible - True to show, false to hide.
     */
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }
}
