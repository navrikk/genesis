import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

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
        this.label = null;
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Define Venus's surface using a procedural shader for cloud cover
        const venusVertexShader = `
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const venusFragmentShader = `
            uniform vec3 venusColor;
            uniform float time;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            // Noise functions for cloud patterns
            float hash(float n) {
                return fract(sin(n) * 43758.5453);
            }
            
            float noise(vec3 x) {
                vec3 p = floor(x);
                vec3 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                
                float n = p.x + p.y * 57.0 + p.z * 113.0;
                return mix(
                    mix(
                        mix(hash(n), hash(n + 1.0), f.x),
                        mix(hash(n + 57.0), hash(n + 58.0), f.x),
                        f.y
                    ),
                    mix(
                        mix(hash(n + 113.0), hash(n + 114.0), f.x),
                        mix(hash(n + 170.0), hash(n + 171.0), f.x),
                        f.y
                    ),
                    f.z
                );
            }
            
            float fbm(vec3 p) {
                float f = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                for (int i = 0; i < 6; i++) {
                    f += amplitude * noise(p * frequency);
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                return f;
            }
            
            void main() {
                // Normalized light direction (from the sun)
                vec3 lightDir = normalize(vec3(1.0, 0.2, 0.0));
                float diffuse = max(0.0, dot(vNormal, lightDir));
                
                // Base color for Venus (yellowish)
                vec3 baseColor = venusColor;
                
                // Generate cloud patterns that move slowly
                float cloudPattern = fbm(vPosition * 2.0 + vec3(0.0, 0.0, time * 0.05));
                float cloudDetail = fbm(vPosition * 5.0 + vec3(0.0, time * 0.02, 0.0));
                
                // Combine cloud patterns
                float clouds = cloudPattern * cloudDetail;
                
                // Create swirling cloud patterns
                float swirl = fbm(vPosition * 3.0 + vec3(clouds * 0.5, clouds * 0.5, time * 0.01));
                
                // Create color variations for different cloud layers
                vec3 cloudColor1 = vec3(0.95, 0.95, 0.8); // Light yellow
                vec3 cloudColor2 = vec3(0.85, 0.75, 0.5); // Darker yellow-orange
                
                // Mix cloud colors based on patterns
                vec3 cloudColor = mix(cloudColor2, cloudColor1, swirl);
                
                // Mix base color with cloud color
                vec3 surfaceColor = mix(baseColor, cloudColor, clouds * 0.7);
                
                // Apply lighting with atmospheric scattering effect
                float atmosphericEffect = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
                vec3 atmosphereColor = vec3(0.9, 0.8, 0.6); // Yellowish atmosphere
                
                // Final color with lighting and atmosphere
                vec3 finalColor = surfaceColor * (diffuse * 0.7 + 0.3);
                finalColor = mix(finalColor, atmosphereColor, atmosphericEffect * 0.3);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        // Create Venus geometry and material
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64); // Higher resolution for more detail
        const material = new THREE.ShaderMaterial({
            uniforms: {
                venusColor: { value: new THREE.Color(this.primaryColor) },
                time: { value: 0.0 } // Will be updated in the animation loop
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
        // Create a canvas for the label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw text on the canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas with transparency
        context.font = '28px "Helvetica Neue", Arial, sans-serif';
        context.fillStyle = 'rgba(255, 255, 255, 0.7)';
        context.textAlign = 'center';
        context.fillText(this.name, canvas.width / 2, canvas.height / 2);
        
        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        this.label = new THREE.Sprite(spriteMaterial);
        this.label.scale.set(1.5, 0.75, 1); // Smaller scale
        this.label.position.set(0, this.radius * 2, 0);
        this.objectGroup.add(this.label);
    }
    
    update(deltaTime) {
        // Update orbit position
        this.orbitAngle += this.orbitSpeed * deltaTime;
        
        // Update rotation
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        
        // Update cloud animation time
        if (this.mesh && this.mesh.material && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value += deltaTime;
        }
        
        // Update position
        this.updatePosition();
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
