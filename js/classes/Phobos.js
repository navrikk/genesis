import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

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
        this.label = null;
        this.sunPosition = new THREE.Vector3(0, 0, 0);
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const phobosTexture = textureLoader.load('assets/textures/phobos_8k.jpg');
        // Fallback to basic material if texture loading fails
        phobosTexture.onError = () => {
            console.warn('Failed to load Phobos texture, using fallback');
            this.mesh.material = new THREE.MeshStandardMaterial({
                color: CONFIG.PHOBOS.COLOR,
                roughness: 0.6,
                metalness: 0.2,
                emissive: new THREE.Color(0x555555),
                emissiveIntensity: 0.4
            });
        };
        
        // Create Phobos geometry - highly irregular potato shape with dimensions 27 × 22 × 18 km
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Apply scientifically accurate vertex displacement for Phobos' shape
        const positionAttribute = geometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        
        // Define Phobos' true dimensions ratio (27 × 22 × 18 km)
        const scaleX = 27/22;
        const scaleY = 1.0; // Using 22 as the base
        const scaleZ = 18/22;
        
        // Define Stickney crater parameters (9km wide crater on one end)
        const stickneyCenter = new THREE.Vector3(this.radius * 0.8, 0, 0).normalize();
        const stickneyRadius = this.radius * 0.4; // Stickney is about 9km wide (approx 40% of Phobos' diameter)
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Apply true dimensional scaling
            vertex.x *= scaleX;
            vertex.y *= scaleY;
            vertex.z *= scaleZ;
            
            // Create the Stickney crater
            const distToStickneyCenter = vertex.clone().normalize().distanceTo(stickneyCenter);
            if (distToStickneyCenter < 0.4) {
                // Create crater depression based on distance to center
                const craterDepth = 0.3 * (1.0 - (distToStickneyCenter / 0.4));
                vertex.multiplyScalar(1.0 - craterDepth);
            }
            
            // Add smaller craters and surface irregularities
            const noise1 = 0.08 * Math.sin(vertex.x * 15 + vertex.y * 13 + vertex.z * 17);
            const noise2 = 0.05 * Math.sin(vertex.x * 30 + vertex.y * 25 + vertex.z * 35);
            
            // Apply the noise
            vertex.addScaledVector(vertex.clone().normalize(), noise1 + noise2);
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Update normals after displacement
        geometry.computeVertexNormals();
        
        // Use a simpler material for better visibility with increased brightness
        const material = new THREE.MeshStandardMaterial({
            map: phobosTexture,
            color: 0xDDDDDD, // Brighter base color
            roughness: 0.5, // Reduced roughness for more shine
            metalness: 0.25, // Increased metalness for more shine
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
        this.label = LabelUtils.createLabel(this.name, this.radius, 10, 18, 0.2, 0.8);
        this.objectGroup.add(this.label);
    }
    
    setSunPosition(position) {
        this.sunPosition.copy(position);
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
