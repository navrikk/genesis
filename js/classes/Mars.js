import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';
import { ColorUtils } from '../utils/ColorUtils.js';

/**
 * Mars class representing the planet Mars
 */
export class Mars extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.MARS.NAME, CONFIG.MARS.RADIUS, CONFIG.MARS.COLOR, false, null, 2.2); // isEmissive, customGeometry, ambientLightIntensity
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.MARS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.MARS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MARS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.moons = []; // Array to store Mars' moons
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const marsTexture = textureLoader.load('/textures/mars_8k.jpg');
        const marsNormalMap = textureLoader.load('/textures/mars_normal_8k.jpg');
        
        // Use base class implementation for mesh creation with proper lighting
        this.createBaseMesh({
            map: marsTexture,
            normalMap: marsNormalMap,
            bumpMap: marsNormalMap,
            bumpScale: 0.02,
            shininess: 5,
            specular: new THREE.Color(0x222222)
        });
        
        // Add subtle atmospheric effect - Mars has a very thin atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(this.radius * 1.015, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xff9977), // Adjusted to more accurate dusty reddish-orange
            transparent: true,
            opacity: 0.05, // Much more subtle than before
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.atmosphereMesh.name = this.name + "Atmosphere";
        this.objectGroup.add(this.atmosphereMesh);
    }
    
    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const randomColor = ColorUtils.getRandomColor();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: randomColor,
            transparent: true,
            opacity: 0.5
        });
        
        // Create a circle of points for the orbit
        const points = [];
        const segments = 512;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * this.orbitRadius;
            const z = Math.sin(angle) * this.orbitRadius;
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        orbitGeometry.setFromPoints(points);
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbitPath.position.copy(this.sunPosition); // Center orbit path on Sun
        
        if (scene) {
            scene.add(this.orbitPath);
        }
    }
    
    createLabel() {
        // Labels have been removed completely
        // This method is kept for compatibility
    }
    
    update(deltaTime, animate = true) {
        // Completely static - no rotation or orbit movement
    }
    
    updatePosition() {
        // Calculate position on the orbit
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        // Update position
        this.objectGroup.position.set(x, 0, z);
    }
    
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }
    
    toggleLabel(visible) {
        // Labels have been completely removed
        // This method is kept for compatibility
    }
    
    // Add a moon to Mars
    addMoon(moon) {
        this.moons.push(moon);
    }
    
    // Get the object group for positioning
    getObject() {
        return this.objectGroup;
    }
    
    setSunPosition(position) {
        super.setSunPosition(position);
        
        // Update moons' sun position for orbit calculations
        this.moons.forEach(moon => moon.setSunPosition(position));
    }
}
