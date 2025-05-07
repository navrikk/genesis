import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

/**
 * Deimos class representing Mars' smaller moon
 * Deimos is highly irregular in shape with dimensions of 15 × 12.2 × 11 km
 * and has a more rounded appearance than Phobos
 */
export class Deimos extends CelestialBody {
    /**
     * @param {THREE.Vector3} parentPosition - Position of Mars
     */
    constructor(parentPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.DEIMOS.NAME, CONFIG.DEIMOS.RADIUS, CONFIG.DEIMOS.COLOR);
        this.parentPosition = parentPosition;
        this.orbitRadius = CONFIG.DEIMOS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.DEIMOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.DEIMOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        // Create procedural textures for Deimos
        const textureSize = 1024;
        
        // Create base color texture with smoother surface (Deimos is smoother than Phobos)
        const colorData = new Uint8Array(textureSize * textureSize * 4);
        const bumpData = new Uint8Array(textureSize * textureSize * 4);
        
        // Generate realistic moon surface
        for (let i = 0; i < textureSize; i++) {
            for (let j = 0; j < textureSize; j++) {
                const index = (i * textureSize + j) * 4;
                
                // Improved base color - more accurate to Deimos' grayish appearance
                let r = 190 + Math.random() * 35;
                let g = 180 + Math.random() * 30;
                let b = 170 + Math.random() * 30;
                
                // Add coherent noise patterns for more realistic surface texture
                // Deimos has a smoother surface than Phobos but still has some texture
                const noiseX = Math.sin(i * 0.08) * Math.cos(j * 0.07) * 15;
                const noiseY = Math.cos(i * 0.12) * Math.sin(j * 0.09) * 10;
                const randomNoise = Math.random() * 10 - 5;
                const noise = noiseX + noiseY + randomNoise;
                
                r = Math.max(0, Math.min(255, r + noise));
                g = Math.max(0, Math.min(255, g + noise));
                b = Math.max(0, Math.min(255, b + noise));
                
                // Add more realistic craters for Deimos
                // Deimos has fewer, more eroded craters than Phobos
                
                // Add a few larger craters
                for (let c = 0; c < 3; c++) {
                    const craterX = Math.random() * textureSize;
                    const craterY = Math.random() * textureSize;
                    const craterRadius = 40 + Math.random() * 60;
                    const distToCrater = Math.sqrt(Math.pow(i - craterX, 2) + Math.pow(j - craterY, 2));
                    
                    if (distToCrater < craterRadius) {
                        // More subtle, eroded crater rim
                        if (distToCrater > craterRadius * 0.85) {
                            const rimIntensity = 1.0 - ((distToCrater - craterRadius * 0.85) / (craterRadius * 0.15));
                            r = Math.min(255, r + 20 * rimIntensity);
                            g = Math.min(255, g + 20 * rimIntensity);
                            b = Math.min(255, b + 20 * rimIntensity);
                        } 
                        // Smoother crater bowl
                        else if (distToCrater < craterRadius * 0.7) {
                            const depth = Math.pow(1.0 - (distToCrater / (craterRadius * 0.7)), 0.5); // Smoother falloff
                            r = Math.max(0, r - 25 * depth);
                            g = Math.max(0, g - 25 * depth);
                            b = Math.max(0, b - 25 * depth);
                        }
                    }
                }
                
                // Add more numerous smaller craters
                for (let c = 0; c < 25; c++) {
                    const craterX = Math.random() * textureSize;
                    const craterY = Math.random() * textureSize;
                    const craterRadius = 3 + Math.random() * 20; // Smaller craters
                    const distToCrater = Math.sqrt(Math.pow(i - craterX, 2) + Math.pow(j - craterY, 2));
                    
                    if (distToCrater < craterRadius) {
                        // Subtle rim for small craters
                        if (distToCrater > craterRadius * 0.8) {
                            const rimIntensity = 1.0 - ((distToCrater - craterRadius * 0.8) / (craterRadius * 0.2));
                            r = Math.min(255, r + 15 * rimIntensity);
                            g = Math.min(255, g + 15 * rimIntensity);
                            b = Math.min(255, b + 15 * rimIntensity);
                        } 
                        // Shallow crater center
                        else if (distToCrater < craterRadius * 0.6) {
                            const depth = Math.pow(1.0 - (distToCrater / (craterRadius * 0.6)), 0.5);
                            r = Math.max(0, r - 20 * depth);
                            g = Math.max(0, g - 20 * depth);
                            b = Math.max(0, b - 20 * depth);
                        }
                    }
                }
                
                // Set color data
                colorData[index] = r;
                colorData[index + 1] = g;
                colorData[index + 2] = b;
                colorData[index + 3] = 255; // Alpha
                
                // Enhanced bump mapping for Deimos - smoother than Phobos but with subtle details
                // Calculate base bump value with weighted color channels
                const bumpValue = (r * 0.4 + g * 0.4 + b * 0.2) / 10;
                
                // Add subtle detail to the bump map
                // Use lower frequency noise for a smoother appearance
                const bumpDetail = Math.sin(i * 0.1) * Math.cos(j * 0.1) * 5 + 
                                  Math.sin(i * 0.05 + j * 0.03) * 8;
                
                // Combine with less intensity than Phobos for a smoother appearance
                const finalBumpValue = Math.max(0, Math.min(255, bumpValue + bumpDetail * 0.7));
                
                bumpData[index] = finalBumpValue;
                bumpData[index + 1] = finalBumpValue;
                bumpData[index + 2] = finalBumpValue;
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
            bumpScale: 0.08,    // Slightly less pronounced than Phobos
            shininess: 7,       // Slightly more reflective than Phobos
            specular: new THREE.Color(0x666666)  // Subtle specular highlights
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
        const inclination = 1.79 * Math.PI / 180;
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
        }
    }
    
    updatePosition() {
        // Deimos's orbital inclination is 1.79 degrees to Mars's equator
        const inclination = 1.79 * Math.PI / 180;
        
        // Calculate position with inclination
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(inclination);
        const z = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(inclination);
        
        this.objectGroup.position.set(
            this.parentPosition.x + x,
            this.parentPosition.y + y,
            this.parentPosition.z + z
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
