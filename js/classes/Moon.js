import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';


/**
 * Moon class representing Earth's moon
 */
export class Moon extends CelestialBody {
    /**
     * @param {CelestialBody} parentBody - The parent celestial body (e.g., Earth)
     */
    constructor(parentBody) {
        const inclinationDegrees = 5.1;
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.MOON.NAME,
            CONFIG.MOON.RADIUS,
            CONFIG.MOON.COLOR,
            CONFIG.MOON.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            0.5
        );
        this.parentBody = parentBody;
        this.orbitSpeed = CONFIG.MOON.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MOON.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.createMesh();
        this.updatePosition();
    }
    
    createMesh() {

        const textureLoader = new THREE.TextureLoader();
        const moonTexture = textureLoader.load('/textures/moon_8k.jpg');
        const moonNormalMap = textureLoader.load('/textures/moon_normal_8k.jpg');
        

        this.createBaseMesh({
            map: moonTexture,
            normalMap: moonNormalMap,
            normalScale: new THREE.Vector2(0.04, 0.04),
            emissive: new THREE.Color(0x111111),
            emissiveIntensity: 0.1
        });
    }
    
    }
