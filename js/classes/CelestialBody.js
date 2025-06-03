import * as THREE from 'three';
import LightingUtils from '../utils/LightingUtils.js';

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
    constructor(name, radius, primaryColor, orbitalRadius = 0, orbitalInclination = 0, isEmissive = false, customGeometry = null, ambientLightIntensity = 1.0) {
        this.name = name;
        this.radius = radius;
        this.primaryColor = primaryColor;
        this.ambientLightIntensity = ambientLightIntensity;
        this.mesh = null;
        this.objectGroup = new THREE.Group();
        this.orbitalRadius = orbitalRadius;
        this.orbitalInclination = orbitalInclination;

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

        if (options instanceof THREE.BufferGeometry && customGeometry instanceof THREE.Material) {
            geometry = options;
            material = customGeometry;
        } else if (customGeometry) {
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
            geometry = new THREE.BoxGeometry(0.001, 0.001, 0.001); 
        }
        if (!material) {
            console.error(`[${this.name}] FATAL: Material is undefined in createBaseMesh!`);
            material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = true;
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
        this.addLighting();
    }

    addLighting() {
        if (!this.isEmissive) {
            LightingUtils.addAmbientLight(this.objectGroup, this.ambientLightIntensity * 3.9);
        }
    }

    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
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
        if (this.orbitalRadius === 0 && !this.parentBody) {
            this.setPosition(0, 0, 0);
            return;
        }

        const xPlane = Math.cos(this.orbitAngle || 0) * this.orbitalRadius;
        const zPlane = Math.sin(this.orbitAngle || 0) * this.orbitalRadius;

        const x = xPlane;
        const y = -zPlane * Math.sin(this.orbitalInclination);
        const z =  zPlane * Math.cos(this.orbitalInclination);

        if (this.parentBody && this.parentBody.getObject) {
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
}
