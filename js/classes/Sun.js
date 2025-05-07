import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

/**
 * Sun class with advanced shader-based visualization
 */
export class Sun extends CelestialBody {
    constructor() {
        super(CONFIG.SUN.NAME, CONFIG.SUN.RADIUS, 0xFFCC33); // Base yellow color
        this.rotationSpeed = CONFIG.SUN.ROTATION_SPEED;
        this.label = null;
        this.createMesh();
        this.createLabel();
    }

    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('assets/textures/sun_8k.jpg');
        
        const sunGeometry = new THREE.SphereGeometry(this.radius, 128, 128); // Higher segments for smoother sun

        // Vertex Shader for Sun Surface
        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition; // Vertex position in view space

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz; // Vector from vertex to camera
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        // Fragment Shader for Sun Surface (Photosphere, Granulation, Limb Darkening)
        const fragmentShader = `
            uniform float time;
            uniform vec3 baseColor;
            uniform sampler2D sunTexture;
            uniform sampler2D noiseTexture; // For granulation
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition; // Vector from fragment to camera in view space

            // Basic pseudo-random number generator
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            // Simplex noise function (simplified)
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
            }

            void main() {
                // Sample base texture
                vec4 texColor = texture2D(sunTexture, vUv);
                
                // Limb Darkening: Darker/redder towards the edges
                float viewAngleFactor = dot(vNormal, normalize(vViewPosition)); // Cosine of angle between normal and view vector
                float limbFactor = smoothstep(0.0, 0.8, viewAngleFactor); // Stronger effect near edge
                limbFactor = pow(limbFactor, 2.5); // Adjust power for falloff
                vec3 limbColor = mix(vec3(0.9, 0.3, 0.1), texColor.rgb * baseColor, limbFactor); // Redder at edges

                // Granulation: Use noise function, animated over time
                // Scale UVs and add time for animation
                float scaledTime = time * 0.05;
                vec2 uvAnimated = vUv * 20.0 + vec2(scaledTime * 0.2, scaledTime * 0.1); // Animate noise pattern
                float n = noise(uvAnimated);
                n = (n - 0.5) * 0.3 + 0.9; // Adjust noise intensity and baseline brightness

                vec3 finalColor = limbColor * n;

                // Subtle Sunspots (example, could be more complex)
                // Simple dark spots based on UVs or another noise layer
                float spotNoise = noise(vUv * 5.0 + vec2(0.0, scaledTime * 0.05)); // Slower moving spots
                if (spotNoise > 0.75 && spotNoise < 0.8) {
                     finalColor *= 0.85; // Darken for sunspot
                }
                if (spotNoise > 0.6 && spotNoise < 0.63) {
                    finalColor *= 0.9;
                }

                // Add solar flare effect (bright spots that move over time)
                float flareNoise = noise(vUv * 8.0 + vec2(scaledTime * 0.3, scaledTime * 0.2));
                if (flareNoise > 0.75) {
                    finalColor += vec3(1.0, 0.7, 0.3) * 0.4 * (flareNoise - 0.75) * 4.0;
                }

                // Enhanced corona effect
                float edgeGlow = pow(1.0 - viewAngleFactor, 4.0);
                vec3 coronaColor = mix(vec3(1.0, 0.6, 0.2), vec3(1.0, 0.8, 0.4), viewAngleFactor);
                finalColor += coronaColor * edgeGlow * 1.5;
                
                // Add overall glow and increase brightness
                finalColor += baseColor * 0.4;
                finalColor *= 1.5; // Increase overall brightness

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Create a simple noise texture programmatically
        const noiseSize = 128;
        const noiseData = new Uint8Array(noiseSize * noiseSize * 4);
        for (let i = 0; i < noiseData.length; i += 4) {
            const val = Math.random() * 255;
            noiseData[i] = val;
            noiseData[i+1] = val;
            noiseData[i+2] = val;
            noiseData[i+3] = 255;
        }
        const proceduralNoiseTexture = new THREE.DataTexture(noiseData, noiseSize, noiseSize, THREE.RGBAFormat || 1023);
        proceduralNoiseTexture.wrapS = THREE.RepeatWrapping;
        proceduralNoiseTexture.wrapT = THREE.RepeatWrapping;
        proceduralNoiseTexture.needsUpdate = true;

        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                baseColor: { value: new THREE.Color(this.primaryColor) },
                sunTexture: { value: sunTexture },
                noiseTexture: { value: proceduralNoiseTexture }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });

        this.mesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.mesh.name = this.name;
        this.objectGroup.add(this.mesh);

        // Add this line to make the Sun's material emissive for the bloom effect
        if (CONFIG.BLOOM_EFFECT && CONFIG.BLOOM_EFFECT.enabled) {
            this.mesh.layers.enable(1); // BLOOM_SCENE layer
        }
    }
    
    /**
     * Creates a text label for the Sun
     */
    createLabel() {
        // Create a more visible label with larger font size and better contrast
        this.label = LabelUtils.createLabel(this.name, this.radius, 24, 48, 1.2, 2.0);
        // Make the label always face the camera and be more visible
        if (this.label.material) {
            this.label.material.depthTest = false;
            this.label.material.opacity = 0.9;
        }
        this.objectGroup.add(this.label);
    }

    update(deltaTime) {
        // Sun rotation
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;

        // Update shader time for animations
        if (this.mesh.material.uniforms && this.mesh.material.uniforms.time) {
            this.mesh.material.uniforms.time.value += deltaTime;
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
