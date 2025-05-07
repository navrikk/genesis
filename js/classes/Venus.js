import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Venus class representing the planet Venus
 */
export class Venus extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super('Venus', CONFIG.VENUS.RADIUS, CONFIG.VENUS.COLOR);
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
        this.sunPosition = position.clone();
        
        // Update the directional light position to match sun direction
        if (this.sunLight) {
            const sunDirection = this.sunPosition.clone().sub(this.objectGroup.position).normalize();
            this.sunLight.position.copy(sunDirection);
        }
    }

    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const venusTexture = textureLoader.load('assets/textures/venus_surface_8k.jpg');
        const venusCloudsTexture = textureLoader.load('assets/textures/venus_atmosphere_8k.jpg');
        
        // Create Venus geometry with high detail
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create material with lighting
        const material = new THREE.MeshPhongMaterial({
            map: venusTexture,
            bumpMap: venusTexture,
            bumpScale: 0.005, // Subtle bump mapping
            shininess: 10,
            specular: new THREE.Color(0x333333)
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
        
        // Add cloud layer as a slightly larger sphere
        const cloudsGeometry = new THREE.SphereGeometry(this.radius * 1.01, 64, 64);
        const cloudsMaterial = new THREE.MeshPhongMaterial({
            map: venusCloudsTexture,
            transparent: true,
            opacity: 0.7,
            shininess: 5,
            specular: new THREE.Color(0x222222),
            blending: THREE.AdditiveBlending
        });
        
        this.cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        this.cloudsMesh.name = this.name + "Clouds";
        this.objectGroup.add(this.cloudsMesh);
        
        // Add directional light to simulate sunlight
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.sunLight.position.copy(this.sunPosition.clone().normalize());
        this.objectGroup.add(this.sunLight);
    }

    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: this.primaryColor,
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
        // Create a more visible label with larger font size
        this.label = LabelUtils.createLabel(this.name, this.radius, 14, 26, 0.6, 1.2);
        this.objectGroup.add(this.label);
    }
    
    updateOrbitPath() {
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.sunPosition);
        }
    }

    update(deltaTime, animate = true) {
        if (animate) {
            // Update rotation
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            
            // Rotate clouds slightly faster for dynamic effect
            if (this.cloudsMesh) {
                this.cloudsMesh.rotation.y += this.rotationSpeed * 1.1 * deltaTime;
            }
            
            // Update position
            this.updatePosition();
            
            // Update orbit path position
            this.updateOrbitPath();
            
            // Update sunlight direction
            if (this.sunLight) {
                const sunDirection = this.sunPosition.clone().sub(this.objectGroup.position).normalize();
                this.sunLight.position.copy(sunDirection);
                this.sunLight.target = this.mesh;
            }
        }
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
        if (this.label) {
            this.label.visible = visible;
        }
    }
}
