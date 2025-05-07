import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Moon class representing Earth's moon
 */
export class Moon extends CelestialBody {
    /**
     * @param {THREE.Vector3} parentPosition - Position of the parent planet
     */
    constructor(parentPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.MOON.NAME, CONFIG.MOON.RADIUS, CONFIG.MOON.COLOR);
        this.parentPosition = parentPosition;
        this.orbitRadius = CONFIG.MOON.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.MOON.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MOON.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.sunLight = null;
        this.sunPosition = null;
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const moonTexture = textureLoader.load('/textures/moon_8k.jpg');
        const moonNormalMap = textureLoader.load('/textures/moon_normal_8k.jpg');
        
        // Use base class implementation for mesh creation with proper lighting
        this.createBaseMesh({
            map: moonTexture,
            normalMap: moonNormalMap,
            normalScale: new THREE.Vector2(0.04, 0.04),
            shininess: 2,
            specular: new THREE.Color(0x111111)
        });
    }
    
    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: this.primaryColor,
            opacity: 0.5,
            transparent: true
        });
        
        // Create a circle in 3D space with proper inclination
        const inclination = 5.1 * Math.PI / 180;
        const points = [];
        const segments = 128;
        
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
    
    createLabel() {
        // Create a more visible label with larger font size
        this.label = LabelUtils.createLabel(this.name, this.radius, 14, 24, 0.6, 1.2);
        this.objectGroup.add(this.label);
    }
    
    updateOrbitPath() {
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.parentPosition);
        }
    }
    
    update(deltaTime, animate = true) {
        if (animate) {
            // Update orbit position
            this.orbitAngle += this.orbitSpeed * deltaTime;
            
            // Update rotation - the Moon is tidally locked to Earth
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            
            // Update position
            this.updatePosition();
            
            // Update orbit path position
            this.updateOrbitPath();
        }
    }
    
    updatePosition() {
        // Moon's orbital inclination is 5.1 degrees to the ecliptic
        const inclination = 5.1 * Math.PI / 180;
        
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
    
    // Update the parent position (when Earth moves)
    updateParentPosition(newPosition) {
        this.parentPosition.copy(newPosition);
        this.updatePosition();
        
        // Update orbit path position
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.parentPosition);
        }
    }
    
    setSunPosition(position) {
        super.setSunPosition(position);
    }
    
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }
    
    toggleLabel(visible) {
        if (this.label) {
            this.label.visible = visible;
        }
    }
}
