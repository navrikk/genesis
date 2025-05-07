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
        this.currentAnimation = null; // Store the current animation ID

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
        
        // Add options for all celestial bodies
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a body';
        focusDropdown.appendChild(defaultOption);
        
        // Add options for Sun and Mercury
        const sunOption = document.createElement('option');
        sunOption.value = 'Sun';
        sunOption.textContent = 'Sun';
        focusDropdown.appendChild(sunOption);
        
        const mercuryOption = document.createElement('option');
        mercuryOption.value = 'Mercury';
        mercuryOption.textContent = 'Mercury';
        focusDropdown.appendChild(mercuryOption);
        
        // Add event listener to the dropdown
        focusDropdown.addEventListener('change', (event) => {
            const selectedBody = event.target.value;
            if (selectedBody) {
                this.focusOnBody(selectedBody);
            }
        });
        
        focusContainer.appendChild(focusDropdown);
        document.getElementById('controls').appendChild(focusContainer);
        
        // Add some CSS for the dropdown
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
            // Cancel any ongoing animations
            if (this.currentAnimation) {
                cancelAnimationFrame(this.currentAnimation);
                this.currentAnimation = null;
            }
            
            // Store the focused body for continuous tracking
            this.focusedBody = body;
            
            // Reset user control flags
            this.userControlActive = false;
            this.userCameraPosition = null;
            this.userControlsTarget = null;
            
            // Reset dropdown to default after selection (optional)
            const dropdown = document.getElementById('focusDropdown');
            if (dropdown) {
                // Keep the selected value to show the current focus
                dropdown.value = bodyName;
            }
            
            // Use a common animation approach for all bodies
            // This ensures consistent transitions between any bodies
            const bodyPosition = body.getObject().position.clone();
            
            // Calculate a distance that shows the body at a reasonable zoom level
            const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
            
            // Use different screen ratios for different bodies
            let screenRatio;
            if (bodyName === 'Sun') {
                screenRatio = 0.4; // Sun occupies 40% of screen height
            } else if (bodyName === 'Mercury') {
                screenRatio = 0.6; // Mercury occupies 60% of screen height
            } else {
                screenRatio = 0.5; // Default for other bodies
            }
            
            // Calculate the appropriate distance
            const distance = (body.radius / screenRatio) / Math.tan(fovRadians / 2);
            
            // Set a position with appropriate offset
            const targetPosition = new THREE.Vector3(
                bodyPosition.x + distance * 0.2, // Offset for a wider view
                bodyPosition.y + distance * 0.2, // Offset for a wider view
                bodyPosition.z + distance
            );
            
            // Animate to the new position
            this.animateCameraToPosition(targetPosition, bodyPosition, 1500);
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
        
        // Calculate the distance needed to make the body occupy the appropriate screen space
        const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
        
        // Use different screen ratios for different bodies
        let screenRatio;
        if (this.focusedBody.name === 'Sun') {
            screenRatio = 0.4; // Sun occupies 40% of screen height
        } else if (this.focusedBody.name === 'Mercury') {
            screenRatio = 0.6; // Mercury occupies 60% of screen height
        } else {
            screenRatio = 0.5; // Default for other bodies
        }
        
        // Calculate distance based on the desired screen ratio and FOV
        const distance = (this.focusedBody.radius / screenRatio) / Math.tan(fovRadians / 2);
        
        // Set a position that's offset from the body
        const cameraPosition = new THREE.Vector3(
            bodyPosition.x + distance * 0.2, // Wider offset for more context
            bodyPosition.y + distance * 0.2, // Wider offset for more context
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
        // Clear the focused body
        this.focusedBody = null;
        this.userControlActive = false;
        
        // Reset dropdown selection
        const dropdown = document.getElementById('focusDropdown');
        if (dropdown) {
            dropdown.value = '';
        }
        
        // Calculate a position that can view the entire solar system
        // Get the furthest planet's orbit radius
        let maxOrbitRadius = 0;
        this.solarSystem.celestialBodies.forEach(body => {
            if (body.orbitRadius && body.orbitRadius > maxOrbitRadius) {
                maxOrbitRadius = body.orbitRadius;
            }
        });
        
        // Add a buffer to ensure we can see everything
        const viewRadius = maxOrbitRadius * 1.5;
        
        // Set camera to an elevated position to see the orbital plane
        const resetPosition = new THREE.Vector3(
            viewRadius * 0.5,  // Offset in X to get an angled view
            viewRadius * 0.8,  // Elevated position to see the orbital plane
            viewRadius         // Distance from origin
        );
        
        // Animate to the reset position
        this.animateCameraToPosition(resetPosition, new THREE.Vector3(0, 0, 0), 1500);
    }
    
    animateCameraToPosition(targetPosition, targetLookAt, duration) {
        // Start position and target
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        
        // Animation variables
        const startTime = Date.now();
        
        // Create the animation function
        const animateReset = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                // Smoothly interpolate position and target
                this.camera.position.lerpVectors(startPosition, targetPosition, progress);
                this.controls.target.lerpVectors(startTarget, targetLookAt, progress);
                this.controls.update();
                
                // Continue animation
                this.currentAnimation = requestAnimationFrame(animateReset);
            } else {
                // Animation complete, set final position
                this.camera.position.copy(targetPosition);
                this.controls.target.copy(targetLookAt);
                this.controls.update();
                this.currentAnimation = null; // Clear animation ID when complete
            }
        };
        
        // Start the animation
        animateReset();
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
