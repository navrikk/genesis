import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

/**
 * Phobos class representing Mars' larger moon
 * Phobos is highly irregular in shape with dimensions of 27 × 22 × 18 km
 * and has a large impact crater called Stickney
 */
export class Phobos extends CelestialBody {
    /**
     * @param {THREE.Vector3} parentPosition - Position of Mars
     */
    constructor(parentPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.PHOBOS.NAME, CONFIG.PHOBOS.RADIUS, CONFIG.PHOBOS.COLOR);
        this.parentPosition = parentPosition;
        this.orbitRadius = CONFIG.PHOBOS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.PHOBOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.PHOBOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        // Create procedural textures for Phobos
        const textureSize = 1024;
        
        // Create base color texture with crater features
        const colorData = new Uint8Array(textureSize * textureSize * 4);
        const bumpData = new Uint8Array(textureSize * textureSize * 4);
        
        // Generate realistic moon surface with craters
        for (let i = 0; i < textureSize; i++) {
            for (let j = 0; j < textureSize; j++) {
                const index = (i * textureSize + j) * 4;
                
                // Base color - light tan/gray
                let r = 192 + Math.random() * 30;
                let g = 176 + Math.random() * 30;
                let b = 144 + Math.random() * 30;
                
                // Add noise for texture variation
                const noise = Math.random() * 20 - 10;
                r = Math.max(0, Math.min(255, r + noise));
                g = Math.max(0, Math.min(255, g + noise));
                b = Math.max(0, Math.min(255, b + noise));
                
                // Add craters
                for (let c = 0; c < 30; c++) {
                    const craterX = Math.random() * textureSize;
                    const craterY = Math.random() * textureSize;
                    const craterRadius = 5 + Math.random() * 50;
                    const distToCrater = Math.sqrt(Math.pow(i - craterX, 2) + Math.pow(j - craterY, 2));
                    
                    if (distToCrater < craterRadius) {
                        // Crater rim is lighter
                        if (distToCrater > craterRadius * 0.8) {
                            r = Math.min(255, r + 30);
                            g = Math.min(255, g + 30);
                            b = Math.min(255, b + 30);
                        } 
                        // Crater center is darker
                        else if (distToCrater < craterRadius * 0.5) {
                            r = Math.max(0, r - 40);
                            g = Math.max(0, g - 40);
                            b = Math.max(0, b - 40);
                        }
                    }
                }
                
                // Set color data
                colorData[index] = r;
                colorData[index + 1] = g;
                colorData[index + 2] = b;
                colorData[index + 3] = 255; // Alpha
                
                // Set bump data (use similar pattern but with different values for height)
                const bumpValue = (r + g + b) / 10; // Simplified height map based on color
                bumpData[index] = bumpValue;
                bumpData[index + 1] = bumpValue;
                bumpData[index + 2] = bumpValue;
                bumpData[index + 3] = 255;
            }
        }
        
        // Create textures from data
        const colorTexture = new THREE.DataTexture(colorData, textureSize, textureSize, THREE.RGBAFormat);
        colorTexture.wrapS = THREE.RepeatWrapping;
        colorTexture.wrapT = THREE.RepeatWrapping;
        colorTexture.needsUpdate = true;
        
        const bumpTexture = new THREE.DataTexture(bumpData, textureSize, textureSize, THREE.RGBAFormat);
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.RepeatWrapping;
        bumpTexture.needsUpdate = true;
        
        // Use base class implementation with our procedural textures
        this.createBaseMesh({
            map: colorTexture,
            bumpMap: bumpTexture,
            bumpScale: 0.1,     // Increased bump scale for more pronounced features
            shininess: 5,       // Low shininess for rocky appearance
            specular: new THREE.Color(0x555555)  // Subtle specular highlights
        });
        
        // Add directional light to enhance surface features
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 5, 5);
        this.objectGroup.add(directionalLight);
        
        // Add point light for general illumination
        const pointLight = new THREE.PointLight(0xffffff, 1.0, 20);
        pointLight.position.set(0, 0, 0);
        this.objectGroup.add(pointLight);
        
        // Add ambient light to ensure visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.objectGroup.add(ambientLight);
    }
    
    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: this.primaryColor,
            opacity: 0.5,
            transparent: true
        });
        
        // Create a circle in 3D space with proper inclination
        const inclination = 1.08 * Math.PI / 180;
        const points = [];
        const segments = 64;
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = Math.cos(theta) * this.orbitRadius;
            const y = Math.sin(theta) * this.orbitRadius * Math.sin(inclination);
            const z = Math.sin(theta) * this.orbitRadius * Math.cos(inclination);
            points.push(new THREE.Vector3(x, y, z));
        }
        
        orbitGeometry.setFromPoints(points);
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbitPath.position.copy(this.parentPosition);
        scene.add(this.orbitPath);
    }
    
    // Label creation has been removed
    
    updateOrbitPath() {
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.parentPosition);
        }
    }
    
    update(deltaTime, animate = true) {
        if (animate) {
            // Update orbit position
            this.orbitAngle += this.orbitSpeed * deltaTime;
            
            // Update rotation
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            
            // Update position
            this.updatePosition();
            
            // Update orbit path position
            this.updateOrbitPath();
            
            // Update sunlight direction
            if (this.sunLight && this.sunPosition) {
                const sunDirection = this.sunPosition.clone().sub(this.objectGroup.position).normalize();
                this.sunLight.position.copy(sunDirection);
                this.sunLight.target = this.mesh;
            }
        }
    }
    
    updatePosition() {
        // Phobos's orbital inclination is 1.08 degrees to Mars's equator
        const inclination = 1.08 * Math.PI / 180;
        
        // Calculate position with inclination
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(inclination);
        const z = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(inclination);
        
        this.setPosition(
            x + this.parentPosition.x, 
            y + this.parentPosition.y, 
            z + this.parentPosition.z
        );
    }
    
    setSunPosition(position) {
        super.setSunPosition(position);
    }
    
    /**
     * Toggle visibility of the orbit path
     * @param {boolean} visible - Whether the orbit path should be visible
     */
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }
    
    /**
     * Toggle visibility of the label (placeholder for backward compatibility)
     * @param {boolean} visible - Whether the label should be visible
     */
    toggleLabel(visible) {
        // Labels have been removed, this is just a placeholder for compatibility
    }
    
    // Update the parent position (when Mars moves)
    updateParentPosition(newPosition) {
        this.parentPosition.copy(newPosition);
        this.updatePosition();
        
        // Update orbit path position
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.parentPosition);
        }
    }
}
