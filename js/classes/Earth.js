import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';


/**
 * Earth class representing the planet Earth
 */
export class Earth extends CelestialBody {
    constructor(scene) {
        super(
            CONFIG.EARTH.NAME,
            CONFIG.EARTH.RADIUS,
            CONFIG.EARTH.COLOR,
            CONFIG.EARTH.ORBIT_RADIUS, // orbitalRadius
            0,                          // orbitalInclination (default to 0)
            false,                      // isEmissive
            null,                       // customGeometry
            2.2                         // ambientLightIntensity
        );
        this.orbitSpeed = CONFIG.EARTH.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.EARTH.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.cloudsMesh = null;
        this.createMesh();
        this.updatePosition();
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
        super.createBaseMesh({
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
            blending: THREE.NormalBlending,
            polygonOffset: true,
            polygonOffsetFactor: -2, // Increased from -1
            polygonOffsetUnits: -1   // Kept -1, or could also be -2
        });
        
        this.cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        this.cloudsMesh.castShadow = false;
        this.cloudsMesh.receiveShadow = false;
        this.cloudsMesh.name = this.name + "Clouds";
        this.objectGroup.add(this.cloudsMesh);

        // Apply axial tilt
        const axialTilt = 23.5 * Math.PI / 180;
        if (this.mesh) {
            this.mesh.rotation.x = axialTilt;
        }
        if (this.cloudsMesh) {
            this.cloudsMesh.rotation.x = axialTilt;
        }
    }

    update(deltaTime, animate = true) {
        // Completely static - no rotation or orbit movement
    }
}
