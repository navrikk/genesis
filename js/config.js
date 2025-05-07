import * as THREE from 'three';

// Configuration settings for the solar system visualization
const CONFIG = {
    SCALE_FACTOR: 100000, // 1 unit = 100,000 km
    SUN: {
        NAME: 'Sun',
        DIAMETER_KM: 1392700,
        ROTATION_PERIOD_DAYS: 27, // Equatorial rotation period
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Sped up for visualization (0.1 = 10x faster than 1 min)
    },
    MERCURY: {
        NAME: 'Mercury',
        DIAMETER_KM: 4879 * 50, // Massively increased size for extreme visibility
        DISTANCE_FROM_SUN_KM: 57909000, // Average distance
        ORBITAL_PERIOD_DAYS: 88,
        ROTATION_PERIOD_DAYS: 58.6,
        COLOR: 0xAA8866, // Brownish-gray color
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); }, // Sped up for visualization
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Sped up for visualization
    },
    CAMERA: {
        FOV: 45,
        NEAR: 0.1,
        FAR: 20000, // Increased for larger starfield
        INITIAL_POSITION: new THREE.Vector3(0, 15, 30), // Adjusted for better initial view
        LOOK_AT: new THREE.Vector3(0, 0, 0)
    },
    STARFIELD: {
        COUNT: 15000,
        RADIUS: 10000, // Stars spread out further
        MIN_SIZE: 0.05,
        MAX_SIZE: 0.25
    },
    BLOOM_EFFECT: {
        enabled: true,
        strength: 1.2, // Adjusted for a more pronounced glow
        radius: 0.8,
        threshold: 0.1
    },
    ANIMATION: {
        enabled: true // Default state for animation
    }
};

export default CONFIG;
