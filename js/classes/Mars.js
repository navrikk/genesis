import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';


/**
 * Mars class representing the planet Mars
 */
export class Mars extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 1.85; // Mars's orbital inclination
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.MARS.NAME,
            CONFIG.MARS.RADIUS,
            CONFIG.MARS.COLOR,
            CONFIG.MARS.ORBIT_RADIUS, // orbitalRadius
            inclinationRadians,       // orbitalInclination
            false,                    // isEmissive
            null,                     // customGeometry
            2.2                       // ambientLightIntensity
        );
        this.orbitSpeed = CONFIG.MARS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MARS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.createMesh();
        this.createOrbitPath(scene);
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const marsTexture = textureLoader.load('/textures/mars_8k.jpg');
        const marsNormalMap = textureLoader.load('/textures/mars_normal_8k.jpg');
        
        // Use base class implementation for mesh creation with proper lighting
        super.createBaseMesh({
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
    
    // Get the object group for positioning
    getObject() {
        return this.objectGroup;
    }
    }
