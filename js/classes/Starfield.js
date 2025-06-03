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
        const starColors = [];
        const starSizes = [];

        const baseColor = new THREE.Color();

        for (let i = 0; i < CONFIG.STARFIELD.COUNT; i++) {
            let x, y, z;
            let distanceFromCenter;
            
            do {
                x = (Math.random() * 2 - 1) * CONFIG.STARFIELD.RADIUS;
                y = (Math.random() * 2 - 1) * CONFIG.STARFIELD.RADIUS;
                z = (Math.random() * 2 - 1) * CONFIG.STARFIELD.RADIUS;

                distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
            } while (distanceFromCenter > CONFIG.STARFIELD.RADIUS);
            
            if (Math.random() < 0.3) {
                if (starVertices.length > 3) {
                    const randomStarIndex = Math.floor(Math.random() * (i - 1)) * 3;
                    const clusterRadius = CONFIG.STARFIELD.RADIUS * 0.05;

                    x = starVertices[randomStarIndex] + (Math.random() * 2 - 1) * clusterRadius;
                    y = starVertices[randomStarIndex + 1] + (Math.random() * 2 - 1) * clusterRadius;
                    z = starVertices[randomStarIndex + 2] + (Math.random() * 2 - 1) * clusterRadius;
                }
            }
            
            starVertices.push(x, y, z);

            const colorRoll = Math.random();
            if (colorRoll < 0.7) {
                baseColor.setHSL(0.55 + Math.random() * 0.15, 0.8, 0.7 + Math.random() * 0.2);
            } else if (colorRoll < 0.85) {
                baseColor.setHSL(0.05 + Math.random() * 0.05, 0.8, 0.6 + Math.random() * 0.2);
            } else if (colorRoll < 0.95) {
                baseColor.setHSL(0.6 + Math.random() * 0.05, 0.9, 0.7 + Math.random() * 0.3);
            } else {
                baseColor.setHSL(0, 0, 0.9 + Math.random() * 0.1);
            }
            
            starColors.push(baseColor.r, baseColor.g, baseColor.b);

            const sizeVariation = Math.random();
            if (sizeVariation < 0.8) {
                starSizes.push(CONFIG.STARFIELD.MIN_SIZE + Math.random() * (CONFIG.STARFIELD.MAX_SIZE - CONFIG.STARFIELD.MIN_SIZE) * 0.5);
            } else if (sizeVariation < 0.98) {
                starSizes.push(CONFIG.STARFIELD.MIN_SIZE + Math.random() * (CONFIG.STARFIELD.MAX_SIZE - CONFIG.STARFIELD.MIN_SIZE) * 0.8);
            } else {
                starSizes.push(CONFIG.STARFIELD.MAX_SIZE * (0.8 + Math.random() * 0.4));
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: CONFIG.STARFIELD.MAX_SIZE,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
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
    }
}
