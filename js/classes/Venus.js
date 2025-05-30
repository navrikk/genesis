import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';
import { ColorUtils } from '../utils/ColorUtils.js';

/**
 * Venus class representing the planet Venus
 */
export class Venus extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.VENUS.NAME, CONFIG.VENUS.RADIUS, CONFIG.VENUS.COLOR, false, null, 2.2); // isEmissive, customGeometry, ambientLightIntensity
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.VENUS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.VENUS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.VENUS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null; // Add moon support
        this.moon = null; 
        this.cloudsMesh = null;
        this.sunLight = null;
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    setSunPosition(position) {
        super.setSunPosition(position);
        
        // Set fixed cloud opacity
        if (this.cloudsMesh && this.cloudsMesh.material) {
            this.cloudsMesh.material.opacity = 0.7;
        }
    }

    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const venusTexture = textureLoader.load('/textures/venus_surface_8k.jpg');
        const venusCloudsTexture = textureLoader.load('/textures/venus_atmosphere_8k.jpg');
        
        // Use base class implementation for mesh creation with proper lighting
        this.createBaseMesh({
            map: venusTexture,
            bumpMap: venusTexture,
            bumpScale: 0.005,
            shininess: 10,
            specular: new THREE.Color(0x333333)
        });
        
        // Add cloud layer as a slightly larger sphere
        const cloudsGeometry = new THREE.SphereGeometry(this.radius * 1.01, 64, 64);
        const cloudsMaterial = new THREE.MeshPhongMaterial({
            map: venusCloudsTexture,
            transparent: true,
            opacity: 0.7,
            shininess: 5,
            specular: new THREE.Color(0x222222),
            emissive: new THREE.Color(0x000000),
            emissiveIntensity: 0,
            blending: THREE.AdditiveBlending
        });
        
        this.cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        this.cloudsMesh.castShadow = true;
        this.cloudsMesh.receiveShadow = true;
        this.cloudsMesh.name = this.name + "Clouds";
        this.objectGroup.add(this.cloudsMesh);
    }

    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const randomColor = ColorUtils.getRandomColor();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: randomColor,
            opacity: 0.5,
            transparent: true
        });
        
        // Create a circle in 3D space with proper inclination
        const inclination = 3.4 * Math.PI / 180;
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
        this.orbitPath.position.copy(this.sunPosition);
        scene.add(this.orbitPath);
    }

    createLabel() {
        // Labels have been removed completely
        // This method is kept for compatibility
    }
    
    updateOrbitPath() {
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.sunPosition);
        }
    }

    update(deltaTime, animate = true) {
        // Completely static - no rotation or orbit movement
    }
    
    updatePosition() {
        // Venus's orbital inclination is 3.4 degrees to the ecliptic
        const inclination = 3.4 * Math.PI / 180;
        
        // Calculate position with inclination
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(inclination);
        const z = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(inclination);
        
        this.setPosition(x + this.sunPosition.x, y, z + this.sunPosition.z);
    }
    
    setPosition(x, y, z) {
        this.objectGroup.position.set(x, y, z);
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
}
