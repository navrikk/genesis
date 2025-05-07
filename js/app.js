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
import { getBodyData } from './utils/CelestialBodyData.js';

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
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
        
        // Info panel state
        this.selectedBody = null;
        this.infoPanel = null;
        
        // Audio player state
        this.soundtrack = null;
        this.isMuted = false;

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

        // Very minimal ambient light to prevent complete darkness
        const ambientLight = new THREE.AmbientLight(0x404040, 0.05); 
        this.scene.add(ambientLight);
        
        // Main sunlight (strong directional light from the Sun's position)
        const sunLight = new THREE.DirectionalLight(0xffffff, 3);
        sunLight.position.set(0, 0, 0); // Will be at Sun's position (origin)
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 1000;
        sunLight.shadow.bias = -0.001; // Reduce shadow artifacts
        this.scene.add(sunLight);

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
        // Setup info panel controls
        this.infoPanel = document.getElementById('infoPanel');
        document.getElementById('closeInfoPanel').addEventListener('click', () => {
            this.infoPanel.classList.add('hidden');
            this.selectedBody = null;
        });
        
        document.getElementById('focusBodyButton').addEventListener('click', () => {
            if (this.selectedBody) {
                this.focusOnBody(this.selectedBody);
            }
        });
        
        // Add raycaster for object selection
        this.setupObjectSelection();
        
        // Create Play/Pause button with icon
        const playPauseButton = document.createElement('button');
        playPauseButton.id = 'playPauseButton';
        playPauseButton.className = 'control-button control-tooltip';
        playPauseButton.setAttribute('data-tooltip', 'Pause Animation');
        
        // Create icon element
        const playPauseIcon = document.createElement('i');
        playPauseIcon.className = 'fas fa-pause';
        playPauseButton.appendChild(playPauseIcon);
        
        playPauseButton.addEventListener('click', () => {
            const isPlaying = CONFIG.ANIMATION.enabled;
            CONFIG.ANIMATION.enabled = !isPlaying;
            this.solarSystem.toggleAnimation(!isPlaying);
            
            // Update icon and tooltip based on state
            if (!isPlaying) {
                playPauseIcon.className = 'fas fa-pause';
                playPauseButton.setAttribute('data-tooltip', 'Pause Animation');
            } else {
                playPauseIcon.className = 'fas fa-play';
                playPauseButton.setAttribute('data-tooltip', 'Play Animation');
            }
        });
        document.getElementById('controls').appendChild(playPauseButton);
        
        // Create Toggle Orbit Paths button with icon
        const toggleOrbitPathsButton = document.createElement('button');
        toggleOrbitPathsButton.id = 'toggleOrbitPathsButton';
        toggleOrbitPathsButton.className = 'control-button control-tooltip active';
        toggleOrbitPathsButton.setAttribute('data-tooltip', 'Hide Orbit Paths');
        
        // Create icon element
        const orbitPathsIcon = document.createElement('i');
        orbitPathsIcon.className = 'fas fa-circle-notch';
        toggleOrbitPathsButton.appendChild(orbitPathsIcon);
        
        let orbitPathsVisible = true;
        toggleOrbitPathsButton.addEventListener('click', () => {
            orbitPathsVisible = !orbitPathsVisible;
            this.solarSystem.toggleOrbitPaths(orbitPathsVisible);
            
            // Update tooltip and active state based on visibility
            if (orbitPathsVisible) {
                toggleOrbitPathsButton.setAttribute('data-tooltip', 'Hide Orbit Paths');
                toggleOrbitPathsButton.classList.add('active');
            } else {
                toggleOrbitPathsButton.setAttribute('data-tooltip', 'Show Orbit Paths');
                toggleOrbitPathsButton.classList.remove('active');
            }
        });
        document.getElementById('controls').appendChild(toggleOrbitPathsButton);
        
        // Setup audio controls
        this.soundtrack = document.getElementById('soundtrack');
        const muteButton = document.getElementById('muteButton');
        
        // Initialize soundtrack to play when loaded
        this.soundtrack.volume = 0.5; // Set initial volume to 50%
        
        // Play soundtrack when the page is loaded
        // Using a promise to handle autoplay restrictions in modern browsers
        const playPromise = this.soundtrack.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Soundtrack started playing');
            }).catch(error => {
                console.log('Autoplay prevented by browser. User interaction required to play audio.');
                // We'll set a flag to try playing again after user interaction
                this.soundtrack.setAttribute('data-autoplay-failed', 'true');
            });
        }
        
        // Setup mute button functionality
        muteButton.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            
            if (this.isMuted) {
                this.soundtrack.pause();
                muteButton.querySelector('i').className = 'fas fa-volume-mute';
                muteButton.setAttribute('data-tooltip', 'Unmute Sound');
                muteButton.classList.add('muted');
            } else {
                this.soundtrack.play().catch(error => {
                    console.log('Failed to play audio:', error);
                });
                muteButton.querySelector('i').className = 'fas fa-volume-up';
                muteButton.setAttribute('data-tooltip', 'Mute Sound');
                muteButton.classList.remove('muted');
            }
        });
        
        // Try to play audio after first user interaction if autoplay was prevented
        document.addEventListener('click', () => {
            if (this.soundtrack.getAttribute('data-autoplay-failed') === 'true' && !this.isMuted) {
                this.soundtrack.play().then(() => {
                    this.soundtrack.removeAttribute('data-autoplay-failed');
                }).catch(error => {
                    console.log('Still unable to play audio after user interaction:', error);
                });
            }
        }, { once: true });
        
        // Labels have been removed from the system
        
        // Create Focus button with dropdown
        const focusButton = document.createElement('button');
        focusButton.id = 'focusButton';
        focusButton.className = 'control-button control-tooltip';
        focusButton.setAttribute('data-tooltip', 'Focus on Body');
        
        // Create icon element
        const focusIcon = document.createElement('i');
        focusIcon.className = 'fas fa-crosshairs';
        focusButton.appendChild(focusIcon);
        
        // Create dropdown container that will appear on hover/click
        const focusContainer = document.createElement('div');
        focusContainer.className = 'focus-container';
        
        // Create list of celestial bodies as clickable items instead of a dropdown
        const celestialBodiesList = [
            { name: 'Sun', icon: 'fa-sun' },
            { name: 'Mercury', icon: 'fa-circle' },
            { name: 'Venus', icon: 'fa-circle' },
            { name: 'Earth', icon: 'fa-earth-americas' },
            { name: 'Moon', icon: 'fa-moon' },
            { name: 'Mars', icon: 'fa-circle' },
            { name: 'Phobos', icon: 'fa-circle' },
            { name: 'Deimos', icon: 'fa-circle' }
        ];
        
        // Create clickable items for each celestial body
        celestialBodiesList.forEach(body => {
            const bodyOption = document.createElement('div');
            bodyOption.className = 'focus-option';
            bodyOption.innerHTML = `<i class="fas ${body.icon}"></i> ${body.name}`;
            bodyOption.addEventListener('click', () => {
                this.focusOnBody(body.name);
                // Hide dropdown after selection
                focusButton.blur();
            });
            focusContainer.appendChild(bodyOption);
        });
        
        // Append the dropdown to the focus button
        focusButton.appendChild(focusContainer);
        document.getElementById('controls').appendChild(focusButton);
        
        // Zoom buttons have been removed
    }
    
    /**
     * Setup object selection with raycaster
     */
    setupObjectSelection() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Variables for tracking double-click
        let lastClickTime = 0;
        let lastClickedBody = null;
        const doubleClickThreshold = 300; // milliseconds
        
        // Add click event listener
        window.addEventListener('click', (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, this.camera);
            
            // Get all celestial body meshes
            const celestialBodies = this.solarSystem.getBodies();
            const meshes = [];
            
            celestialBodies.forEach(body => {
                if (body.mesh) {
                    meshes.push(body.mesh);
                }
            });
            
            // Check for intersections
            const intersects = raycaster.intersectObjects(meshes);
            
            if (intersects.length > 0) {
                const selectedMesh = intersects[0].object;
                const selectedBody = celestialBodies.find(body => body.mesh === selectedMesh);
                
                if (selectedBody) {
                    const currentTime = new Date().getTime();
                    const timeDiff = currentTime - lastClickTime;
                    
                    // Check if this is a double-click on the same body
                    if (timeDiff < doubleClickThreshold && lastClickedBody === selectedBody.name) {
                        // Double-click detected
                        this.showBodyInfo(selectedBody.name);
                        // Focus on the selected body
                        this.focusOnBody(selectedBody.name);
                    }
                    
                    // Update tracking variables for next click
                    lastClickTime = currentTime;
                    lastClickedBody = selectedBody.name;
                }
            }
        });
    }
    
    /**
     * Show celestial body information in the info panel
     * @param {string} bodyName - Name of the celestial body
     */
    showBodyInfo(bodyName) {
        this.selectedBody = bodyName;
        const bodyData = getBodyData(bodyName);
        
        // Update info panel content
        document.getElementById('bodyName').textContent = bodyData.name;
        document.getElementById('bodyRadius').textContent = bodyData.radius;
        document.getElementById('bodyMass').textContent = bodyData.mass;
        document.getElementById('bodyGravity').textContent = bodyData.gravity;
        document.getElementById('bodyTemp').textContent = bodyData.temperature;
        document.getElementById('bodyOrbitRadius').textContent = bodyData.orbitRadius;
        document.getElementById('bodyOrbitPeriod').textContent = bodyData.orbitPeriod;
        document.getElementById('bodyRotation').textContent = bodyData.rotationPeriod;
        document.getElementById('bodyDescription').textContent = bodyData.description;
        
        // Show the panel
        this.infoPanel.classList.remove('hidden');
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
            
            // Show body info immediately when focusing
            this.showBodyInfo(bodyName);
            
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
                screenRatio = 0.15; // Reduced ratio to zoom out more for better visibility
            } else if (bodyName === 'Deimos') {
                screenRatio = 0.15; // Reduced ratio to zoom out more for better visibility
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
