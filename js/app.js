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
import { Starfield } from './classes/Starfield.js';

/**
 * Main application class for the 3D solar system
 */
export class App {
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
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background if needed
        this.controls = null;
        this.solarSystem = new SolarSystem(this.scene);
        this.starfield = null;
        this.clock = new THREE.Clock();
        this.composer = null; // For post-processing
        this.bloomPass = null;

        this.materialsToDispose = []; // For cleanup
        this.geometriesToDispose = [];

        this.focusedBody = null; // Store the focused body for continuous tracking
        this.userPanned = false; // Flag to track user panning
        this.userControlActive = false; // Flag for active user control
        this.lastUserInteractionTime = 0; // Track when user last interacted
        this.userControlTimeout = 5000; // 5 seconds timeout for user control
        this.userCameraPosition = null; // Store the camera position when user starts controlling
        this.userControlsTarget = null; // Store the controls target when user starts controlling

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
        const ambientLight = new THREE.AmbientLight(0x404040, 1); // Soft white light
        this.scene.add(ambientLight);
        // A subtle directional light can help define shapes if not using pure emissive materials
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // OrbitControls setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 0.1; // Allow extremely close zooming
        this.controls.maxDistance = CONFIG.STARFIELD.RADIUS / 10; // Don't zoom too far out
        
        // Add event listeners for user interaction
        this.controls.addEventListener('start', () => {
            this.userControlActive = true;
            this.lastUserInteractionTime = Date.now();
            // Store the current camera position and target when user starts controlling
            this.userCameraPosition = this.camera.position.clone();
            this.userControlsTarget = this.controls.target.clone();
        });
        
        this.controls.addEventListener('change', () => {
            // Update the last interaction time whenever the controls change
            this.lastUserInteractionTime = Date.now();
        });

        // Create Sun
        const sun = new Sun();
        this.solarSystem.addBody(sun);
        // Collect materials and geometries for disposal
        if (sun.mesh) {
            if (sun.mesh.material) this.materialsToDispose.push(sun.mesh.material);
            if (sun.mesh.geometry) this.geometriesToDispose.push(sun.mesh.geometry);
        }
        
        // Create Mercury
        const mercury = new Mercury();
        this.solarSystem.addBody(mercury);
        // Create Mercury's orbit path after adding it to the scene
        mercury.createOrbitPath(this.scene);
        // Collect materials and geometries for disposal
        if (mercury.mesh) {
            if (mercury.mesh.material) this.materialsToDispose.push(mercury.mesh.material);
            if (mercury.mesh.geometry) this.geometriesToDispose.push(mercury.mesh.geometry);
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
        
        // Create Focus on Mercury button
        const focusMercuryButton = document.createElement('button');
        focusMercuryButton.id = 'focusMercuryButton';
        focusMercuryButton.className = 'control-button';
        focusMercuryButton.textContent = 'Focus on Mercury';
        focusMercuryButton.addEventListener('click', () => {
            this.focusOnBody('Mercury');
        });
        document.getElementById('controls').appendChild(focusMercuryButton);
    }
    
    focusOnBody(bodyName) {
        const body = this.solarSystem.getBody(bodyName);
        if (body) {
            // Store the focused body for continuous tracking
            this.focusedBody = body;
            
            // Reset user control flags
            this.userControlActive = false;
            this.userCameraPosition = null;
            this.userControlsTarget = null;
            
            // Set initial camera position
            this.updateCameraFocus(true); // Force immediate update
        }
    }
    
    updateCameraFocus(forceUpdate = false) {
        // If no body is focused or user is actively controlling the camera, don't update
        if (!this.focusedBody) return;
        
        // If user is actively controlling and it hasn't timed out, don't update
        if (this.userControlActive && !forceUpdate) {
            // Check if user interaction has timed out
            const currentTime = Date.now();
            if (currentTime - this.lastUserInteractionTime < this.userControlTimeout) {
                return; // User is still in control, don't update camera
            } else {
                // User control has timed out, resume automatic tracking
                this.userControlActive = false;
            }
        }
        
        const bodyPosition = this.focusedBody.getObject().position.clone();
        
        // Calculate the distance needed to make the body occupy ~99% of the screen
        // Using the field of view and the body's radius to calculate the appropriate distance
        const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
        const screenRatio = 0.99; // We want the body to occupy 99% of the screen height
        
        // Calculate distance based on the desired screen ratio and FOV
        // tan(fov/2) = (radius/screenRatio) / distance
        // distance = (radius/screenRatio) / tan(fov/2)
        const distance = (this.focusedBody.radius / screenRatio) / Math.tan(fovRadians / 2);
        
        // Set a position that's extremely close to the body with minimal offset
        const cameraPosition = new THREE.Vector3(
            bodyPosition.x + distance * 0.005, // Extremely minimal offset for centered view
            bodyPosition.y + distance * 0.005, // Extremely minimal offset for centered view
            bodyPosition.z + distance
        );
        
        // Determine transition speed based on whether this is a forced update
        const transitionSpeed = forceUpdate ? 0.5 : 0.05;
        
        // Smoothly move camera to the new position
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
        this.controls.reset(); // Resets to the target and position when controls were first created
        // For a more explicit reset:
        this.camera.position.copy(CONFIG.CAMERA.INITIAL_POSITION);
        this.camera.lookAt(CONFIG.CAMERA.LOOK_AT);
        this.controls.target.copy(CONFIG.CAMERA.LOOK_AT);
        this.controls.update();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta();

        this.controls.update(); // Only required if enableDamping or autoRotate are set to true
        this.solarSystem.update(deltaTime);
        if (this.starfield) {
            this.starfield.update(deltaTime, this.camera.position);
        }

        // Update camera focus if a body is focused and user is not actively controlling
        if (!this.userControlActive) {
            this.updateCameraFocus();
        }

        if (this.composer && CONFIG.BLOOM_EFFECT.enabled) {
            this.composer.render(deltaTime);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Cleanup method for disposing resources when app is destroyed
    cleanup() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        document.getElementById('resetCameraButton').removeEventListener('click', this.resetCamera.bind(this));

        this.controls.dispose();

        // Dispose of materials and geometries
        this.materialsToDispose.forEach(material => material.dispose());
        this.geometriesToDispose.forEach(geometry => geometry.dispose());

        // Traverse scene to dispose all objects
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
