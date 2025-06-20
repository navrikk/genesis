import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';


/**
 * Deimos class representing Mars' smaller moon
 * Deimos is highly irregular in shape with dimensions of 15 × 12.2 × 11 km
 * and has a smoother surface than Phobos
 */
export class Deimos extends CelestialBody {
    /**
     * @param {CelestialBody} parentBody - The parent celestial body (Mars)
     */
    constructor(parentBody) {
        const inclinationDegrees = 0.93;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.DEIMOS.NAME,
            CONFIG.DEIMOS.RADIUS,
            CONFIG.DEIMOS.COLOR,
            CONFIG.DEIMOS.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.02
        );
        this.parentBody = parentBody;
        this.orbitSpeed = CONFIG.DEIMOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.DEIMOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {

        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            '/textures/mars/deimos/deimos_nasa_texture.jpg',
            (deimosTexture) => {
                // Enhanced texture properties for better visual quality
                deimosTexture.anisotropy = 16;
                deimosTexture.colorSpace = THREE.SRGBColorSpace;
                
                const materialOptions = {
                    map: deimosTexture,
                    bumpMap: deimosTexture,
                    bumpScale: 0.002,
                    baseColor: new THREE.Color(0xffffff),
                    shininess: 2,
                    specular: new THREE.Color(0x444444)
                };
                super.createBaseMesh(materialOptions, geometry);
            }
        );
    }


    /**
     * Update the position based on orbit around Mars
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the moon
     */
    update(deltaTime = 0, animate = true) {
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
    }
}
