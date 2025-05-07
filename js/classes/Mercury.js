import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

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
        this.moon = null;
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const mercuryTexture = textureLoader.load('assets/textures/mercury_8k.jpg');
        
        // Use base class implementation for mesh creation with proper lighting
        this.createBaseMesh({
            map: mercuryTexture,
            bumpMap: mercuryTexture,
            bumpScale: 0.02,
            shininess: 5,
            specular: new THREE.Color(0x222222)
        });
    }

    setSunPosition(position) {
        super.setSunPosition(position);
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


}
