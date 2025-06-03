import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

/**
 * Mars class representing the planet Mars
 */
export class Mars extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 1.85;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.MARS.NAME,
            CONFIG.MARS.RADIUS,
            CONFIG.MARS.COLOR,
            CONFIG.MARS.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            2.2
        );
        this.orbitSpeed = CONFIG.MARS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MARS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const marsTexture = textureLoader.load('/textures/mars_8k.jpg');

        super.createBaseMesh({
            map: marsTexture,
            shininess: 5,
            specular: new THREE.Color(0x222222)
        });
        

        const atmosphereGeometry = new THREE.SphereGeometry(this.radius * 1.015, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xff9977),
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.atmosphereMesh.name = this.name + "Atmosphere";
        this.objectGroup.add(this.atmosphereMesh);
    }
    
    }
