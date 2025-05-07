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
    
    setSunPosition(position) {
        this.sunPosition = position.clone();
        
        // Update shader uniforms if available
        if (this.mesh && this.mesh.material && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.sunPosition.value.copy(position);
        }
    }

    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const venusTexture = textureLoader.load('assets/textures/venus_surface_8k.jpg');
        const venusCloudsTexture = textureLoader.load('assets/textures/venus_atmosphere_8k.jpg');
        
        // Create Venus geometry with high detail
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create custom shader for Venus
        const venusVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            
            uniform vec3 sunPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                
                // Calculate world position
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                
                // Calculate direction to the sun in world space
                vSunDirection = normalize(sunPosition - worldPosition.xyz);
                
                // Calculate view direction for specular highlights
                vViewDirection = normalize(cameraPosition - worldPosition.xyz);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const venusFragmentShader = `
            uniform sampler2D venusTexture;
            uniform sampler2D venusCloudsTexture;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            
            void main() {
                // Sample textures
                vec4 surfaceColor = texture2D(venusTexture, vUv);
                vec4 cloudsColor = texture2D(venusCloudsTexture, vUv);
                
                // Calculate lighting
                float sunDiffuse = max(0.0, dot(vNormal, vSunDirection));
                
                // Venus has a thick atmosphere that scatters light
                // This creates a smoother transition from day to night
                float atmosphericScattering = smoothstep(-0.3, 0.6, dot(vNormal, vSunDirection)) * 0.8 + 0.2;
                
                // Ambient light (Venus is never completely dark due to atmospheric scattering)
                float ambient = 0.15;
                
                // Blend surface and clouds based on lighting
                // Clouds are more visible on the day side
                float cloudsMix = mix(0.3, 0.7, atmosphericScattering);
                vec4 blendedColor = mix(surfaceColor, cloudsColor, cloudsMix);
                
                // Apply lighting
                vec3 finalColor = blendedColor.rgb * (ambient + atmosphericScattering * 0.85);
                
                // Add subtle atmospheric glow on the edges
                float rimLight = 1.0 - max(0.0, dot(vNormal, vViewDirection));
                float atmosphereGlow = pow(rimLight, 3.0) * 0.3;
                finalColor += vec3(0.9, 0.7, 0.3) * atmosphereGlow;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                venusTexture: { value: venusTexture },
                venusCloudsTexture: { value: venusCloudsTexture },
                sunPosition: { value: this.sunPosition.clone() }
            },
            vertexShader: venusVertexShader,
            fragmentShader: venusFragmentShader
        });
        
        // Fallback material in case shader fails
        material.onError = () => {
            console.warn('Venus shader failed to compile, using fallback material');
            this.mesh.material = new THREE.MeshStandardMaterial({
                map: venusTexture,
                emissive: new THREE.Color(0x221100),
                emissiveIntensity: 0.1,
                metalness: 0.1,
                roughness: 0.8
            });
        };
        
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
        // Create a more visible label with larger font size
        this.label = LabelUtils.createLabel(this.name, this.radius, 14, 26, 0.6, 1.2);
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
        // Venus's orbital inclination is 3.4 degrees to the ecliptic
        const inclination = 3.4 * Math.PI / 180;
        
        // Calculate position with inclination
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(inclination);
        const z = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(inclination);
        
        this.setPosition(x + this.sunPosition.x, y, z + this.sunPosition.z);
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
