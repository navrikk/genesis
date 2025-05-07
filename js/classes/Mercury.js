import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Mercury class representing the planet Mercury
 */
export class Mercury extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super('Mercury', CONFIG.MERCURY.RADIUS, CONFIG.MERCURY.COLOR);
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.MERCURY.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.MERCURY.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MERCURY.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.moon = null;
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }

    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const mercuryTexture = textureLoader.load('assets/textures/mercury_8k.jpg');
        
        // Create Mercury geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create material with lighting
        const material = new THREE.MeshPhongMaterial({
            map: mercuryTexture,
            bumpMap: mercuryTexture,
            bumpScale: 0.02,
            shininess: 5,
            specular: new THREE.Color(0x222222)
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
        
        // Add directional light to simulate sunlight
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.sunLight.position.copy(this.sunPosition.clone().normalize());
        this.objectGroup.add(this.sunLight);
    }

    setSunPosition(position) {
        this.sunPosition = position.clone();
        
        // Update the directional light position to match sun direction
        if (this.sunLight) {
            const sunDirection = this.sunPosition.clone().sub(this.objectGroup.position).normalize();
            this.sunLight.position.copy(sunDirection);
        }
    }

    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: this.primaryColor,
            opacity: 0.5,
            transparent: true
        });
        
        // Create a circle in 3D space with proper inclination
        const inclination = 7.0 * Math.PI / 180;
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
        this.label = LabelUtils.createLabel(this.name, this.radius, 14, 24, 0.6, 1.2);
        this.objectGroup.add(this.label);
    }

    /**
     * Updates Mercury's position based on its orbit
     */
    updatePosition() {
        // Mercury's orbital inclination is 7.0 degrees to the ecliptic
        const inclination = 7.0 * Math.PI / 180;
        
        // Calculate position with inclination
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(inclination);
        const z = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(inclination);
        
        this.setPosition(x + this.sunPosition.x, y, z + this.sunPosition.z);
    }

    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the planet
     */
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
                this.orbitPath.position.copy(this.sunPosition);
            }
            
            // Update sunlight direction
            if (this.sunLight) {
                const sunDirection = this.sunPosition.clone().sub(this.objectGroup.position).normalize();
                this.sunLight.position.copy(sunDirection);
                this.sunLight.target = this.mesh;
            }
        }
    }

    /**
     * Toggle the visibility of the orbit path
     * @param {boolean} visible - Whether the orbit path should be visible
     */
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }

    /**
     * Toggle the visibility of the label
     * @param {boolean} visible - Whether the label should be visible
     */
    toggleLabel(visible) {
        if (this.label) {
            this.label.visible = visible;
        }
    }
}
