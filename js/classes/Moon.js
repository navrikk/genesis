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
        // Use local high-resolution Moon texture with enhanced properties
        const moonTexture = textureLoader.load('/textures/moon_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Moon: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: moonTexture,
            bumpMap: moonTexture,
            bumpScale: 0.002,
            emissive: new THREE.Color(0x111111),
            emissiveIntensity: 0.1
        });
    }
    
    }
