import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Deimos class representing Mars' smaller moon
 * Deimos is highly irregular in shape with dimensions of 15 × 12.2 × 11 km
 * and has a more rounded appearance than Phobos
 */
export class Deimos extends CelestialBody {
    /**
     * @param {THREE.Vector3} parentPosition - Position of Mars
     */
    constructor(parentPosition = new THREE.Vector3(0, 0, 0)) {
        super(CONFIG.DEIMOS.NAME, CONFIG.DEIMOS.RADIUS, CONFIG.DEIMOS.COLOR);
        this.parentPosition = parentPosition;
        this.orbitRadius = CONFIG.DEIMOS.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.DEIMOS.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.DEIMOS.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.sunPosition = new THREE.Vector3(0, 0, 0);
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const deimosTexture = textureLoader.load('assets/textures/deimos_4k.jpg');
        // Use the same texture for bump mapping since we don't have a dedicated one
        const deimosBumpMap = textureLoader.load('assets/textures/deimos_4k.jpg');
        
        // Create Deimos geometry with appropriate detail for its size
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        
        // Create custom shader for Deimos with realistic lighting
        const deimosVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            
            uniform vec3 sunPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                
                // Calculate world position
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                
                // Calculate direction to the sun in world space
                vSunDirection = normalize(sunPosition - worldPosition.xyz);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const deimosFragmentShader = `
            uniform sampler2D deimosTexture;
            uniform sampler2D bumpMap;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            
            void main() {
                // Sample textures
                vec4 texColor = texture2D(deimosTexture, vUv);
                
                // Use texture for bump mapping (extract brightness)
                float bumpStrength = 0.3;
                vec3 bumpColor = texture2D(bumpMap, vUv).rgb;
                float bumpValue = (bumpColor.r + bumpColor.g + bumpColor.b) / 3.0;
                vec3 bumpNormal = vNormal + vNormal * (bumpValue - 0.5) * bumpStrength;
                vec3 normal = normalize(bumpNormal);
                
                // Calculate lighting
                float sunDiffuse = max(0.0, dot(normal, vSunDirection));
                
                // Create sharp transition between lit and unlit sides (small bodies have less atmosphere to scatter light)
                float lightIntensity = smoothstep(-0.1, 0.1, dot(normal, vSunDirection));
                
                // Ambient light (dark side is barely visible)
                float ambient = 0.02;
                
                // Final color with lighting
                vec3 finalColor = texColor.rgb * (ambient + lightIntensity * 0.98);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                deimosTexture: { value: deimosTexture },
                bumpMap: { value: deimosBumpMap },
                sunPosition: { value: this.sunPosition.clone() }
            },
            vertexShader: deimosVertexShader,
            fragmentShader: deimosFragmentShader
        });
        
        // Fallback material in case shader fails
        material.onError = () => {
            console.warn('Deimos shader failed to compile, using fallback material');
            this.mesh.material = new THREE.MeshStandardMaterial({
                map: deimosTexture,
                bumpMap: deimosBumpMap,
                bumpScale: 0.02,
                metalness: 0.1,
                roughness: 0.9
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
        // Create a more visible label with larger font size
        this.label = LabelUtils.createLabel(this.name, this.radius, 14, 24, 0.6, 1.2);
        this.objectGroup.add(this.label);
    }
    
    setSunPosition(position) {
        this.sunPosition = position.clone();
        
        // Update shader uniforms if available
        if (this.mesh && this.mesh.material && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.sunPosition.value.copy(position);
        }
    }
    
    update(deltaTime, animate = true) {
        if (animate) {
            // Update orbit position
            this.orbitAngle += this.orbitSpeed * deltaTime;
            
            // Update rotation
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            
            // Update position
            this.updatePosition();
            
            // Update orbit path position
            if (this.orbitPath) {
                this.orbitPath.position.copy(this.parentPosition);
            }
        }
    }
    
    updatePosition() {
        // Deimos's orbital inclination is 1.79 degrees to Mars's equator
        const inclination = 1.79 * Math.PI / 180;
        
        // Calculate position with inclination
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(inclination);
        const z = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(inclination);
        
        this.objectGroup.position.set(
            this.parentPosition.x + x,
            this.parentPosition.y + y,
            this.parentPosition.z + z
        );
    }
    
    // Update the parent position (when Mars moves)
    updateParentPosition(newPosition) {
        this.parentPosition.copy(newPosition);
        this.updatePosition();
        
        // Update orbit path position
        if (this.orbitPath) {
            this.orbitPath.position.copy(this.parentPosition);
        }
    }
    
    /**
     * Toggle visibility of the orbit path
     * @param {boolean} visible - Whether the orbit path should be visible
     */
    toggleOrbitPath(visible) {
        if (this.orbitPath) {
            this.orbitPath.visible = visible;
        }
    }
    
    /**
     * Toggle visibility of the label
     * @param {boolean} visible - Whether the label should be visible
     */
    toggleLabel(visible) {
        if (this.label) {
            this.label.visible = visible;
        }
    }
}
