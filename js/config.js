import * as THREE from 'three';

// Configuration settings for the solar system visualization
const CONFIG = {
    SCALE_FACTOR: 100000, // 1 unit = 100,000 km
    ANIMATION: {
        enabled: true // Default state for animation
    },
    CAMERA: {
        FOV: 45,
        NEAR: 0.1,
        FAR: 10000,
        INITIAL_POSITION: new THREE.Vector3(0, 50, 150), // Adjusted for better initial view
        LOOK_AT: new THREE.Vector3(0, 0, 0)
    },
    SUN: {
        NAME: 'Sun',
        DIAMETER_KM: 1392700, // Actual diameter in km
        ROTATION_PERIOD_DAYS: 27, // Equatorial rotation period
        COLOR: 0xffdd00,
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
    VENUS: {
        NAME: 'Venus',
        DIAMETER_KM: 12104 * 30, // Increased size for visibility
        DISTANCE_FROM_SUN_KM: 108200000, // Average distance
        ORBITAL_PERIOD_DAYS: 225,
        ROTATION_PERIOD_DAYS: 243, // Retrograde rotation
        COLOR: 0xE6E6B8, // Yellowish color
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); }, // Sped up for visualization
        get ROTATION_SPEED() { return -(2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Negative for retrograde rotation
    },
    EARTH: {
        NAME: 'Earth',
        DIAMETER_KM: 12756 * 30, // Increased size for visibility
        DISTANCE_FROM_SUN_KM: 149600000, // Average distance
        ORBITAL_PERIOD_DAYS: 365.25,
        ROTATION_PERIOD_DAYS: 1,
        COLOR: 0x2E66FF, // Blue color
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); }, // Sped up for visualization
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Sped up for visualization
    },
    STARFIELD: {
        COUNT: 10000,
        RADIUS: 5000
    },
    BLOOM_EFFECT: {
        enabled: true,
        threshold: 0.3,
        strength: 1.5,
        radius: 0.7
    }
};

export default CONFIG;
