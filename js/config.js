import * as THREE from 'three';

// Configuration settings for the solar system visualization
const CONFIG = {
    SCALE_FACTOR: 100000, // 1 unit = 100,000 km
    ANIMATION: {
        enabled: true // Default state for animation
    },
    CAMERA: {
        FOV: 45,
        NEAR: 0.0001, // Significantly reduced for very close zoom on tiny objects like Phobos/Deimos
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
    MARS: {
        NAME: 'Mars',
        DIAMETER_KM: 6779 * 30, // Increased size for visibility
        DISTANCE_FROM_SUN_KM: 227900000, // Average distance
        ORBITAL_PERIOD_DAYS: 687,
        ROTATION_PERIOD_DAYS: 1.03,
        COLOR: 0xE27B58, // Reddish-orange color
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); }, // Sped up for visualization
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Sped up for visualization
    },
    MOON: {
        NAME: 'Moon',
        DIAMETER_KM: 3475 * 5, // Reduced multiplier for more realistic scale relative to Earth
        DISTANCE_FROM_PARENT_KM: 384400 * 2.5, // Increased distance for more realistic Moon-Earth separation
        ORBITAL_PERIOD_DAYS: 27.3,
        ROTATION_PERIOD_DAYS: 27.3, // Tidally locked to Earth
        COLOR: 0xCCCCCC, // Gray color
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); }, // Sped up for visualization
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Sped up for visualization
    },
    PHOBOS: {
        NAME: 'Phobos',
        DIAMETER_KM: 27 * 200, // Modest visual multiplier, focus distance to be handled separately
        DISTANCE_FROM_PARENT_KM: 9376 * 30, // Increased multiplier to move Phobos further from Mars
        ORBITAL_PERIOD_DAYS: 0.32, // Very fast orbit (7 hours 39 minutes)
        ROTATION_PERIOD_DAYS: 0.32, // Tidally locked to Mars
        COLOR: 0x635a55, // NASA-accurate reddish-gray
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); }, // Sped up for visualization
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Sped up for visualization
    },
    DEIMOS: {
        NAME: 'Deimos',
        DIAMETER_KM: 15 * 50, // Using largest actual dimension (15km) with a visibility multiplier
        DISTANCE_FROM_PARENT_KM: 23463 * 10, // Actual distance (23463km) with a visibility multiplier
        ORBITAL_PERIOD_DAYS: 1.26, // About 30 hours
        ROTATION_PERIOD_DAYS: 1.26, // Tidally locked to Mars
        COLOR: 0x847e75, // NASA-accurate grayish-brown
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); }, // Sped up for visualization
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); } // Sped up for visualization
    },
    STARFIELD: {
        COUNT: 20000, // Reduced star count for a less overwhelming background
        RADIUS: 100000, // Increased radius for better depth perception
        MIN_SIZE: 0.3,  // Smaller minimum size for more variation
        MAX_SIZE: 2.0   // Maximum star size
    },
    BLOOM_EFFECT: {
        enabled: true,
        threshold: 0.3,
        strength: 1.5,
        radius: 0.7
    }
};

export default CONFIG;
