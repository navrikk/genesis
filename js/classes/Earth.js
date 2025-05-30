import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Earth class representing the planet Earth
 */
export class Earth extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.EARTH.NAME, CONFIG.EARTH.RADIUS, CONFIG.EARTH.COLOR, false, null, 2.2); // isEmissive, customGeometry, ambientLightIntensity
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.EARTH.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.EARTH.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.EARTH.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.moon = null; // Add moon property
        this.cloudsMesh = null;
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    setSunPosition(position) {
        super.setSunPosition(position);
        
        // Update moon's sun position
        if (this.moon) {
            this.moon.setSunPosition(position);
        }
    }

    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const earthDayPath = '/textures/earth_daymap_8k.jpg';
        const earthCloudsPath = '/textures/earth_clouds_8k.jpg';
        const earthNormalPath = '/textures/earth_normal_8k.jpg';
        // const earthSpecularPath = '/textures/earth_specular_8k.jpg'; // Not used

        const earthDayTexture = textureLoader.load(earthDayPath,
            undefined, // onProgress callback currently not used
            (err) => { console.error(`Earth: Error loading ${earthDayPath}:`, err); }
        );
        const earthCloudsTexture = textureLoader.load(earthCloudsPath,
            undefined,
            (err) => { console.error(`Earth: Error loading ${earthCloudsPath}:`, err); }
        );
        const earthNormalMap = textureLoader.load(earthNormalPath,
            undefined,
            (err) => { console.error(`Earth: Error loading ${earthNormalPath}:`, err); }
        );
        // const earthSpecularMap = textureLoader.load(earthSpecularPath, // Not used
        //     () => { console.log(`Earth: ${earthSpecularPath} loaded successfully.`); },
        //     undefined,
        //     (err) => { console.error(`Earth: Error loading ${earthSpecularPath}:`, err); }
        // );
        
        // Use base class implementation for mesh creation with maximum texture visibility
        this.createBaseMesh({
            map: earthDayTexture,
            normalMap: earthNormalMap,
            normalScale: new THREE.Vector2(0.05, 0.05)
        });
        
        // Add very subtle cloud layer for better Earth surface visibility
        const cloudsGeometry = new THREE.SphereGeometry(this.radius * 1.01, 64, 64);
        const cloudsMaterial = new THREE.MeshBasicMaterial({
            map: earthCloudsTexture,
            transparent: true,
            opacity: 0.2, // Very low opacity for maximum surface visibility
            blending: THREE.NormalBlending
        });
        
        this.cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        this.cloudsMesh.castShadow = false;
        this.cloudsMesh.receiveShadow = false;
        this.cloudsMesh.name = this.name + "Clouds";
        this.objectGroup.add(this.cloudsMesh);
    }

    createLabel() {
        // Labels have been removed completely
        // This method is kept for compatibility
    }

    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: this.primaryColor,
            opacity: 0.5,
            transparent: true
        });
        
        // Earth's orbital inclination is 0.0 degrees to the ecliptic (by definition)
        const points = [];
        const segments = 128;
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = Math.cos(theta) * this.orbitRadius;
            const z = Math.sin(theta) * this.orbitRadius;
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        orbitGeometry.setFromPoints(points);
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbitPath.position.copy(this.sunPosition);
        scene.add(this.orbitPath);
    }

    updateOrbitPath() {
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.sunPosition);
        }
    }

    updatePosition() {
        // Earth's orbital inclination is 0.0 degrees to the ecliptic (by definition)
        // Earth's axial tilt is 23.5 degrees
        const axialTilt = 23.5 * Math.PI / 180;
        
        // Calculate position
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        this.setPosition(x + this.sunPosition.x, 0, z + this.sunPosition.z);
        
        // Apply axial tilt
        this.mesh.rotation.x = axialTilt;
        if (this.cloudsMesh) {
            this.cloudsMesh.rotation.x = axialTilt;
        }
    }
    
    update(deltaTime, animate = true) {
        if (animate) {
            // Update orbit position
            this.orbitAngle += this.orbitSpeed * deltaTime;
            
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
            
            // Update moon position if it exists
            if (this.moon) {
                this.moon.updateParentPosition(this.objectGroup.position);
                this.moon.setSunPosition(this.sunPosition);
                this.moon.update(deltaTime, animate);
            }
        }
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
