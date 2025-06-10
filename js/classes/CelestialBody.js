import * as THREE from 'three';

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
        this.orbitLine = null;
        

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
            
            if (isEmissive) {
                // Use emissive material for stars/sun
                material = new THREE.MeshBasicMaterial({
                    map: options.map,
                    color: options.baseColor || 0xffffff,
                    emissive: options.emissiveColor || new THREE.Color(0x222211),
                    emissiveIntensity: options.emissiveIntensity || 0.2
                });
            } else {
                // Create proper Phong material with custom shininess and specular values
                const materialParams = {
                    map: options.map,
                    color: options.baseColor || new THREE.Color(0xffffff),
                    shininess: options.shininess !== undefined ? options.shininess : 0,
                    specular: options.specular || new THREE.Color(0x333333),
                    reflectivity: 0.1
                };
                
                if (options.bumpMap) {
                    materialParams.bumpMap = options.bumpMap;
                    materialParams.bumpScale = options.bumpScale || 0.01;
                }
                
                if (options.normalMap) {
                    materialParams.normalMap = options.normalMap;
                }
                
                material = new THREE.MeshPhongMaterial(materialParams);
            }
        } else {
            geometry = new THREE.SphereGeometry(this.radius, 64, 64);
            const isEmissive = options.isEmissive || false;
            
            if (isEmissive) {
                // Use emissive material for stars/sun
                material = new THREE.MeshBasicMaterial({
                    map: options.map,
                    color: options.baseColor || 0xffffff,
                    emissive: options.emissiveColor || new THREE.Color(0x222211),
                    emissiveIntensity: options.emissiveIntensity || 0.2
                });
            } else {
                // Create proper Phong material with custom shininess and specular values
                const materialParams = {
                    map: options.map,
                    color: options.baseColor || new THREE.Color(0xffffff),
                    shininess: options.shininess !== undefined ? options.shininess : 0,
                    specular: options.specular || new THREE.Color(0x333333),
                    reflectivity: 0.1
                };
                
                if (options.bumpMap) {
                    materialParams.bumpMap = options.bumpMap;
                    materialParams.bumpScale = options.bumpScale || 0.01;
                }
                
                if (options.normalMap) {
                    materialParams.normalMap = options.normalMap;
                }
                
                material = new THREE.MeshPhongMaterial(materialParams);
            }
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
    }


    /**
     * Base update method for animations, rotations, etc.
     * This should be overridden by child classes for specific behavior
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate orbital motion
     */
    update(deltaTime, animate = true) {
        if (animate && this.orbitalSpeed > 0) {
            // Apply motion smoothing for small, fast-moving bodies like Deimos
            const maxAngleChangePerFrame = Math.PI / 6; // 30 degrees max per frame
            let angleChange = this.orbitalSpeed * deltaTime;
            
            if (Math.abs(angleChange) > maxAngleChangePerFrame) {
                angleChange = Math.sign(angleChange) * maxAngleChangePerFrame;
            }
            
            this.orbitAngle += angleChange;
            if (this.orbitAngle > Math.PI * 2) {
                this.orbitAngle -= Math.PI * 2;
            }
        }

        if (animate && this.rotationSpeed > 0 && this.mesh) {
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        }

        this.updatePosition();
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
        const z = zPlane * Math.cos(this.orbitalInclination);


        if (this.parentBody && this.parentBody.getObject) {
            // For moons, position relative to parent - don't add parent's world position
            // since the moon should be added to parent's group, not positioned in world coordinates
            this.setPosition(x, y, z);
        } else {
            // For planets, position relative to Sun at origin
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
     * Creates an orbit visualization line for this celestial body
     * @param {THREE.Color} color - Color of the orbit line
     * @param {boolean} showOrbit - Whether to show the orbit (ignored - orbit is always created)
     */
    createOrbitVisualization(color = 0x444444, showOrbit = true) {
        if (this.orbitalRadius === 0) {
            return;
        }

        // If an orbit line already exists, don't create another one
        if (this.orbitLine) {
            return this.orbitLine;
        }

        // Create orbit geometry with higher resolution and proper closure
        const orbitPoints = [];
        const segments = 256; // Increased for smoother orbits
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const xPlane = Math.cos(angle) * this.orbitalRadius;
            const zPlane = Math.sin(angle) * this.orbitalRadius;
            
            const x = xPlane;
            const y = -zPlane * Math.sin(this.orbitalInclination);
            const z = zPlane * Math.cos(this.orbitalInclination);
            
            orbitPoints.push(new THREE.Vector3(x, y, z));
        }

        // Remove the last point to avoid duplication in LineLoop
        orbitPoints.pop();
        
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.6,
            linewidth: 2
        });

        this.orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
        this.orbitLine.name = `${this.name}_orbit`;
        
        // For moons, orbit is positioned at (0,0,0) relative to parent since parent group handles positioning
        // For planets, orbit is positioned at (0,0,0) in world space
        return this.orbitLine;
    }


    /**
     * Show or hide the orbit visualization
     * @param {boolean} visible - Whether the orbit should be visible
     */
    setOrbitVisibility(visible) {
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
    }
}
