import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';


/**
 * Venus class representing the planet Venus
 */
export class Venus extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 3.4; // Venus's orbital inclination
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.VENUS.NAME,
            CONFIG.VENUS.RADIUS,
            CONFIG.VENUS.COLOR,
            CONFIG.VENUS.ORBIT_RADIUS, // orbitalRadius
            inclinationRadians,        // orbitalInclination
            false,                     // isEmissive
            null,                      // customGeometry
            2.2                        // ambientLightIntensity
        );
        this.orbitSpeed = CONFIG.VENUS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.VENUS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.cloudsMesh = null;
        this.createMesh();
        this.createOrbitPath(scene);
        this.updatePosition();
    }
    
    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const venusTexture = textureLoader.load('/textures/venus_surface_8k.jpg');
        const venusCloudsTexture = textureLoader.load('/textures/venus_atmosphere_8k.jpg');
        
        // Use base class implementation for mesh creation with proper lighting
        super.createBaseMesh({
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

        // Set fixed cloud opacity
        if (this.cloudsMesh && this.cloudsMesh.material) {
            this.cloudsMesh.material.opacity = 0.7;
        }
    }

    }
