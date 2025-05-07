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
    
    createMesh() {
        // Load high-resolution textures
        const textureLoader = new THREE.TextureLoader();
        const earthDayTexture = textureLoader.load('assets/textures/earth_daymap_8k.jpg');
        const earthNightTexture = textureLoader.load('assets/textures/earth_nightmap_8k.jpg');
        const earthNormalMap = textureLoader.load('assets/textures/earth_normal_8k.jpg');
        const earthSpecularMap = textureLoader.load('assets/textures/earth_specular_8k.jpg');
        const earthCloudsTexture = textureLoader.load('assets/textures/earth_clouds_8k.jpg');
        
        // Create Earth geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Create Earth material with custom shader for accurate lighting
        const earthVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            varying vec3 vWorldPosition;
            
            uniform vec3 sunPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                
                // Calculate world position for lighting calculations
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                
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
            uniform sampler2D normalMap;
            uniform sampler2D specularMap;
            uniform sampler2D cloudsTexture;
            uniform vec3 sunPosition;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vSunDirection;
            varying vec3 vViewDirection;
            varying vec3 vWorldPosition;
            
            void main() {
                // Sample textures
                vec4 dayColor = texture2D(dayTexture, vUv);
                vec4 nightColor = texture2D(nightTexture, vUv);
                vec4 cloudsColor = texture2D(cloudsTexture, vUv);
                vec3 normalMapColor = texture2D(normalMap, vUv).xyz * 2.0 - 1.0; // Convert from [0,1] to [-1,1]
                float specularIntensity = texture2D(specularMap, vUv).r; // Use red channel for specular intensity
                
                // Apply normal mapping for more detailed lighting
                vec3 normal = normalize(vNormal + normalMapColor * 0.8);
                
                // Calculate lighting with physically accurate falloff
                float sunDistance = length(sunPosition - vWorldPosition);
                float sunIntensity = 5.0; // Sun brightness factor
                
                // Inverse square law for light falloff
                float lightFalloff = sunIntensity / (1.0 + sunDistance * sunDistance * 0.0000001);
                
                // Calculate diffuse lighting
                float diffuse = max(0.0, dot(normal, vSunDirection)) * lightFalloff;
                
                // Calculate specular highlights (Blinn-Phong)
                vec3 halfVector = normalize(vSunDirection + vViewDirection);
                float specular = pow(max(0.0, dot(normal, halfVector)), 32.0) * specularIntensity * lightFalloff;
                
                // Smooth transition between day and night sides
                float dayNightMix = smoothstep(-0.2, 0.2, dot(normal, vSunDirection));
                
                // Mix day and night textures based on lighting
                vec3 earthColor = mix(nightColor.rgb, dayColor.rgb, dayNightMix);
                
                // Add specular highlights to the lit side only
                earthColor += vec3(1.0, 0.95, 0.8) * specular * dayNightMix;
                
                // Add clouds with transparency based on cloud texture alpha
                float cloudOpacity = cloudsColor.r * 0.5; // Reduce cloud opacity
                vec3 cloudShadow = vec3(0.8, 0.8, 0.8); // Slight darkening under clouds
                
                // Clouds are more visible on the day side
                float cloudVisibility = mix(0.3, 1.0, dayNightMix);
                
                // Apply clouds
                earthColor = mix(earthColor, cloudsColor.rgb, cloudOpacity * cloudVisibility);
                
                // Apply cloud shadows to the surface on the day side
                earthColor = mix(earthColor, earthColor * cloudShadow, cloudOpacity * dayNightMix * 0.5);
                
                // Add subtle atmospheric scattering at the edges (limb brightening)
                float atmosphere = pow(1.0 - abs(dot(vNormal, vViewDirection)), 4.0);
                vec3 atmosphereColor = vec3(0.6, 0.8, 1.0) * dayNightMix; // Blue atmosphere visible only on day side
                earthColor = mix(earthColor, atmosphereColor, atmosphere * 0.3);
                
                gl_FragColor = vec4(earthColor, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: earthDayTexture },
                nightTexture: { value: earthNightTexture },
                normalMap: { value: earthNormalMap },
                specularMap: { value: earthSpecularMap },
                cloudsTexture: { value: earthCloudsTexture },
                sunPosition: { value: this.sunPosition.clone() }
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
