import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Mars class representing the planet Mars
 */
export class Mars extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super('Mars', CONFIG.MARS.RADIUS, CONFIG.MARS.COLOR);
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.MARS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.MARS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MARS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.moons = []; // Array to store Mars' moons
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const marsTexture = textureLoader.load('assets/textures/mars_8k.jpg');
        const marsNormalMap = textureLoader.load('assets/textures/mars_normal_8k.jpg');
        
        // Create Mars geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create Mars material with custom shader
        const marsVertexShader = `
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
        
        const marsFragmentShader = `
            uniform sampler2D marsTexture;
            uniform sampler2D normalMap;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            
            void main() {
                // Sample textures
                vec4 texColor = texture2D(marsTexture, vUv);
                vec3 normalColor = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
                
                // Calculate lighting
                float sunDiffuse = max(0.0, dot(vNormal, vSunDirection));
                
                // Create smooth transition between lit and unlit sides
                float lightIntensity = smoothstep(-0.2, 0.3, dot(vNormal, vSunDirection));
                
                // Ambient light (dark side is still slightly visible)
                float ambient = 0.1;
                
                // Final color with lighting
                vec3 finalColor = texColor.rgb * (ambient + lightIntensity * 0.9);
                
                // Add subtle dust storm effect on the day side
                float dustEffect = texture2D(marsTexture, vUv * 2.0).r * 0.1;
                finalColor = mix(finalColor, vec3(0.8, 0.6, 0.4), dustEffect * lightIntensity);
                
                // Add subtle atmosphere on the edge
                float atmosphereGlow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 4.0) * 0.2;
                vec3 atmosphereColor = vec3(0.8, 0.4, 0.2); // Reddish atmosphere
                finalColor += atmosphereColor * atmosphereGlow * lightIntensity;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                marsTexture: { value: marsTexture },
                normalMap: { value: marsNormalMap },
                sunPosition: { value: this.sunPosition.clone() }
            },
            vertexShader: marsVertexShader,
            fragmentShader: marsFragmentShader
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
    }
    
    createOrbitPath(scene) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: 0x888888,
            transparent: true,
            opacity: 0.3
        });
        
        // Create a circle of points for the orbit
        const points = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * this.orbitRadius;
            const z = Math.sin(angle) * this.orbitRadius;
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        orbitGeometry.setFromPoints(points);
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        
        if (scene) {
            scene.add(this.orbitPath);
        }
    }
    
    createLabel() {
        this.label = LabelUtils.createLabel(this.name, this.radius, 14, 24, 0.6, 1.0);
        this.objectGroup.add(this.label);
    }
    
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
            
            // Update moons if they exist
            if (this.moons.length > 0) {
                this.moons.forEach(moon => {
                    moon.updateParentPosition(this.objectGroup.position);
                    moon.setSunPosition(this.sunPosition);
                    moon.update(deltaTime, animate);
                });
            }
        }
    }
    
    updatePosition() {
        // Calculate position on the orbit
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        // Update position
        this.objectGroup.position.set(x, 0, z);
    }
    
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }
    
    toggleLabel(visible) {
        if (this.label) {
            this.label.visible = visible;
        }
    }
    
    // Add a moon to Mars
    addMoon(moon) {
        this.moons.push(moon);
    }
    
    // Get the object group for positioning
    getObject() {
        return this.objectGroup;
    }
}
