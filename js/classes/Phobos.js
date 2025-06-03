import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import LightingUtils from '../utils/LightingUtils.js';
import phobosTexturePath from '../../assets/textures/phobos_nasa_texture.jpg';



/**
 * Phobos class representing Mars' larger moon
 * Phobos is highly irregular in shape with dimensions of 27 × 22 × 18 km
 * and has a large impact crater called Stickney
 */
export class Phobos extends CelestialBody {
    /**
     * @param {CelestialBody} parentBody - The parent celestial body (Mars)
     */
    constructor(parentBody) {
        const inclinationDegrees = 1.09;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.PHOBOS.NAME,
            CONFIG.PHOBOS.RADIUS,
            CONFIG.PHOBOS.COLOR,
            CONFIG.PHOBOS.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.15
        );
        this.parentBody = parentBody;
        this.orbitSpeed = CONFIG.PHOBOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.PHOBOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {

        const radiusX = (27 / 2) / CONFIG.SCALE_FACTOR;
        const radiusY = (22 / 2) / CONFIG.SCALE_FACTOR;
        const radiusZ = (18 / 2) / CONFIG.SCALE_FACTOR;

        const geometry = new THREE.SphereGeometry(1, 32, 32); 
        geometry.scale(radiusX, radiusY, radiusZ);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            phobosTexturePath,
            (phobosTexture) => {


                const materialOptions = {
                    map: phobosTexture,
                    baseColor: new THREE.Color(0x333333)
                };
                super.createBaseMesh(materialOptions, geometry);

            },
            undefined,
            (error) => {
                console.error(`[${this.name}] Error loading texture:`, error);

                console.error(`[${this.name}] Texture load error. Falling back to basic material.`);
                const fallbackMaterialOptions = {
                    baseColor: new THREE.Color(this.primaryColor)
                };
                super.createBaseMesh(fallbackMaterialOptions, geometry);
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
