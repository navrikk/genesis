import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import CONFIG from '../config.js';
import { calculateOrbitalAngle } from '../utils/AstronomicalCalculations.js';

/**
 * Saturn - The Ringed Planet
 * Sixth planet from the Sun, famous for its prominent ring system
 */
export class Saturn extends CelestialBody {
    constructor(scene) {
        const inclinationDegrees = 2.48; // Saturn's orbital inclination
        const inclinationRadians = inclinationDegrees * Math.PI / 180;
        super(
            CONFIG.SATURN.NAME,
            CONFIG.SATURN.RADIUS,
            CONFIG.SATURN.COLOR,
            CONFIG.SATURN.ORBIT_RADIUS,
            inclinationRadians,
            false,
            null,
            1.0
        );
        this.config = CONFIG.SATURN;
        this.orbitSpeed = CONFIG.SATURN.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.SATURN.ROTATION_SPEED;
        this.orbitAngle = calculateOrbitalAngle('SATURN');
        
        // Saturn's physical properties
        this.mass = 5.683e26; // kg
        this.gravity = 10.44; // m/s²
        this.temperature = -178; // °C average
        this.rotationPeriod = 0.444; // Earth days (10.7 hours)
        this.orbitalPeriod = CONFIG.SATURN.ORBITAL_PERIOD_DAYS;
        this.axialTilt = 26.73; // degrees
        
        // Ring system properties
        this.rings = null;
        this.ringInnerRadius = this.radius * 1.2;
        this.ringOuterRadius = this.radius * 2.3;
        
        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        const textureLoader = new THREE.TextureLoader();
        const saturnTexture = textureLoader.load('/textures/saturn/saturn_8k.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
            },
            undefined,
            (err) => { console.error(`Saturn: Error loading texture:`, err); }
        );

        super.createBaseMesh({
            map: saturnTexture,
            bumpMap: saturnTexture,
            bumpScale: 0.002,
            shininess: 0.3,
            specular: new THREE.Color(0x111111)
        });

        // Create ring system
        this.createRings();

        // Apply Saturn's axial tilt to the entire object group
        // This ensures the planet and rings tilt together naturally
        this.objectGroup.rotation.x = THREE.MathUtils.degToRad(this.axialTilt);
    }

    createRings() {
        const textureLoader = new THREE.TextureLoader();
        
        const ringColorMap = textureLoader.load('/textures/saturn/saturn_ring_color_new.jpg',
            (texture) => {
                texture.anisotropy = 16;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.flipY = false;
            }
        );
        
        const ringAlphaMap = textureLoader.load('/textures/saturn/saturn_ring_alpha_new.png',
            (texture) => {
                texture.anisotropy = 16;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.flipY = false;
            }
        );
        
        // Create ring geometry with proper segments for UV mapping
        const ringGeometry = new THREE.RingGeometry(this.ringInnerRadius, this.ringOuterRadius, 128, 8);
        
        // Fix UV coordinates for proper radial texture mapping
        const positions = ringGeometry.attributes.position;
        const uvs = ringGeometry.attributes.uv;
        const v3 = new THREE.Vector3();
        
        for (let i = 0; i < positions.count; i++) {
            v3.fromBufferAttribute(positions, i);
            const distance = v3.length();
            // Map distance from inner to outer radius to 0-1 UV coordinate
            const normalizedRadius = (distance - this.ringInnerRadius) / (this.ringOuterRadius - this.ringInnerRadius);
            uvs.setXY(i, normalizedRadius, 0.5);
        }
        
        uvs.needsUpdate = true;
        
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: ringColorMap,
            alphaMap: ringAlphaMap,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            depthWrite: false,
            alphaTest: 0.1,
            color: 0x777777
        });

        this.rings = new THREE.Mesh(ringGeometry, ringMaterial);
        this.rings.name = 'SaturnRings';
        
        this.rings.rotation.x = Math.PI / 2;
        
        this.objectGroup.add(this.rings);
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

        // Rings rotate with the planet around their own axis
        // Since rings are rotated 90° around X to be horizontal, we rotate around Z axis
        if (this.rings && animate) {
            this.rings.rotation.z += this.rotationSpeed * deltaTime;
        }

        this.updatePosition();
    }

    getInfo() {
        return {
            name: 'Saturn',
            type: 'Gas Giant',
            radius: `${(this.config.DIAMETER_KM / 2).toLocaleString()} km`,
            mass: `${(this.mass / 5.972e24).toFixed(2)} Earth masses`,
            gravity: `${this.gravity} m/s²`,
            temperature: `${this.temperature}°C (average)`,
            orbitRadius: `${(this.config.DISTANCE_FROM_SUN_KM / 1e6).toFixed(1)} million km`,
            orbitPeriod: `${(this.orbitalPeriod / 365.25).toFixed(1)} Earth years`,
            rotationPeriod: `${(this.rotationPeriod * 24).toFixed(1)} hours`,
            axialTilt: `${this.axialTilt}°`,
            rings: 'Prominent ring system with thousands of ringlets',
            moons: '146 known moons including Titan and Enceladus',
            description: `Saturn is the sixth planet from the Sun and the second-largest in the Solar System. It's a gas giant composed mostly of hydrogen and helium, famous for its spectacular ring system made of ice and rock particles. Saturn has a very low density - it would float in water if there were an ocean large enough! The planet has a hexagonal storm at its north pole and dozens of moons, including Titan with its thick atmosphere and methane lakes.`
        };
    }

    dispose() {
        // Dispose of materials and geometries
        if (this.mesh) {
            if (this.mesh.material.map) this.mesh.material.map.dispose();
            this.mesh.material.dispose();
            this.mesh.geometry.dispose();
        }
        
        if (this.rings) {
            if (this.rings.material.map) this.rings.material.map.dispose();
            if (this.rings.material.alphaMap) this.rings.material.alphaMap.dispose();
            this.rings.material.dispose();
            this.rings.geometry.dispose();
        }
    }
}

export default Saturn;