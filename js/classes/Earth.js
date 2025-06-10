import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';

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
        this.orbitAngle = calculateOrbitalAngle('EARTH');
        this.cloudsMesh = null;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const earthDayTexture = textureLoader.load('/textures/earth/earth_daymap_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Earth: Error loading texture:`, err); }
        );
        
        const earthCloudsTexture = textureLoader.load('/textures/earth/earth_clouds_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
            },
            undefined,
            (err) => { console.error(`Earth: Error loading clouds texture:`, err); }
        );


        super.createBaseMesh({
            map: earthDayTexture,
            bumpMap: earthDayTexture,
            bumpScale: 0.001,
            shininess: 0.3,
            specular: new THREE.Color(0x111111),
            baseColor: new THREE.Color(0xffffff)
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

    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the planet
     */
    update(deltaTime, animate = true) {
        if (animate && this.orbitSpeed > 0) {
            this.orbitAngle += this.orbitSpeed * deltaTime;
            if (this.orbitAngle > Math.PI * 2) {
                this.orbitAngle -= Math.PI * 2;
            }
        }

        if (animate && this.rotationSpeed > 0 && this.mesh) {
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        }

        this.updatePosition();

        if (this.cloudsMesh && animate) {
            this.cloudsMesh.rotation.y += this.rotationSpeed * deltaTime * 1.2;
        }
    }
}
