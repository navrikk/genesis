import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import CONFIG from './config.js';
import { isWebGLAvailable } from './utils/webgl-check.js';
import { SolarSystem } from './classes/SolarSystem.js';
import { Sun } from './classes/Sun.js';
import { Mercury } from './classes/Mercury.js';
import { Venus } from './classes/Venus.js';
import { Earth } from './classes/Earth.js';
import { Moon } from './classes/Moon.js'; 
import { Mars } from './classes/Mars.js'; 
import { Phobos } from './classes/Phobos.js'; 
import { Deimos } from './classes/Deimos.js'; 
import { Starfield } from './classes/Starfield.js';

/**
 * Main application class for the 3D solar system
 */
export default class App {
    constructor() {
        if (!isWebGLAvailable()) {
            document.getElementById('webgl-compatibility').classList.remove('hidden');
            document.getElementById('loadingScreen').style.display = 'none';
            console.error("WebGL is not supported or available.");
            return;
        }

        this.container = document.getElementById('container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, window.innerWidth / window.innerHeight, CONFIG.CAMERA.NEAR, CONFIG.CAMERA.FAR);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
        this.controls = null;
        this.solarSystem = new SolarSystem(this.scene);
        this.starfield = null;
        this.clock = new THREE.Clock();
        this.composer = null; 
        this.bloomPass = null;

        this.materialsToDispose = []; 
        this.geometriesToDispose = [];

        this.focusedBody = null; 
        this.userPanned = false; 
        this.userControlActive = false; 
        this.lastUserInteractionTime = 0; 
        this.userControlTimeout = 5000; 
        this.userCameraPosition = null; 
        this.userControlsTarget = null; 
        this.currentAnimation = null; 

        this.init();
    }

    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Camera setup
        this.camera.position.copy(CONFIG.CAMERA.INITIAL_POSITION);
        this.camera.lookAt(CONFIG.CAMERA.LOOK_AT);
        this.scene.add(this.camera);

        // Lighting (Ambient for overall visibility, Directional for some definition if needed)
        const ambientLight = new THREE.AmbientLight(0x404040, 1); 
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // OrbitControls setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 0.1; 
        this.controls.maxDistance = CONFIG.STARFIELD.RADIUS / 10; 
        
        // Add event listeners for user interaction
        this.controls.addEventListener('start', () => {
            this.userControlActive = true;
            this.lastUserInteractionTime = Date.now();
            this.userCameraPosition = this.camera.position.clone();
            this.userControlsTarget = this.controls.target.clone();
        });
        
        this.controls.addEventListener('change', () => {
            this.lastUserInteractionTime = Date.now();
        });

        // Create Sun
        const sun = new Sun();
        this.solarSystem.addBody(sun);
        if (sun.mesh) {
            if (sun.mesh.material) this.materialsToDispose.push(sun.mesh.material);
            if (sun.mesh.geometry) this.geometriesToDispose.push(sun.mesh.geometry);
        }
        
        // Create Mercury with Sun's position
        const sunPosition = this.solarSystem.getBody('Sun') ? this.solarSystem.getBody('Sun').getObject().position : new THREE.Vector3(0, 0, 0);
        const mercury = new Mercury(sunPosition);
        this.solarSystem.addBody(mercury);
        mercury.createOrbitPath(this.scene);
        if (mercury.mesh) {
            if (mercury.mesh.material) this.materialsToDispose.push(mercury.mesh.material);
            if (mercury.mesh.geometry) this.geometriesToDispose.push(mercury.mesh.geometry);
        }

        // Create Venus
        const venus = new Venus(sunPosition);
        this.solarSystem.addBody(venus);
        venus.createOrbitPath(this.scene);
        if (venus.mesh) {
            if (venus.mesh.material) this.materialsToDispose.push(venus.mesh.material);
            if (venus.mesh.geometry) this.geometriesToDispose.push(venus.mesh.geometry);
        }

        // Create Earth
        const earth = new Earth(sunPosition);
        this.solarSystem.addBody(earth);
        earth.createOrbitPath(this.scene);
        if (earth.mesh) {
            if (earth.mesh.material) this.materialsToDispose.push(earth.mesh.material);
            if (earth.mesh.geometry) this.geometriesToDispose.push(earth.mesh.geometry);
        }

        // Create Earth's Moon
        const moon = new Moon(earth.getObject().position);
        this.solarSystem.addBody(moon);
        moon.createOrbitPath(this.scene);
        earth.moon = moon;
        if (moon.mesh) {
            if (moon.mesh.material) this.materialsToDispose.push(moon.mesh.material);
            if (moon.mesh.geometry) this.geometriesToDispose.push(moon.mesh.geometry);
        }
        
        // Create Mars
        const mars = new Mars(sunPosition);
        this.solarSystem.addBody(mars);
        mars.createOrbitPath(this.scene);
        if (mars.mesh) {
            if (mars.mesh.material) this.materialsToDispose.push(mars.mesh.material);
            if (mars.mesh.geometry) this.geometriesToDispose.push(mars.mesh.geometry);
        }
        
        // Create Mars's moon Phobos
        const phobos = new Phobos(mars.getObject().position);
        this.solarSystem.addBody(phobos);
        phobos.createOrbitPath(this.scene);
        mars.addMoon(phobos);
        if (phobos.mesh) {
            if (phobos.mesh.material) this.materialsToDispose.push(phobos.mesh.material);
            if (phobos.mesh.geometry) this.geometriesToDispose.push(phobos.mesh.geometry);
        }
        
        // Create Mars's moon Deimos
        const deimos = new Deimos(mars.getObject().position);
        this.solarSystem.addBody(deimos);
        deimos.createOrbitPath(this.scene);
        mars.addMoon(deimos);
        if (deimos.mesh) {
            if (deimos.mesh.material) this.materialsToDispose.push(deimos.mesh.material);
            if (deimos.mesh.geometry) this.geometriesToDispose.push(deimos.mesh.geometry);
        }

        // Create Starfield
        this.starfield = new Starfield(this.scene);
        if (this.starfield.stars) {
            if (this.starfield.stars.material) this.materialsToDispose.push(this.starfield.stars.material);
            if (this.starfield.stars.geometry) this.geometriesToDispose.push(this.starfield.stars.geometry);
        }

        // Post-processing for Bloom Effect (Sun Glow)
        if (CONFIG.BLOOM_EFFECT.enabled) {
            this.setupPostProcessing();
        }

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        document.getElementById('resetCameraButton').addEventListener('click', this.resetCamera.bind(this));
        
        // Setup UI controls
        this.setupUIControls();

        // Hide loading screen and start animation
        document.getElementById('loadingScreen').style.display = 'none';
        this.animate();

        console.log("Solar System Initialized. Scene graph:", this.scene);
    }
    
    setupUIControls() {
        // Create Play/Pause button
        const playPauseButton = document.createElement('button');
        playPauseButton.id = 'playPauseButton';
        playPauseButton.className = 'control-button';
        playPauseButton.textContent = 'Pause';
        playPauseButton.addEventListener('click', () => {
            const isPlaying = CONFIG.ANIMATION.enabled;
            CONFIG.ANIMATION.enabled = !isPlaying;
            this.solarSystem.toggleAnimation(!isPlaying);
            playPauseButton.textContent = !isPlaying ? 'Pause' : 'Play';
        });
        document.getElementById('controls').appendChild(playPauseButton);
        
        // Create Toggle Orbit Paths button
        const toggleOrbitPathsButton = document.createElement('button');
        toggleOrbitPathsButton.id = 'toggleOrbitPathsButton';
        toggleOrbitPathsButton.className = 'control-button';
        toggleOrbitPathsButton.textContent = 'Hide Orbit Paths';
        let orbitPathsVisible = true;
        toggleOrbitPathsButton.addEventListener('click', () => {
            orbitPathsVisible = !orbitPathsVisible;
            this.solarSystem.toggleOrbitPaths(orbitPathsVisible);
            toggleOrbitPathsButton.textContent = orbitPathsVisible ? 'Hide Orbit Paths' : 'Show Orbit Paths';
        });
        document.getElementById('controls').appendChild(toggleOrbitPathsButton);
        
        // Create Toggle Labels button
        const toggleLabelsButton = document.createElement('button');
        toggleLabelsButton.id = 'toggleLabelsButton';
        toggleLabelsButton.className = 'control-button';
        toggleLabelsButton.textContent = 'Hide Labels';
        let labelsVisible = true;
        toggleLabelsButton.addEventListener('click', () => {
            labelsVisible = !labelsVisible;
            this.solarSystem.toggleLabels(labelsVisible);
            toggleLabelsButton.textContent = labelsVisible ? 'Hide Labels' : 'Show Labels';
        });
        document.getElementById('controls').appendChild(toggleLabelsButton);
        
        // Create Focus dropdown
        const focusContainer = document.createElement('div');
        focusContainer.className = 'focus-container';
        
        const focusLabel = document.createElement('span');
        focusLabel.textContent = 'Focus on: ';
        focusLabel.className = 'focus-label';
        focusContainer.appendChild(focusLabel);
        
        const focusDropdown = document.createElement('select');
        focusDropdown.id = 'focusDropdown';
        focusDropdown.className = 'focus-dropdown';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a body';
        focusDropdown.appendChild(defaultOption);
        
        const sunOption = document.createElement('option');
        sunOption.value = 'Sun';
        sunOption.textContent = 'Sun';
        focusDropdown.appendChild(sunOption);
        
        const mercuryOption = document.createElement('option');
        mercuryOption.value = 'Mercury';
        mercuryOption.textContent = 'Mercury';
        focusDropdown.appendChild(mercuryOption);
        
        const venusOption = document.createElement('option');
        venusOption.value = 'Venus';
        venusOption.textContent = 'Venus';
        focusDropdown.appendChild(venusOption);
        
        const earthOption = document.createElement('option');
        earthOption.value = 'Earth';
        earthOption.textContent = 'Earth';
        focusDropdown.appendChild(earthOption);
        
        const moonOption = document.createElement('option');
        moonOption.value = 'Moon';
        moonOption.textContent = 'Moon';
        focusDropdown.appendChild(moonOption);
        
        const marsOption = document.createElement('option');
        marsOption.value = 'Mars';
        marsOption.textContent = 'Mars';
        focusDropdown.appendChild(marsOption);
        
        const phobosOption = document.createElement('option');
        phobosOption.value = 'Phobos';
        phobosOption.textContent = 'Phobos (Mars Moon)';
        focusDropdown.appendChild(phobosOption);
        
        const deimosOption = document.createElement('option');
        deimosOption.value = 'Deimos';
        deimosOption.textContent = 'Deimos (Mars Moon)';
        focusDropdown.appendChild(deimosOption);
        
        focusDropdown.addEventListener('change', (event) => {
            const selectedBody = event.target.value;
            if (selectedBody) {
                this.focusOnBody(selectedBody);
            }
        });
        
        focusContainer.appendChild(focusDropdown);
        document.getElementById('controls').appendChild(focusContainer);
        
        const style = document.createElement('style');
        style.textContent = `
            .focus-container {
                display: inline-flex;
                align-items: center;
                margin-left: 10px;
            }
            .focus-label {
                margin-right: 5px;
                color: white;
            }
            .focus-dropdown {
                padding: 5px;
                border-radius: 4px;
                background-color: #333;
                color: white;
                border: 1px solid #555;
            }
            .focus-dropdown option {
                background-color: #333;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
    
    focusOnBody(bodyName) {
        const body = this.solarSystem.getBody(bodyName);
        if (body) {
            if (this.currentAnimation) {
                cancelAnimationFrame(this.currentAnimation);
                this.currentAnimation = null;
            }
            
            this.focusedBody = body;
            
            this.userControlActive = false;
            this.userCameraPosition = null;
            this.userControlsTarget = null;
            
            const dropdown = document.getElementById('focusDropdown');
            if (dropdown) {
                dropdown.value = bodyName;
            }
            
            const bodyPosition = body.getObject().position.clone();
            
            const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
            
            let screenRatio;
            if (bodyName === 'Sun') {
                screenRatio = 0.4; 
            } else if (bodyName === 'Mercury') {
                screenRatio = 0.6; 
            } else if (bodyName === 'Venus') {
                screenRatio = 0.6; 
            } else if (bodyName === 'Earth') {
                screenRatio = 0.6; 
            } else if (bodyName === 'Moon') {
                screenRatio = 0.6; 
            } else if (bodyName === 'Mars') {
                screenRatio = 0.6; 
            } else if (bodyName === 'Phobos') {
                screenRatio = 0.6; 
            } else if (bodyName === 'Deimos') {
                screenRatio = 0.6; 
            } else {
                screenRatio = 0.5; 
            }
            
            const distance = (body.radius / screenRatio) / Math.tan(fovRadians / 2);
            
            const targetPosition = new THREE.Vector3(
                bodyPosition.x + distance * 0.2, 
                bodyPosition.y + distance * 0.2, 
                bodyPosition.z + distance
            );
            
            this.animateCameraToPosition(targetPosition, bodyPosition, 1500);
        }
    }
    
    updateCameraFocus(forceUpdate = false) {
        if (!this.focusedBody) return;
        
        if (this.userControlActive && !forceUpdate) {
            const currentTime = Date.now();
            if (currentTime - this.lastUserInteractionTime < this.userControlTimeout) {
                return; 
            } else {
                this.userControlActive = false;
            }
        }
        
        const bodyPosition = this.focusedBody.getObject().position.clone();
        
        const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
        
        let screenRatio;
        if (this.focusedBody.name === 'Sun') {
            screenRatio = 0.4; 
        } else if (this.focusedBody.name === 'Mercury') {
            screenRatio = 0.6; 
        } else if (this.focusedBody.name === 'Venus') {
            screenRatio = 0.6; 
        } else if (this.focusedBody.name === 'Earth') {
            screenRatio = 0.6; 
        } else if (this.focusedBody.name === 'Moon') {
            screenRatio = 0.6; 
        } else if (this.focusedBody.name === 'Mars') {
            screenRatio = 0.6; 
        } else if (this.focusedBody.name === 'Phobos') {
            screenRatio = 0.6; 
        } else if (this.focusedBody.name === 'Deimos') {
            screenRatio = 0.6; 
        } else {
            screenRatio = 0.5; 
        }
        
        const distance = (this.focusedBody.radius / screenRatio) / Math.tan(fovRadians / 2);
        
        const cameraPosition = new THREE.Vector3(
            bodyPosition.x + distance * 0.2, 
            bodyPosition.y + distance * 0.2, 
            bodyPosition.z + distance
        );
        
        const transitionSpeed = forceUpdate ? 0.5 : 0.05;
        
        this.camera.position.lerp(cameraPosition, transitionSpeed);
        this.controls.target.lerp(bodyPosition, transitionSpeed);
        this.controls.update();
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            CONFIG.BLOOM_EFFECT.strength,
            CONFIG.BLOOM_EFFECT.radius,
            CONFIG.BLOOM_EFFECT.threshold
        );
        this.composer.addPass(this.bloomPass);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    resetCamera() {
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation);
            this.currentAnimation = null;
        }
        
        this.focusedBody = null;
        
        const dropdown = document.getElementById('focusDropdown');
        if (dropdown) {
            dropdown.value = '';
        }
        
        let maxOrbitRadius = 0;
        this.solarSystem.celestialBodies.forEach(body => {
            if (body.orbitRadius && body.orbitRadius > maxOrbitRadius) {
                maxOrbitRadius = body.orbitRadius;
            }
        });
        
        const viewRadius = maxOrbitRadius * 1.5;
        const resetPosition = new THREE.Vector3(viewRadius * 0.5, viewRadius * 0.5, viewRadius);
        
        this.animateCameraToPosition(resetPosition, new THREE.Vector3(0, 0, 0), 1500);
    }
    
    animateCameraToPosition(targetPosition, targetLookAt, duration) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        
        const startTime = Date.now();
        
        const animateReset = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                this.camera.position.lerpVectors(startPosition, targetPosition, progress);
                this.controls.target.lerpVectors(startTarget, targetLookAt, progress);
                this.controls.update();
                
                this.currentAnimation = requestAnimationFrame(animateReset);
            } else {
                this.camera.position.copy(targetPosition);
                this.controls.target.copy(targetLookAt);
                this.controls.update();
                this.currentAnimation = null; 
            }
        };
        
        animateReset();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const time = this.clock.getElapsedTime();
        const deltaTime = this.clock.getDelta();
        
        // Get the Sun for lighting updates
        const sun = this.solarSystem.getSun();
        const sunPosition = sun ? sun.objectGroup.position.clone() : new THREE.Vector3(0, 0, 0);
        
        // Update all celestial bodies
        const celestialBodies = this.solarSystem.getBodies();
        celestialBodies.forEach(body => {
            // Skip the sun
            if (body === sun) return;
            
            // Update the body with the sun's position for lighting
            if (body.setSunPosition && sun) {
                body.setSunPosition(sunPosition);
            }
            
            // Update the body's position
            body.update(deltaTime);
            
            // Update sun position in shader materials for accurate lighting
            if (body.mesh && body.mesh.material && body.mesh.material.uniforms && 
                body.mesh.material.uniforms.sunPosition && sun) {
                body.mesh.material.uniforms.sunPosition.value.copy(sunPosition);
            }
            
            // If the body has moons, update their positions relative to their parent
            if (body.moons && body.moons.length > 0) {
                body.moons.forEach(moon => {
                    if (moon.setSunPosition && sun) {
                        moon.setSunPosition(sunPosition);
                    }
                    moon.update(deltaTime);
                });
            }
        });
        
        // Update starfield if it exists
        if (this.starfield) {
            this.starfield.update(deltaTime, this.camera.position);
        }
        
        // Check for camera focus updates if user is not controlling
        if (!this.userControlActive) {
            this.updateCameraFocus();
        }
        
        // Update controls and render
        this.controls.update();
        
        // Use composer for bloom effects if available
        if (this.composer && CONFIG.BLOOM_EFFECT.enabled) {
            this.composer.render(deltaTime);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    cleanup() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        document.getElementById('resetCameraButton').removeEventListener('click', this.resetCamera.bind(this));

        this.controls.dispose();

        this.materialsToDispose.forEach(material => material.dispose());
        this.geometriesToDispose.forEach(geometry => geometry.dispose());

        this.scene.traverse(object => {
            if (object.isMesh || object.isPoints) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
        console.log("App cleaned up.");
    }
}
