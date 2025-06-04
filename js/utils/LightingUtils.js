import * as THREE from 'three';

/**
 * Utility functions for natural lighting of celestial bodies
 */
const LightingUtils = {
    /**
     * Creates a material with natural lighting for celestial bodies
     * @param {Object} options - Material options
     * @param {THREE.Texture} options.map - Base color texture
     * @param {THREE.Texture} [options.normalMap] - Normal map texture
     * @param {THREE.Texture} [options.bumpMap] - Bump map texture
     * @param {number} [options.bumpScale=0.01] - Bump scale
     * @param {THREE.Color} [options.baseColor] - Base color multiplier (for darkening non-emissive bodies)
     * @param {number} [options.lightIntensity=0.3] - Intensity of natural lighting
     * @param {boolean} [options.emissive=false] - Whether the body emits light (like the Sun)
     * @returns {THREE.Material} Material with natural lighting
     */
    createNaturalLightingMaterial(options) {
        if (options.emissive) {
            return new THREE.MeshBasicMaterial({
                map: options.map,
                color: options.baseColor || 0xffffff,
            });
        }

        const baseColor = options.baseColor || new THREE.Color(0x777777);
        const brighterColor = new THREE.Color().copy(baseColor).multiplyScalar(1.2);
        
        const materialOptions = {
            map: options.map,
            color: brighterColor,
            emissive: new THREE.Color(0x151515),
            reflectivity: 0.18,
        };

        // Only add normalMap if it exists
        if (options.normalMap) {
            materialOptions.normalMap = options.normalMap;
        }

        if (options.bumpMap) {
            materialOptions.bumpMap = options.bumpMap;
            materialOptions.bumpScale = options.bumpScale || 0.01;
        }
        
        return new THREE.MeshLambertMaterial(materialOptions);
    },
    
    /**
     * Adds subtle ambient lighting to a celestial body
     * @param {THREE.Object3D} objectGroup - The object group to add lighting to
     * @param {number} [intensity=0.3] - Intensity of ambient light
     * @param {THREE.Color} [color=0xffffff] - Color of ambient light
     * @returns {THREE.AmbientLight} The created ambient light
     */
    addAmbientLight(objectGroup, intensity = 0.3, color = 0xffffff) {
        const ambientLight = new THREE.AmbientLight(color, intensity);
        objectGroup.add(ambientLight);
        return ambientLight;
    },
    
    /**
     * Adds a directional light to simulate sunlight
     * @param {THREE.Object3D} objectGroup - The object group to add lighting to
     * @param {THREE.Vector3} direction - Direction of the light (from light to object)
     * @param {number} [intensity=0.5] - Intensity of directional light
     * @param {THREE.Color} [color=0xffffff] - Color of directional light
     * @returns {THREE.DirectionalLight} The created directional light
     */
    addDirectionalLight(objectGroup, direction, intensity = 0.5, color = 0xffffff) {
        const directionalLight = new THREE.DirectionalLight(color, intensity);
        directionalLight.position.copy(direction);
        objectGroup.add(directionalLight);
        return directionalLight;
    }
};

export default LightingUtils;
