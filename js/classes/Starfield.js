import * as THREE from 'three';
import CONFIG from '../config.js';

/**
 * Creates and manages the starfield background
 */
export class Starfield {
    /**
     * @param {THREE.Scene} scene - The three.js scene to add stars to
     */
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.createStarfield();
    }

    createStarfield() {
        const starVertices = [];
        const starColors = []; // For color variation
        const starSizes = [];   // For size variation (brightness)

        const baseColor = new THREE.Color();

        for (let i = 0; i < CONFIG.STARFIELD.COUNT; i++) {
            // Create a truly random distribution of stars
            // Random point in a sphere using rejection sampling
            let x, y, z;
            let distanceFromCenter;
            
            do {
                // Generate random coordinates in a cube
                x = (Math.random() * 2 - 1) * CONFIG.STARFIELD.RADIUS;
                y = (Math.random() * 2 - 1) * CONFIG.STARFIELD.RADIUS;
                z = (Math.random() * 2 - 1) * CONFIG.STARFIELD.RADIUS;
                
                // Calculate distance from center
                distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
            } while (distanceFromCenter > CONFIG.STARFIELD.RADIUS); // Reject if outside the sphere
            
            // Add some clustering effect by occasionally placing stars closer together
            if (Math.random() < 0.3) {
                // Create a cluster by placing this star near another random star
                if (starVertices.length > 3) {
                    const randomStarIndex = Math.floor(Math.random() * (i - 1)) * 3;
                    const clusterRadius = CONFIG.STARFIELD.RADIUS * 0.05; // Small radius for clusters
                    
                    // Get a nearby position to an existing star
                    x = starVertices[randomStarIndex] + (Math.random() * 2 - 1) * clusterRadius;
                    y = starVertices[randomStarIndex + 1] + (Math.random() * 2 - 1) * clusterRadius;
                    z = starVertices[randomStarIndex + 2] + (Math.random() * 2 - 1) * clusterRadius;
                }
            }
            
            starVertices.push(x, y, z);

            // Vary star colors with more randomness
            // Occasionally create red, blue, or white stars
            const colorRoll = Math.random();
            if (colorRoll < 0.7) {
                // Standard bluish-white stars (majority)
                baseColor.setHSL(0.55 + Math.random() * 0.15, 0.8, 0.7 + Math.random() * 0.2);
            } else if (colorRoll < 0.85) {
                // Reddish stars
                baseColor.setHSL(0.05 + Math.random() * 0.05, 0.8, 0.6 + Math.random() * 0.2);
            } else if (colorRoll < 0.95) {
                // Blue stars
                baseColor.setHSL(0.6 + Math.random() * 0.05, 0.9, 0.7 + Math.random() * 0.3);
            } else {
                // Pure white stars
                baseColor.setHSL(0, 0, 0.9 + Math.random() * 0.1);
            }
            
            starColors.push(baseColor.r, baseColor.g, baseColor.b);

            // Vary star sizes with more variation
            const sizeVariation = Math.random();
            if (sizeVariation < 0.8) {
                // Most stars are small
                starSizes.push(CONFIG.STARFIELD.MIN_SIZE + Math.random() * (CONFIG.STARFIELD.MAX_SIZE - CONFIG.STARFIELD.MIN_SIZE) * 0.5);
            } else if (sizeVariation < 0.98) {
                // Some medium stars
                starSizes.push(CONFIG.STARFIELD.MIN_SIZE + Math.random() * (CONFIG.STARFIELD.MAX_SIZE - CONFIG.STARFIELD.MIN_SIZE) * 0.8);
            } else {
                // Few large stars
                starSizes.push(CONFIG.STARFIELD.MAX_SIZE * (0.8 + Math.random() * 0.4));
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: CONFIG.STARFIELD.MAX_SIZE, // Base size, will be modulated by attribute
            vertexColors: true, // Use colors from geometry attribute
            transparent: true,
            opacity: 0.8,
            depthWrite: false, // Avoid issues with transparent objects
            blending: THREE.AdditiveBlending, // Nice for stars
            sizeAttenuation: true // Stars appear smaller further away
        });

        this.stars = new THREE.Points(geometry, starMaterial);
        this.scene.add(this.stars);
    }

    /**
     * Update the starfield (potential future animations)
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {THREE.Vector3} cameraPosition - Current camera position
     */
    update(deltaTime, cameraPosition) {
        // Parallax effect is inherent with 3D camera movement.
        // Could add subtle twinkling if desired via shader or opacity changes.
    }
}
