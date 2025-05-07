import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

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
        this.label = null;
        this.sunPosition = new THREE.Vector3(0, 0, 0);
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const deimosTexture = textureLoader.load('assets/textures/deimos_8k.jpg');
        // Fallback to basic material if texture loading fails
        deimosTexture.onError = () => {
            console.warn('Failed to load Deimos texture, using fallback');
            this.mesh.material = new THREE.MeshStandardMaterial({
                color: CONFIG.DEIMOS.COLOR,
                roughness: 0.5,
                metalness: 0.2,
                emissive: new THREE.Color(0x555555),
                emissiveIntensity: 0.4
            });
        };
        
        // Create Deimos geometry - irregular shape with dimensions 15 × 12.2 × 11 km
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Apply scientifically accurate vertex displacement for Deimos' shape
        const positionAttribute = geometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        
        // Define Deimos' true dimensions ratio (15 × 12.2 × 11 km)
        const scaleX = 15/12.2;
        const scaleY = 1.0; // Using 12.2 as the base
        const scaleZ = 11/12.2;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Apply true dimensional scaling
            vertex.x *= scaleX;
            vertex.y *= scaleY;
            vertex.z *= scaleZ;
            
            // Deimos has a more rounded appearance than Phobos, but still has craters
            // Add multiple frequencies of noise for realistic surface features
            const noise1 = 0.06 * Math.sin(vertex.x * 12 + vertex.y * 10 + vertex.z * 14);
            const noise2 = 0.04 * Math.sin(vertex.x * 25 + vertex.y * 20 + vertex.z * 22);
            const noise3 = 0.02 * Math.sin(vertex.x * 40 + vertex.y * 35 + vertex.z * 38);
            
            // Apply the noise
            vertex.addScaledVector(vertex.clone().normalize(), noise1 + noise2 + noise3);
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Update normals after displacement
        geometry.computeVertexNormals();
        
        // Use a simpler material for better visibility with increased brightness
        const material = new THREE.MeshStandardMaterial({
            map: deimosTexture,
            color: 0xDDDDDD, // Brighter base color
            roughness: 0.5, // Reduced roughness for more shine
            metalness: 0.2, // Increased metalness for more shine
            emissive: new THREE.Color(0x555555), // Increased emissive
            emissiveIntensity: 0.4 // Increased intensity
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
    }
    
    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: 0x888888,
            transparent: true,
            opacity: 0.3
        });
        
        // Create a circle of points for the orbit
        const points = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * this.orbitRadius;
            const z = Math.sin(angle) * this.orbitRadius;
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        orbitGeometry.setFromPoints(points);
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbitPath.position.copy(this.parentPosition);
        this.orbitPath.userData.isOrbit = true; // Add property for orbit visibility toggling
        
        if (scene) {
            scene.add(this.orbitPath);
        }
    }
    
    createLabel() {
        this.label = LabelUtils.createLabel(this.name, this.radius, 10, 16, 0.2, 0.7);
        this.objectGroup.add(this.label);
    }
    
    setSunPosition(position) {
        this.sunPosition.copy(position);
        
        // No need to update shader uniforms with standard material
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
            if (this.orbitPath) {
                this.orbitPath.position.copy(this.parentPosition);
            }
        }
    }
    
    updatePosition() {
        // Position on the orbit around parent
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        // Position relative to parent
        this.objectGroup.position.set(
            this.parentPosition.x + x,
            this.parentPosition.y,
            this.parentPosition.z + z
        );
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
     * Toggle visibility of the label
     * @param {boolean} visible - Whether the label should be visible
     */
    toggleLabel(visible) {
        if (this.label) {
            this.label.visible = visible;
        }
    }
}
