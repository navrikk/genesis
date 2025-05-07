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
            // Position stars on a sphere
            const phi = Math.acos(-1 + (2 * i) / CONFIG.STARFIELD.COUNT); // Distribute more evenly
            const theta = Math.sqrt(CONFIG.STARFIELD.COUNT * Math.PI) * phi;

            const x = CONFIG.STARFIELD.RADIUS * Math.sin(phi) * Math.cos(theta);
            const y = CONFIG.STARFIELD.RADIUS * Math.sin(phi) * Math.sin(theta);
            const z = CONFIG.STARFIELD.RADIUS * Math.cos(phi);
            starVertices.push(x, y, z);

            // Vary star colors slightly (e.g., from bluish to yellowish)
            baseColor.setHSL(0.55 + Math.random() * 0.15, 0.8, 0.7 + Math.random() * 0.2); // HSL: Hue, Saturation, Lightness
            starColors.push(baseColor.r, baseColor.g, baseColor.b);

            // Vary star sizes
            starSizes.push(CONFIG.STARFIELD.MIN_SIZE + Math.random() * (CONFIG.STARFIELD.MAX_SIZE - CONFIG.STARFIELD.MIN_SIZE));
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
