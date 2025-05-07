import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Mercury class representing the planet Mercury
 */
export class Mercury extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super('Mercury', CONFIG.MERCURY.RADIUS, CONFIG.MERCURY.COLOR);
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.MERCURY.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.MERCURY.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MERCURY.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.moon = null;
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }

    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const mercuryTexture = textureLoader.load('assets/textures/mercury_8k.jpg');
        
        // Create Mercury geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create Mercury material with custom shader
        const mercuryVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            
            uniform vec3 sunPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                
                // Calculate direction to the sun in world space
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vSunDirection = normalize(sunPosition - worldPosition.xyz);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const mercuryFragmentShader = `
            uniform sampler2D mercuryTexture;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            
            void main() {
                // Sample texture
                vec4 texColor = texture2D(mercuryTexture, vUv);
                
                // Calculate lighting
                float sunDiffuse = max(0.0, dot(vNormal, vSunDirection));
                
                // Create smooth transition between lit and unlit sides
                float lightIntensity = smoothstep(-0.2, 0.3, dot(vNormal, vSunDirection));
                
                // Ambient light (dark side is still slightly visible)
                float ambient = 0.1;
                
                // Final color with lighting
                vec3 finalColor = texColor.rgb * (ambient + lightIntensity * 0.9);
                
                // Add subtle heat glow on the day side (Mercury is very hot on the sun side)
                float heatGlow = pow(max(0.0, dot(vNormal, vSunDirection)), 4.0) * 0.2;
                finalColor += vec3(0.8, 0.5, 0.2) * heatGlow;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                mercuryTexture: { value: mercuryTexture },
                sunPosition: { value: this.sunPosition.clone() }
            },
            vertexShader: mercuryVertexShader,
            fragmentShader: mercuryFragmentShader
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
    }

    /**
     * Creates the orbit path visualization
     * @param {THREE.Scene} scene - The scene to add the orbit path to
     */
    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.5 });
        
        // Create a circle of points for the orbit
        const orbitPoints = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            orbitPoints.push(
                Math.cos(theta) * this.orbitRadius,
                0, // Keep orbit in the XZ plane
                Math.sin(theta) * this.orbitRadius
            );
        }
        
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(this.orbitPath);
    }

    createLabel() {
        this.label = LabelUtils.createLabel(this.name, this.radius, 12, 20, 0.5, 0.9);
        this.objectGroup.add(this.label);
    }

    /**
     * Updates Mercury's position based on its orbit
     */
    updatePosition() {
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        this.setPosition(x + this.sunPosition.x, 0, z + this.sunPosition.z);
    }

    /**
     * Update method for animations, rotations, etc.
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {boolean} animate - Whether to animate the planet
     */
    update(deltaTime, animate = true) {
        if (animate) {
            // Update orbit position
            this.orbitAngle += this.orbitSpeed * deltaTime;
            
            // Update rotation
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            
            // Update shader uniforms
            if (this.mesh && this.mesh.material && this.mesh.material.uniforms) {
                this.mesh.material.uniforms.sunPosition.value.copy(this.sunPosition);
            }
            
            // Update position
            this.updatePosition();
            
            // Update orbit path position
            if (this.orbitPath) {
                this.orbitPath.position.set(0, 0, 0);
            }
        }
    }

    /**
     * Toggle the visibility of the orbit path
     * @param {boolean} visible - Whether the orbit path should be visible
     */
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }

    /**
     * Toggle the visibility of the label
     * @param {boolean} visible - Whether the label should be visible
     */
    toggleLabel(visible) {
        if (this.label) {
            this.label.visible = visible;
        }
    }
}
