import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Moon class representing Earth's moon
 */
export class Moon extends CelestialBody {
    /**
     * @param {THREE.Vector3} parentPosition - Position of the parent planet
     */
    constructor(parentPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.MOON.NAME, CONFIG.MOON.RADIUS, CONFIG.MOON.COLOR);
        this.parentPosition = parentPosition;
        this.orbitRadius = CONFIG.MOON.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.MOON.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.MOON.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.sunPosition = new THREE.Vector3(0, 0, 0); // Initialize sun position
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const moonTexture = textureLoader.load('assets/textures/moon_8k.jpg');
        const moonNormalMap = textureLoader.load('assets/textures/moon_normal_8k.jpg');
        
        // Create Moon geometry with higher resolution
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create Moon material with custom shader for proper lunar appearance
        const moonVertexShader = `
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
                
                // Calculate view direction for specular highlights
                vViewDirection = normalize(cameraPosition - worldPosition.xyz);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const moonFragmentShader = `
            uniform sampler2D moonTexture;
            uniform sampler2D normalMap;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            
            void main() {
                // Sample textures
                vec4 texColor = texture2D(moonTexture, vUv);
                vec3 normalColor = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
                
                // Enhance the texture brightness slightly
                texColor.rgb = texColor.rgb * 1.1;
                
                // Apply normal mapping
                vec3 normal = normalize(vNormal + normalColor * 0.8);
                
                // Calculate lighting with enhanced brightness
                float sunDiffuse = max(0.0, dot(normal, vSunDirection));
                
                // Create smooth transition between lit and unlit sides
                float lightIntensity = smoothstep(-0.2, 0.3, dot(normal, vSunDirection));
                
                // Add specular highlight for the shine
                vec3 halfVector = normalize(vSunDirection + vViewDirection);
                float specular = pow(max(0.0, dot(normal, halfVector)), 32.0) * 0.3;
                
                // Ambient light (dark side is still slightly visible)
                float ambient = 0.15;
                
                // Final color with enhanced lighting
                vec3 finalColor = texColor.rgb * (ambient + lightIntensity * 0.9) + specular * vec3(1.0);
                
                // No additional brightness boost
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                moonTexture: { value: moonTexture },
                normalMap: { value: moonNormalMap },
                sunPosition: { value: this.sunPosition.clone() }
            },
            vertexShader: moonVertexShader,
            fragmentShader: moonFragmentShader
        });
        
        // Fallback to standard material if shader fails
        material.onError = () => {
            console.warn('Shader compilation failed, using fallback material');
            this.mesh.material = new THREE.MeshStandardMaterial({
                map: moonTexture,
                normalMap: moonNormalMap,
                color: 0xDDDDDD,
                roughness: 0.7,
                metalness: 0.1,
                emissive: 0x222222,
                emissiveIntensity: 0.1
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
            opacity: 0.3
        });
        
        // Create a circle of points for the orbit
        const points = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * this.orbitRadius;
            const z = Math.sin(angle) * this.orbitRadius;
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        orbitGeometry.setFromPoints(points);
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbitPath.position.copy(this.parentPosition);
        this.orbitPath.userData.isOrbit = true; // Add property for orbit visibility toggling
        
        if (scene) {
            scene.add(this.orbitPath);
        }
    }
    
    createLabel() {
        this.label = LabelUtils.createLabel(this.name, this.radius);
        this.objectGroup.add(this.label);
    }
    
    update(deltaTime, animate = true) {
        if (animate) {
            // Update orbit position
            this.orbitAngle += this.orbitSpeed * deltaTime;
            
            // Update rotation
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            
            // Update shader uniforms for lighting
            if (this.mesh && this.mesh.material && this.mesh.material.uniforms) {
                this.mesh.material.uniforms.sunPosition.value.copy(this.sunPosition);
            }
            
            // Update position
            this.updatePosition();
            
            // Update orbit path position
            if (this.orbitPath) {
                this.orbitPath.position.copy(this.parentPosition);
            }
        }
    }
    
    updatePosition() {
        // Position on the orbit around parent
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        // Position relative to parent
        this.objectGroup.position.set(
            this.parentPosition.x + x,
            this.parentPosition.y,
            this.parentPosition.z + z
        );
    }
    
    // Update the parent position (when Earth moves)
    updateParentPosition(newPosition) {
        this.parentPosition.copy(newPosition);
        this.updatePosition();
        
        // Update orbit path position
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.parentPosition);
        }
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
    
    // Set the sun position for lighting calculations
    setSunPosition(sunPosition) {
        this.sunPosition.copy(sunPosition);
        
        // No need to update shader uniforms with standard material
    }
}
