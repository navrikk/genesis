import * as THREE from 'three';
import CONFIG from '../config.js';
import { CelestialBody } from './CelestialBody.js';
import { LabelUtils } from '../utils/LabelUtils.js';

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
        this.moon = null; // Add moon property
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
        
        // Update moon's sun position
        if (this.moon) {
            this.moon.setSunPosition(this.sunPosition);
        }
    }

    createMesh() {
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const earthDayTexture = textureLoader.load('assets/textures/earth_daymap_8k.jpg');
        const earthNightTexture = textureLoader.load('assets/textures/earth_nightmap_8k.jpg');
        const earthCloudsTexture = textureLoader.load('assets/textures/earth_clouds_8k.jpg');
        const earthNormalMap = textureLoader.load('assets/textures/earth_normal_8k.jpg');
        const earthSpecularMap = textureLoader.load('assets/textures/earth_specular_8k.jpg');
        
        // Create Earth geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create custom shader for Earth
        const earthVertexShader = `
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
        
        const earthFragmentShader = `
            uniform sampler2D dayTexture;
            uniform sampler2D nightTexture;
            uniform sampler2D cloudsTexture;
            uniform sampler2D normalMap;
            uniform sampler2D specularMap;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            
            void main() {
                // Sample textures
                vec4 dayColor = texture2D(dayTexture, vUv);
                vec4 nightColor = texture2D(nightTexture, vUv);
                vec4 cloudsColor = texture2D(cloudsTexture, vUv);
                vec3 normalMapColor = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
                float specularValue = texture2D(specularMap, vUv).r;
                
                // Apply normal mapping
                vec3 normal = normalize(vNormal + normalMapColor * 0.2);
                
                // Calculate lighting
                float sunDiffuse = max(0.0, dot(normal, vSunDirection));
                
                // Create smooth day/night transition
                float dayMix = smoothstep(-0.2, 0.2, dot(normal, vSunDirection));
                vec3 groundColor = mix(nightColor.rgb, dayColor.rgb, dayMix);
                
                // Clouds are illuminated on the day side
                float cloudsMix = cloudsColor.r * 0.8;
                float cloudBrightness = mix(0.1, 1.0, dayMix);
                vec3 cloudsIlluminated = cloudsColor.rgb * cloudBrightness;
                
                // Blend ground and clouds
                vec3 blendedColor = mix(groundColor, cloudsIlluminated, cloudsMix);
                
                // Add specular highlight on water (oceans)
                vec3 halfVector = normalize(vSunDirection + vViewDirection);
                float specular = pow(max(0.0, dot(normal, halfVector)), 64.0) * specularValue * dayMix;
                
                // Add atmospheric scattering effect on the edges
                float atmosphere = 1.0 - max(0.0, dot(vNormal, vViewDirection));
                float atmosphereGlow = pow(atmosphere, 3.0) * 0.3 * max(0.0, dot(vNormal, vSunDirection));
                
                // Final color
                vec3 finalColor = blendedColor;
                finalColor += vec3(0.3, 0.5, 0.9) * atmosphereGlow; // Blue atmospheric glow
                finalColor += vec3(1.0, 1.0, 0.9) * specular; // Specular highlight on water
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: earthDayTexture },
                nightTexture: { value: earthNightTexture },
                cloudsTexture: { value: earthCloudsTexture },
                normalMap: { value: earthNormalMap },
                specularMap: { value: earthSpecularMap },
                sunPosition: { value: this.sunPosition.clone() }
            },
            vertexShader: earthVertexShader,
            fragmentShader: earthFragmentShader
        });
        
        // Fallback material in case shader fails
        material.onError = () => {
            console.warn('Earth shader failed to compile, using fallback material');
            this.mesh.material = new THREE.MeshStandardMaterial({
                map: earthDayTexture,
                normalMap: earthNormalMap,
                normalScale: new THREE.Vector2(0.2, 0.2),
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

    createLabel() {
        // Create a more visible label with larger font size
        this.label = LabelUtils.createLabel(this.name, this.radius, 16, 28, 0.7, 1.3);
        this.objectGroup.add(this.label);
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
    
    updatePosition() {
        // Earth's orbital inclination is 0.0 degrees to the ecliptic (by definition)
        // Earth's axial tilt is 23.5 degrees
        const axialTilt = 23.5 * Math.PI / 180;
        
        // Calculate position
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        this.setPosition(x + this.sunPosition.x, 0, z + this.sunPosition.z);
        
        // Apply axial tilt
        this.mesh.rotation.x = axialTilt;
    }
    
    update(deltaTime, animate = true) {
        if (animate) {
            // Update orbit position
            this.orbitAngle += this.orbitSpeed * deltaTime;
            
            // Update rotation
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
            
            // Update shader uniforms
            if (this.mesh && this.mesh.material && this.mesh.material.uniforms) {
                if (this.mesh.material.uniforms.time) {
                    this.mesh.material.uniforms.time.value += deltaTime;
                }
                if (this.mesh.material.uniforms.sunPosition) {
                    this.mesh.material.uniforms.sunPosition.value.copy(this.sunPosition);
                }
            }
            
            // Update position
            this.updatePosition();
            
            // Update orbit path position
            if (this.orbitPath) {
                // Use (0,0,0) as the orbit center since Earth orbits around the Sun at origin
                this.orbitPath.position.set(0, 0, 0);
            }
            
            // Update moon position if it exists
            if (this.moon) {
                this.moon.updateParentPosition(this.objectGroup.position);
                this.moon.setSunPosition(this.sunPosition);
                this.moon.update(deltaTime, animate);
            }
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
}
