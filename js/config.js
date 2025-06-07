import * as THREE from 'three';


const CONFIG = {
    SCALE_FACTOR: 100000,
    ANIMATION: {
        enabled: true,
        timeScale: 1.0, // Speed multiplier for time passage (-10,000,000x to 10,000,000x)
        smoothness: 60 // Target FPS for smooth animation
    },
    TIME: {
        currentDate: new Date(), // Current simulation time
        isLive: true, // Whether time follows real time
        minYear: 1800,
        maxYear: 2200,
        speedRange: { min: -10000000, max: 10000000 } // Speed multiplier range
    },
    CAMERA: {
        FOV: 45,
        NEAR: 0.0001,
        FAR: 10000,
        INITIAL_POSITION: new THREE.Vector3(45, 15, 25),
        LOOK_AT: new THREE.Vector3(0, 0, 0)
    },
    SUN: {
        NAME: 'Sun',
        DIAMETER_KM: 1392700,
        ROTATION_PERIOD_DAYS: 27,
        COLOR: 0xffdd00,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    MERCURY: {
        NAME: 'Mercury',
        DIAMETER_KM: 4879 * 50,
        DISTANCE_FROM_SUN_KM: 57909000,
        ORBITAL_PERIOD_DAYS: 88,
        ROTATION_PERIOD_DAYS: 58.6,
        COLOR: 0xAA8866,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    VENUS: {
        NAME: 'Venus',
        DIAMETER_KM: 12104 * 30,
        DISTANCE_FROM_SUN_KM: 108200000,
        ORBITAL_PERIOD_DAYS: 225,
        ROTATION_PERIOD_DAYS: 243,
        COLOR: 0xE6E6B8,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return -(2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
    },
    EARTH: {
        NAME: 'Earth',
        DIAMETER_KM: 12756 * 30,
        DISTANCE_FROM_SUN_KM: 149600000,
        ORBITAL_PERIOD_DAYS: 365.25,
        ROTATION_PERIOD_DAYS: 1,
        COLOR: 0x2E66FF,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    MARS: {
        NAME: 'Mars',
        DIAMETER_KM: 6779 * 30,
        DISTANCE_FROM_SUN_KM: 227900000,
        ORBITAL_PERIOD_DAYS: 687,
        ROTATION_PERIOD_DAYS: 1.03,
        COLOR: 0xE27B58,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    MOON: {
        NAME: 'Moon',
        DIAMETER_KM: 3475 * 5,
        DISTANCE_FROM_PARENT_KM: 384400 * 2.5,
        ORBITAL_PERIOD_DAYS: 27.3,
        ROTATION_PERIOD_DAYS: 27.3,
        COLOR: 0xCCCCCC,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    PHOBOS: {
        NAME: 'Phobos',
        DIAMETER_KM: 27 * 200,
        DISTANCE_FROM_PARENT_KM: 9376 * 30,
        ORBITAL_PERIOD_DAYS: 0.32,
        ROTATION_PERIOD_DAYS: 0.32,
        COLOR: 0x635a55,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    DEIMOS: {
        NAME: 'Deimos',
        DIAMETER_KM: 15 * 50,
        DISTANCE_FROM_PARENT_KM: 23463 * 10,
        ORBITAL_PERIOD_DAYS: 1.26,
        ROTATION_PERIOD_DAYS: 1.26,
        COLOR: 0x847e75,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    CERES: {
        NAME: 'Ceres',
        DIAMETER_KM: 940 * 8,
        DISTANCE_FROM_SUN_KM: 414000000,
        ORBITAL_PERIOD_DAYS: 1682,
        ROTATION_PERIOD_DAYS: 0.38,
        COLOR: 0x7a6f5f,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    VESTA: {
        NAME: 'Vesta',
        DIAMETER_KM: 525 * 8,
        DISTANCE_FROM_SUN_KM: 353000000,
        ORBITAL_PERIOD_DAYS: 1325,
        ROTATION_PERIOD_DAYS: 0.22,
        COLOR: 0x8a7f72,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    PALLAS: {
        NAME: 'Pallas',
        DIAMETER_KM: 512 * 8,
        DISTANCE_FROM_SUN_KM: 390000000,
        ORBITAL_PERIOD_DAYS: 1686,
        ROTATION_PERIOD_DAYS: 0.33,
        COLOR: 0x6e6458,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    JUPITER: {
        NAME: 'Jupiter',
        DIAMETER_KM: 142984 * 10, // Increased scaling for better visibility
        DISTANCE_FROM_SUN_KM: 778500000,
        ORBITAL_PERIOD_DAYS: 4333, // 11.86 years
        ROTATION_PERIOD_DAYS: 0.41, // ~9.9 hours
        COLOR: 0xD8CA9D,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    IO: {
        NAME: 'Io',
        DIAMETER_KM: 3643 * 10, // Reduced scaling to maintain proper ratio
        DISTANCE_FROM_PARENT_KM: 421700 * 2.5, // Safe distance from Jupiter surface
        ORBITAL_PERIOD_DAYS: 1.77,
        ROTATION_PERIOD_DAYS: 1.77, // Tidally locked
        COLOR: 0xFFDB58,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    EUROPA: {
        NAME: 'Europa',
        DIAMETER_KM: 3122 * 10, // Reduced scaling to maintain proper ratio
        DISTANCE_FROM_PARENT_KM: 671034 * 2.0, // Proportional distance
        ORBITAL_PERIOD_DAYS: 3.55,
        ROTATION_PERIOD_DAYS: 3.55,
        COLOR: 0xB8D4E3,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    GANYMEDE: {
        NAME: 'Ganymede',
        DIAMETER_KM: 5268 * 10, // Reduced scaling to maintain proper ratio
        DISTANCE_FROM_PARENT_KM: 1070412 * 1.5, // Proportional distance
        ORBITAL_PERIOD_DAYS: 7.15,
        ROTATION_PERIOD_DAYS: 7.15,
        COLOR: 0x8C7853,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    CALLISTO: {
        NAME: 'Callisto',
        DIAMETER_KM: 4821 * 10, // Reduced scaling to maintain proper ratio
        DISTANCE_FROM_PARENT_KM: 1882709 * 1.0, // Keep realistic distance
        ORBITAL_PERIOD_DAYS: 16.69,
        ROTATION_PERIOD_DAYS: 16.69,
        COLOR: 0x4A4A4A,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_PARENT_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    HYGIEA: {
        NAME: 'Hygiea',
        DIAMETER_KM: 434 * 8,
        DISTANCE_FROM_SUN_KM: 470000000,
        ORBITAL_PERIOD_DAYS: 2029,
        ROTATION_PERIOD_DAYS: 0.58,
        COLOR: 0x5c5148,
        get RADIUS() { return (this.DIAMETER_KM / 2) / CONFIG.SCALE_FACTOR; },
        get ORBIT_RADIUS() { return this.DISTANCE_FROM_SUN_KM / CONFIG.SCALE_FACTOR; },
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 3600); }, // seconds
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 3600); } // seconds
    },
    STARFIELD: {
        COUNT: 5000,
        RADIUS: 100000,
        MIN_SIZE: 0.2,
        MAX_SIZE: 2.0,
        MILKY_WAY_ENABLED: true
    },
    BLOOM_EFFECT: {
        enabled: true,
        threshold: 0.6,
        strength: 1.8,
        radius: 1.5
    }
};

export default CONFIG;
