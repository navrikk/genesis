import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Venus class representing the planet Venus
 */
export class Venus extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super('Venus', CONFIG.VENUS.RADIUS, CONFIG.VENUS.COLOR);
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.VENUS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.VENUS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.VENUS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null; // Add moon support
        this.moon = null; 
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const venusAtmosphereTexture = textureLoader.load('assets/textures/venus_atmosphere_8k.jpg');
        const venusSurfaceTexture = textureLoader.load('assets/textures/venus_surface_8k.jpg');
        
        // Create Venus geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create Venus material with custom shader
        const venusVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            
            uniform vec3 sunPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                
                // Calculate direction to the sun in world space
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vSunDirection = normalize(sunPosition - worldPosition.xyz);
                
                // Calculate view direction for atmosphere effect
                vViewDirection = normalize(cameraPosition - worldPosition.xyz);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const venusFragmentShader = `
            uniform sampler2D atmosphereTexture;
            uniform sampler2D surfaceTexture;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            
            void main() {
                // Sample textures
                vec4 atmosphereColor = texture2D(atmosphereTexture, vUv);
                vec4 surfaceColor = texture2D(surfaceTexture, vUv);
                
                // Calculate lighting
                float sunDiffuse = max(0.0, dot(vNormal, vSunDirection));
                
                // Create smooth transition between lit and unlit sides
                float lightIntensity = smoothstep(-0.2, 0.3, dot(vNormal, vSunDirection));
                
                // Ambient light (dark side is still slightly visible)
                float ambient = 0.1;
                
                // Mix surface and atmosphere based on viewing angle
                // More atmosphere visible at edges, more surface visible when looking straight on
                float atmosphereRim = pow(1.0 - abs(dot(vNormal, vViewDirection)), 2.0);
                float atmosphereFactor = max(atmosphereRim * 0.6, 0.3); // Always show some atmosphere
                
                // Mix surface and atmosphere
                vec3 planetColor = mix(surfaceColor.rgb, atmosphereColor.rgb, atmosphereFactor);
                
                // Apply lighting
                vec3 finalColor = planetColor * (ambient + lightIntensity * 0.9);
                
                // Add subtle glow on the edges
                float edgeGlow = pow(1.0 - abs(dot(vNormal, vViewDirection)), 4.0) * 0.3;
                finalColor += vec3(1.0, 0.9, 0.7) * edgeGlow;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                atmosphereTexture: { value: venusAtmosphereTexture },
                surfaceTexture: { value: venusSurfaceTexture },
                sunPosition: { value: this.sunPosition.clone() }
            },
            vertexShader: venusVertexShader,
            fragmentShader: venusFragmentShader
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
            opacity: 0.5
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
        this.orbitPath.position.copy(this.sunPosition);
        
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
        }
    }
    
    updatePosition() {
        // Position on the orbit
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
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
}
