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
            CONFIG.EARTH.ORBIT_RADIUS,
            0,
            false,
            null,
            2.2
        );
        this.orbitSpeed = CONFIG.EARTH.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.EARTH.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.cloudsMesh = null;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const earthDayPath = '/textures/earth_daymap_8k.jpg';
        const earthCloudsPath = '/textures/earth_clouds_8k.jpg';

        const earthDayTexture = textureLoader.load(earthDayPath,
            undefined,
            (err) => { console.error(`Earth: Error loading ${earthDayPath}:`, err); }
        );
        const earthCloudsTexture = textureLoader.load(earthCloudsPath,
            undefined,
            (err) => { console.error(`Earth: Error loading ${earthCloudsPath}:`, err); }
        );


        super.createBaseMesh({
            map: earthDayTexture
        });

        const cloudsGeometry = new THREE.SphereGeometry(this.radius * 1.01, 64, 64);
        const cloudsMaterial = new THREE.MeshBasicMaterial({
            map: earthCloudsTexture,
            transparent: true,
            opacity: 0.2,
            blending: THREE.NormalBlending,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -1
        });
        
        this.cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        this.cloudsMesh.castShadow = false;
        this.cloudsMesh.receiveShadow = false;
        this.cloudsMesh.name = this.name + "Clouds";
        this.objectGroup.add(this.cloudsMesh);

        const axialTilt = 23.5 * Math.PI / 180;
        if (this.mesh) {
            this.mesh.rotation.x = axialTilt;
        }
        if (this.cloudsMesh) {
            this.cloudsMesh.rotation.x = axialTilt;
        }
    }

}
