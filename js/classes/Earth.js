import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

/**
 * Earth class representing the planet Earth
 */
export class Earth extends CelestialBody {
    /**
     * @param {THREE.Vector3} sunPosition - Position of the sun
     */
    constructor(sunPosition = new THREE.Vector3(0, 0, 0)) {
        super('Earth', CONFIG.EARTH.RADIUS, CONFIG.EARTH.COLOR);
        this.sunPosition = sunPosition;
        this.orbitRadius = CONFIG.EARTH.ORBIT_RADIUS;
        this.orbitSpeed = CONFIG.EARTH.ORBIT_SPEED;
        this.rotationSpeed = CONFIG.EARTH.ROTATION_SPEED;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
        this.orbitPath = null;
        this.label = null;
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }
    
    createMesh() {
        // Define Earth's surface using a procedural shader
        const earthVertexShader = `
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
        
        const earthFragmentShader = `
            uniform vec3 earthColor;
            uniform float time;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            // Noise functions for terrain and clouds
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
                
                // Base color for Earth (blue)
                vec3 baseColor = earthColor;
                
                // Generate terrain patterns
                float landPattern = fbm(vPosition * 3.0);
                float landDetail = fbm(vPosition * 7.0);
                
                // Generate cloud patterns that move slowly
                float cloudPattern = fbm(vPosition * 2.5 + vec3(time * 0.01, 0.0, 0.0));
                
                // Determine land vs water based on noise
                float isLand = smoothstep(0.4, 0.6, landPattern);
                
                // Create color variations for land and water
                vec3 oceanColor = vec3(0.0, 0.2, 0.5); // Deep blue
                vec3 shallowColor = vec3(0.0, 0.4, 0.8); // Lighter blue for shallow water
                vec3 landColor1 = vec3(0.1, 0.4, 0.1); // Green for vegetation
                vec3 landColor2 = vec3(0.6, 0.5, 0.3); // Brown for deserts
                vec3 snowColor = vec3(0.9, 0.9, 0.9); // White for polar caps
                
                // Mix water colors based on depth (using noise)
                vec3 waterColor = mix(shallowColor, oceanColor, landDetail);
                
                // Mix land colors based on "elevation" (using noise)
                vec3 groundColor = mix(landColor1, landColor2, landDetail);
                
                // Add polar caps based on y-coordinate (latitude)
                float isPolar = smoothstep(0.7, 0.9, abs(vNormal.y));
                groundColor = mix(groundColor, snowColor, isPolar);
                
                // Mix land and water
                vec3 surfaceColor = mix(waterColor, groundColor, isLand);
                
                // Add clouds
                float cloudDensity = smoothstep(0.4, 0.6, cloudPattern);
                vec3 cloudColor = vec3(1.0, 1.0, 1.0);
                surfaceColor = mix(surfaceColor, cloudColor, cloudDensity * 0.5);
                
                // Apply lighting with atmospheric scattering effect
                float atmosphericEffect = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
                vec3 atmosphereColor = vec3(0.5, 0.7, 0.9); // Light blue atmosphere
                
                // Final color with lighting and atmosphere
                vec3 finalColor = surfaceColor * (diffuse * 0.7 + 0.3);
                finalColor = mix(finalColor, atmosphereColor, atmosphericEffect * 0.3);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        // Create Earth geometry and material
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64); // Higher resolution for more detail
        const material = new THREE.ShaderMaterial({
            uniforms: {
                earthColor: { value: new THREE.Color(this.primaryColor) },
                time: { value: 0.0 } // Will be updated in the animation loop
            },
            vertexShader: earthVertexShader,
            fragmentShader: earthFragmentShader
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
