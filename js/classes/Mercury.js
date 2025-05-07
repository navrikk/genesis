import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';

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
        this.createMesh();
        this.createLabel();
        this.updatePosition();
    }

    createMesh() {
        // Create Mercury's sphere
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        
        // Create a procedural texture for Mercury using shaders
        const mercuryVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const mercuryFragmentShader = `
            uniform vec3 baseColor;
            varying vec2 vUv;
            varying vec3 vNormal;
            
            // Noise functions
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                
                // Four corners in 2D of a tile
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                
                // Smooth interpolation
                vec2 u = f * f * (3.0 - 2.0 * f);
                
                return mix(a, b, u.x) +
                        (c - a) * u.y * (1.0 - u.x) +
                        (d - b) * u.x * u.y;
            }
            
            void main() {
                // Base color for Mercury (grayish-brown)
                vec3 color = baseColor;
                
                // Add crater-like features
                float largeScale = noise(vUv * 10.0) * 0.5 + 0.5;
                float mediumScale = noise(vUv * 20.0) * 0.3;
                float smallScale = noise(vUv * 50.0) * 0.2;
                
                // Combine different scales of noise
                float combinedNoise = largeScale + mediumScale + smallScale;
                combinedNoise = combinedNoise * 0.5 + 0.5; // Normalize to 0-1 range
                
                // Add some darker areas for craters
                if (combinedNoise < 0.4) {
                    color *= 0.8; // Darker craters
                } else if (combinedNoise > 0.7) {
                    color *= 1.1; // Lighter highlands
                }
                
                // Add some color variation
                color.r *= 1.0 + noise(vUv * 5.0) * 0.1;
                color.g *= 1.0 + noise(vUv * 7.0) * 0.1;
                color.b *= 1.0 + noise(vUv * 9.0) * 0.1;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                baseColor: { value: new THREE.Color(this.primaryColor) }
            },
            vertexShader: mercuryVertexShader,
            fragmentShader: mercuryFragmentShader
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);
    }

    /**
     * Creates the orbit path visualization
     * @param {THREE.Scene} scene - The scene to add the orbit path to
     */
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

    /**
     * Creates a text label for Mercury
     */
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
            this.updatePosition();
            
            // Rotate Mercury
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
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
