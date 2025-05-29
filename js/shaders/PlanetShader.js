import * as THREE from 'three';

/**
 * Custom shader for planets and moons to ensure shine only appears on the sun-facing side
 */
const PlanetShader = {
    uniforms: {
        'map': { value: null },
        'normalMap': { value: null },
        'specularMap': { value: null },
        'sunPosition': { value: new THREE.Vector3(0, 0, 0) },
        'shininess': { value: 1.0 },
        'specularStrength': { value: 0.05 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        
        void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D normalMap;
        uniform sampler2D specularMap;
        uniform vec3 sunPosition;
        uniform float shininess;
        uniform float specularStrength;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        
        void main() {
            // Base color from texture
            vec4 diffuseColor = texture2D(map, vUv);
            
            // Normal mapping
            vec3 normal = normalize(vNormal);
            
            #ifdef USE_NORMALMAP
                vec3 normalMapValue = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
                normal = normalize(normal + normalMapValue * 0.05); // Reduced normal map strength
            #endif
            
            // Calculate direction to sun
            vec3 sunDirection = normalize(sunPosition - vWorldPosition);
            
            // Calculate direction to camera
            vec3 viewDirection = normalize(vViewPosition);
            
            // Improved diffuse lighting with smoother transition to dark side
            float diffuseFactor = max(dot(normal, sunDirection), 0.0);
            
            // Create a more realistic falloff for the terminator (day/night boundary)
            float terminatorSoftness = 0.05; // Controls the softness of the day/night transition
            float softDiffuse = smoothstep(-terminatorSoftness, terminatorSoftness, dot(normal, sunDirection));
            
            // Ambient lighting with slight color variation (bluish for dark side, warm for light side)
            float ambientFactor = 0.15; // Slightly reduced ambient for better contrast
            vec3 darkSideColor = vec3(0.1, 0.1, 0.2); // Slightly bluish dark side
            vec3 lightSideAmbient = vec3(0.2, 0.15, 0.1); // Slightly warm light side ambient
            
            // Only calculate specular on the sun-facing side with smoother falloff
            float specularFactor = 0.0;
            if (diffuseFactor > 0.0) {
                // Improved specular lighting (Blinn-Phong with better falloff)
                vec3 halfwayDir = normalize(sunDirection + viewDirection);
                float specAngle = max(dot(normal, halfwayDir), 0.0);
                
                // Apply specular with sharper falloff and sun-angle attenuation
                float sunAngleFactor = pow(diffuseFactor, 0.5); // Reduce specular as sun angle becomes more glancing
                specularFactor = pow(specAngle, shininess * 64.0) * specularStrength * sunAngleFactor;
                
                #ifdef USE_SPECULARMAP
                    float specMapValue = texture2D(specularMap, vUv).r;
                    specularFactor *= specMapValue;
                #endif
                
                // Ensure specular is completely gone on the dark side
                specularFactor *= softDiffuse;
            }
            
            // Combine lighting components with improved color blending
            vec3 ambientColor = mix(darkSideColor, lightSideAmbient, softDiffuse);
            vec3 diffuseContribution = diffuseColor.rgb * (ambientFactor * ambientColor + diffuseFactor * vec3(1.0));
            vec3 finalColor = diffuseContribution + vec3(specularFactor);
            
            gl_FragColor = vec4(finalColor, diffuseColor.a);
        }
    `
};

export default PlanetShader;
