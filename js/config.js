import * as THREE from 'three';


const CONFIG = {
    SCALE_FACTOR: 100000,
    ANIMATION: {
        enabled: true
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
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
        get ORBIT_SPEED() { return (2 * Math.PI) / (this.ORBITAL_PERIOD_DAYS * 24 * 60 * 0.1); },
        get ROTATION_SPEED() { return (2 * Math.PI) / (this.ROTATION_PERIOD_DAYS * 24 * 60 * 0.1); }
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
