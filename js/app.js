import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import CONFIG from "./config.js";
import { isWebGLAvailable, getWebGLDiagnostics } from "./utils/webgl-check.js";
import { SolarSystem } from "./classes/SolarSystem.js";
import { Sun } from "./classes/Sun.js";
import { Mercury } from "./classes/Mercury.js";
import { Venus } from "./classes/Venus.js";
import { Earth } from "./classes/Earth.js";
import { Moon } from "./classes/Moon.js";
import { Mars } from "./classes/Mars.js";
import { Phobos } from "./classes/Phobos.js";
import { Deimos } from "./classes/Deimos.js";
import { Starfield } from "./classes/Starfield.js";
import { MilkyWay } from "./classes/MilkyWay.js";
import { getBodyData } from "./utils/CelestialBodyData.js";

/**
 * Main application class for the 3D solar system
 */
export default class App {
  constructor() {
    // Check if WebGL is available
    const webGLAvailable = isWebGLAvailable();
    
    if (!webGLAvailable) {
      // Show WebGL compatibility error
      document.getElementById("webgl-compatibility").style.display = "flex";
      document.getElementById("loadingScreen").style.display = "none";
      console.error("WebGL is not supported or available.");
      return;
    } else {
      // Hide WebGL compatibility error
      document.getElementById("webgl-compatibility").style.display = "none";
    }

    this.container = document.getElementById("container");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA.NEAR,
      CONFIG.CAMERA.FAR,
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.controls = null;
    this.solarSystem = new SolarSystem(this.scene);
    this.starfield = null;
    this.milkyWay = null;
    this.clock = new THREE.Clock();
    this.composer = null;
    this.bloomPass = null;

    this.materialsToDispose = [];
    this.geometriesToDispose = [];

    this.focusedBody = null;
    this.userPanned = false;
    this.userControlActive = false;
    this.lastUserInteractionTime = 0;
    this.userControlTimeout = 200;
    this.userCameraPosition = null;
    this.userControlsTarget = null;
    this.currentAnimation = null;
    this.isSimulationPaused = false; // Flag to control simulation updates

    // Info panel state
    this.selectedBody = null;
    this.infoPanel = null;

    // Audio player state
    this.soundtrack = null;
    this.isMuted = false;

    // Time controls
    this.timeControlsPanel = null;
    this.playPauseButton = null;
    this.timeSeeker = null;
    this.goToTodayButton = null;

    // Controls visibility state
    this.areControlsVisible = false;
    this.bottomControlsPanel = null;
    this.toggleControlsButton = null;

    this.loadingManager = {
      assetsToLoad: 0,
      assetsLoaded: 0,
      onProgress: (item) => this.updateLoadingProgress(),
      onComplete: () => this.hideLoadingScreen(),
    };
    this.loadingScreenElement = document.getElementById("loadingScreen");

    this.init();
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CONFIG.BLOOM_EFFECT.strength,
      CONFIG.BLOOM_EFFECT.radius,
      CONFIG.BLOOM_EFFECT.threshold,
    );
    this.composer.addPass(this.bloomPass);
  }

  onWindowResize() {
    if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
  }

  init() {
    // Renderer setup
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
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
    this.controls.update(); // Update OrbitControls
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0.00001; // Significantly reduced for extreme close-ups on tiny objects
    this.controls.maxDistance = CONFIG.STARFIELD.RADIUS / 10;

    // Add event listeners for user interaction
    this.controls.addEventListener("start", () => {
      this.userControlActive = true;
      this.lastUserInteractionTime = Date.now();
      this.userCameraPosition = this.camera.position.clone();
      this.userControlsTarget = this.controls.target.clone();
    });

    this.controls.addEventListener("change", () => {
      this.lastUserInteractionTime = Date.now();
    });

    // Create a group for the solar system that will be initially invisible
    this.solarSystemGroup = new THREE.Group();
    this.scene.add(this.solarSystemGroup);
    this.solarSystemGroup.visible = false; // Hide until loading is complete
    
    // Ensure the scene is completely black during loading
    this.renderer.setClearColor(0x000000, 1.0); // Pure black background
    
    // Create Sun
    const sun = new Sun(this.solarSystemGroup); // Add to group instead of scene
    this.solarSystem.addBody(sun);
    if (sun.mesh) {
      if (sun.mesh.material) this.materialsToDispose.push(sun.mesh.material);
      if (sun.mesh.geometry) this.geometriesToDispose.push(sun.mesh.geometry);
    }

    // Mercury will orbit the origin by default (Sun's assumed position)
    const mercury = new Mercury(this.solarSystemGroup);
    this.solarSystem.addBody(mercury);
    if (mercury.mesh) {
      if (mercury.mesh.material)
        this.materialsToDispose.push(mercury.mesh.material);
      if (mercury.mesh.geometry)
        this.geometriesToDispose.push(mercury.mesh.geometry);
    }

    // Create Venus
    const venus = new Venus(this.solarSystemGroup);
    this.solarSystem.addBody(venus);
    if (venus.mesh) {
      if (venus.mesh.material)
        this.materialsToDispose.push(venus.mesh.material);
      if (venus.mesh.geometry)
        this.geometriesToDispose.push(venus.mesh.geometry);
    }

    // Create Earth
    const earth = new Earth(this.solarSystemGroup);
    this.solarSystem.addBody(earth);
    if (earth.mesh) {
      if (earth.mesh.material)
        this.materialsToDispose.push(earth.mesh.material);
      if (earth.mesh.geometry)
        this.geometriesToDispose.push(earth.mesh.geometry);
    }

    // Create Earth's Moon
    const moon = new Moon(earth);
    this.solarSystem.addBody(moon);
    if (moon.mesh) {
      if (moon.mesh.material) this.materialsToDispose.push(moon.mesh.material);
      if (moon.mesh.geometry) this.geometriesToDispose.push(moon.mesh.geometry);
    }

    // Create Mars
    const mars = new Mars(this.solarSystemGroup);
    this.solarSystem.addBody(mars);
    if (mars.mesh) {
      if (mars.mesh.material) this.materialsToDispose.push(mars.mesh.material);
      if (mars.mesh.geometry) this.geometriesToDispose.push(mars.mesh.geometry);
    }

    // Create Mars's moon Phobos
    const phobos = new Phobos(mars);
    this.solarSystem.addBody(phobos);
    if (phobos.mesh) {
      if (phobos.mesh.material)
        this.materialsToDispose.push(phobos.mesh.material);
      if (phobos.mesh.geometry)
        this.geometriesToDispose.push(phobos.mesh.geometry);
    }

    // Create Mars's moon Deimos
    const deimos = new Deimos(mars);
    this.solarSystem.addBody(deimos);
    if (deimos.mesh) {
      if (deimos.mesh.material)
        this.materialsToDispose.push(deimos.mesh.material);
      if (deimos.mesh.geometry)
        this.geometriesToDispose.push(deimos.mesh.geometry);
    }

    // Create Starfield
    this.starfield = new Starfield(
      this.scene,
      CONFIG.STARFIELD.RADIUS,
      CONFIG.STARFIELD.COUNT,
      CONFIG.STARFIELD.MIN_SIZE,
      CONFIG.STARFIELD.MAX_SIZE,
    );
    this.materialsToDispose.push(this.starfield.material);
    this.geometriesToDispose.push(this.starfield.geometry);

    // Create Milky Way backdrop if enabled
    if (CONFIG.STARFIELD.MILKY_WAY_ENABLED) {
      this.loadingManager.assetsToLoad++; // Register Milky Way
      this.milkyWay = new MilkyWay(this.scene, () => {
        this.loadingManager.assetsLoaded++;
        this.checkLoadingComplete();
      });
      if (this.milkyWay.mesh) { // Ensure mesh and material are added for disposal if created
        this.materialsToDispose.push(this.milkyWay.material);
        this.geometriesToDispose.push(this.milkyWay.geometry);
      }
    }

    // Event Listeners
    window.addEventListener("resize", this.onWindowResize.bind(this), false);

    // Setup UI controls
    this.setupUIControls();

    // Post-processing for Bloom Effect (Sun Glow)
    if (CONFIG.BLOOM_EFFECT.enabled) {
      this.setupPostProcessing();
    }

    // Start animation loop
    this.animate();

    // Check if loading is already complete
    this.checkLoadingComplete();
  } // End of init()

  setupUIControls() {
    this.infoPanel = document.getElementById("infoPanel");

    
    // Close info panel button
    document.getElementById("closeInfoPanel").addEventListener("click", () => {
      this.hideInfoPanel();
    });
    

    // Controls Visibility Setup
    this.bottomControlsPanel = document.getElementById("controls");
    this.toggleControlsButton = document.getElementById("toggleControlsButton");

    if (this.toggleControlsButton) {
      this.toggleControlsButton.innerHTML = '<i class="fas fa-eye"></i>';
      this.toggleControlsButton.setAttribute("data-tooltip", "Show Controls");
      
      this.toggleControlsButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleAllControlsVisibility();
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.areControlsVisible) {
        this.showAllControls();
      }
    });

    // Audio controls setup
    this.soundtrack = document.getElementById("soundtrack");
    const muteButton = document.getElementById("muteButton");

    this.soundtrack.volume = 0.5;

    // Handle autoplay restrictions in modern browsers
    const playPromise = this.soundtrack.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {})
        .catch((error) => {
          this.soundtrack.setAttribute("data-autoplay-failed", "true");
        });
    }

    // Mute button functionality
    muteButton.addEventListener("click", () => {
      this.isMuted = !this.isMuted;

      if (this.isMuted) {
        this.soundtrack.pause();
        muteButton.querySelector("i").className = "fas fa-volume-mute";
        muteButton.setAttribute("data-tooltip", "Unmute Sound");
        muteButton.classList.add("muted");
      } else {
        this.soundtrack.play().catch((error) => {
          console.error("Failed to play audio:", error);
        });
        muteButton.querySelector("i").className = "fas fa-volume-up";
        muteButton.setAttribute("data-tooltip", "Mute Sound");
        muteButton.classList.remove("muted");
      }
    });

    // Play audio after first user interaction if autoplay was prevented
    document.addEventListener(
      "click",
      () => {
        if (
          this.soundtrack.getAttribute("data-autoplay-failed") === "true" &&
          !this.isMuted
        ) {
          this.soundtrack
            .play()
            .then(() => {
              this.soundtrack.removeAttribute("data-autoplay-failed");
            })
            .catch((error) => {
              console.error(
                "Still unable to play audio after user interaction:",
                error,
              );
            });
        }
      },
      { once: true },
    );

    // Setup Fullscreen button
        const fullscreenButton = document.getElementById('fullscreenButton');
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            });

            document.addEventListener('fullscreenchange', () => {
                if (document.fullscreenElement) {
                    fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
                    fullscreenButton.setAttribute('data-tooltip', 'Exit Fullscreen');
                } else {
                    fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
                    fullscreenButton.setAttribute('data-tooltip', 'Enter Fullscreen');
                }
            });
        }

        // Create Focus button with dropdown
    const focusButton = document.createElement("button");
    focusButton.id = "focusButton";
    focusButton.className = "control-button control-tooltip";
    focusButton.setAttribute("data-tooltip", "Focus on Body");

    // Create icon element
    const focusIcon = document.createElement("i");
    focusIcon.className = "fas fa-crosshairs";
    focusButton.appendChild(focusIcon);

    // Create dropdown container that will appear on hover/click
    const focusContainer = document.createElement("div");
    focusContainer.className = "focus-container";

    // Create hierarchical list of celestial bodies
    const celestialBodiesHierarchy = [
      { name: "Sun", icon: "fa-sun" },
      { name: "Mercury", icon: "fa-circle" },
      { name: "Venus", icon: "fa-circle" },
      { 
        name: "Earth", 
        icon: "fa-earth-americas",
        moons: [
          { name: "Moon", icon: "fa-moon" }
        ]
      },
      { 
        name: "Mars", 
        icon: "fa-circle",
        moons: [
          { name: "Phobos", icon: "fa-circle" },
          { name: "Deimos", icon: "fa-circle" }
        ]
      },
    ];

    // Create hierarchical dropdown menu
    celestialBodiesHierarchy.forEach((body) => {
      if (body.moons && body.moons.length > 0) {
        // Create parent body option with submenu
        const parentOption = document.createElement("div");
        parentOption.className = "focus-option parent-option";
        parentOption.innerHTML = `<i class="fas ${body.icon}"></i> ${body.name} <i class="fas fa-chevron-right submenu-icon"></i>`;
        
        // Create submenu container
        const submenu = document.createElement("div");
        submenu.className = "submenu";
        
        // Add hover and click handlers for the parent body
        parentOption.addEventListener("mouseenter", (e) => {
          // Show submenu on hover
          submenu.classList.add("show-submenu");
        });
        
        parentOption.addEventListener("mouseleave", (e) => {
          // Hide submenu when mouse leaves the parent option
          // Only if not hovering over the submenu itself
          setTimeout(() => {
            if (!submenu.matches(':hover')) {
              submenu.classList.remove("show-submenu");
            }
          }, 100);
        });
        
        submenu.addEventListener("mouseleave", (e) => {
          // Hide submenu when mouse leaves the submenu
          setTimeout(() => {
            if (!parentOption.matches(':hover')) {
              submenu.classList.remove("show-submenu");
            }
          }, 100);
        });
        
        // Add click handler for the parent body
        parentOption.addEventListener("click", (e) => {
          // Only focus on body if clicked directly (not on submenu icon)
          if (!e.target.classList.contains("submenu-icon") && 
              !e.target.parentElement.classList.contains("submenu-icon")) {
            // Only call focusOnBody - showBodyInfo will be called after animation completes
            this.focusOnBody(body.name);
            focusButton.blur();
          }
          e.stopPropagation();
        });
        
        // Add moon options to submenu
        body.moons.forEach(moon => {
          const moonOption = document.createElement("div");
          moonOption.className = "focus-option moon-option";
          moonOption.innerHTML = `<i class="fas ${moon.icon}"></i> ${moon.name}`;
          moonOption.addEventListener("click", (e) => {
            e.stopPropagation();
            // Only call focusOnBody - showBodyInfo will be called after animation completes
            this.focusOnBody(moon.name);
            focusButton.blur();
          });
          submenu.appendChild(moonOption);
        });
        
        parentOption.appendChild(submenu);
        focusContainer.appendChild(parentOption);
      } else {
        // Create regular option for bodies without moons
        const bodyOption = document.createElement("div");
        bodyOption.className = "focus-option";
        bodyOption.innerHTML = `<i class="fas ${body.icon}"></i> ${body.name}`;
        bodyOption.addEventListener("click", () => {
          // Only call focusOnBody - showBodyInfo will be called after animation completes
          this.focusOnBody(body.name);
          focusButton.blur();
        });
        focusContainer.appendChild(bodyOption);
      }
    });

    // Append the dropdown to the focus button
    focusButton.appendChild(focusContainer);
    document.getElementById("controls").appendChild(focusButton);

    // Setup Reset Camera button
    const resetCameraButton = document.getElementById('resetCameraButton');
    if (resetCameraButton) {
      resetCameraButton.addEventListener('click', this.resetCamera.bind(this));
    }

    // Setup Toggle Orbits button
    const toggleOrbitsButton = document.getElementById('toggleOrbitsButton');
    if (toggleOrbitsButton) {
      // Set initial state to match orbitsVisible = false
      toggleOrbitsButton.innerHTML = '<i class="fas fa-circle-notch"></i>';
      toggleOrbitsButton.setAttribute('data-tooltip', 'Show Orbits');
      toggleOrbitsButton.classList.add('muted');
      
      toggleOrbitsButton.addEventListener('click', () => {
        this.solarSystem.toggleOrbits(!this.solarSystem.orbitsVisible);
        
        // Update tooltip and icon
        if (this.solarSystem.orbitsVisible) {
          toggleOrbitsButton.innerHTML = '<i class="fas fa-ban"></i>';
          toggleOrbitsButton.setAttribute('data-tooltip', 'Hide Orbits');
          toggleOrbitsButton.classList.remove('muted');
        } else {
          toggleOrbitsButton.innerHTML = '<i class="fas fa-circle-notch"></i>';
          toggleOrbitsButton.setAttribute('data-tooltip', 'Show Orbits');
          toggleOrbitsButton.classList.add('muted');
        }
      });
    }
    
    // Hide all controls initially using existing implementation
    this.hideAllControls();
  } // End of setupUIControls

  hideInfoPanel() {
    if (this.infoPanel) {
      this.infoPanel.classList.add("hidden");
    }
    // this.selectedBody = null; // Optional: clear selection when panel is hidden
  }

  toggleAllControlsVisibility() {
    if (this.areControlsVisible) {
      this.hideAllControls();
    } else {
      this.showAllControls();
    }
  }

  /**
   * Hides the info panel and shows the 'Show Details' button if a body is selected
   */
  hideInfoPanel() {
    this.infoPanel.classList.add("hidden");

  }

  hideAllControls() {
    if (this.bottomControlsPanel) {
      Array.from(this.bottomControlsPanel.children).forEach(child => {
        if (child !== this.toggleControlsButton) {
          child.classList.add("hidden");
        }
      });
    }
    
    if (this.timeControlsPanel) {
      this.timeControlsPanel.classList.add("hidden");
    }
    
    // Hide info panel
    this.infoPanel.classList.add("hidden");
    
    this.areControlsVisible = false;
    
    if (this.toggleControlsButton) {
      this.toggleControlsButton.innerHTML = '<i class="fas fa-eye"></i>';
      this.toggleControlsButton.setAttribute("data-tooltip", "Show Controls");
    }
    
    // Show the ESC notification
  }

  showAllControls() {
    if (this.bottomControlsPanel) {
      Array.from(this.bottomControlsPanel.children).forEach(child => {
        child.classList.remove("hidden");
      });
    }
    
    if (this.timeControlsPanel && this.focusedBody && this.focusedBody.name === "Sun") {
      this.timeControlsPanel.classList.remove("hidden");
    }
    

    
    this.areControlsVisible = true;
    
    if (this.toggleControlsButton) {
      this.toggleControlsButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
      this.toggleControlsButton.setAttribute("data-tooltip", "Hide Controls");
    }
  }

  updatePlayPauseButtonState() {
    if (!this.playPauseButton) return;

    if (this.isSimulationPaused) {
      this.playPauseButton.innerHTML = '<i class="fas fa-play"></i> Play';
    } else {
      this.playPauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
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
    window.addEventListener("click", (event) => {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the raycaster
      raycaster.setFromCamera(mouse, this.camera);

      // Get all celestial body meshes
      const celestialBodies = this.solarSystem.getBodies();
      const meshes = [];

      celestialBodies.forEach((body) => {
        if (body.mesh) {
          meshes.push(body.mesh);
        }
      });

      // Check for intersections
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const selectedMesh = intersects[0].object;
        const selectedBody = celestialBodies.find(
          (body) => body.mesh === selectedMesh,
        );

        if (selectedBody) {
          const currentTime = new Date().getTime();
          const timeDiff = currentTime - lastClickTime;

          // Check if this is a double-click on the same body
          if (
            timeDiff < doubleClickThreshold &&
            lastClickedBody === selectedBody.name
          ) {
            // Double-click detected
            // Only call focusOnBody - showBodyInfo will be called after animation completes
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
    document.getElementById("bodyName").textContent = bodyData.name;
    document.getElementById("bodyRadius").textContent = bodyData.radius;
    document.getElementById("bodyMass").textContent = bodyData.mass;
    document.getElementById("bodyGravity").textContent = bodyData.gravity;
    document.getElementById("bodyTemp").textContent = bodyData.temperature;
    document.getElementById("bodyOrbitRadius").textContent =
      bodyData.orbitRadius;
    document.getElementById("bodyOrbitPeriod").textContent =
      bodyData.orbitPeriod;
    document.getElementById("bodyRotation").textContent =
      bodyData.rotationPeriod;
    document.getElementById("bodyDescription").textContent =
      bodyData.description;

    // Prepare the panel for animation
    // We'll add a CSS class for the animation
    this.infoPanel.classList.remove("hidden");
    this.infoPanel.classList.add("animate-in");
    
    // Remove the animation class after the animation completes
    setTimeout(() => {
      this.infoPanel.classList.remove("animate-in");
    }, 500); // Match this to the CSS animation duration
  }

  focusOnBody(bodyName) {
    const body = this.solarSystem.getBody(bodyName);
    if (body) {
      if (this.currentAnimation) {
        cancelAnimationFrame(this.currentAnimation);
        this.currentAnimation = null;
      }

      this.focusedBody = body;
      this.userControlActive = false; // Reset user control flag

      // Get the world position of the body's visual object group
      const bodyObject = body.getObject();
      if (!bodyObject) return; // Should not happen if body exists
      const bodyPosition = bodyObject.getWorldPosition(new THREE.Vector3());

      // Check for NaN positions to prevent camera errors
      if (isNaN(bodyPosition.x) || isNaN(bodyPosition.y) || isNaN(bodyPosition.z)) {
        console.error(`Focus target ${bodyName} has NaN world position:`, bodyPosition.clone());
        console.error(`Body details: name=${body.name}, orbitalRadius=${body.orbitalRadius}, orbitAngle=${body.orbitAngle}, orbitalInclination=${body.orbitalInclination}, radius=${body.radius}`);
        if (body.parentBody && body.parentBody.getObject()) {
          const parentObject = body.parentBody.getObject();
          const parentPos = parentObject.getWorldPosition(new THREE.Vector3());
          console.error(`Parent ${body.parentBody.name} world position:`, parentPos.clone());
          console.error(`Parent details: name=${body.parentBody.name}, orbitalRadius=${body.parentBody.orbitalRadius}, orbitAngle=${body.parentBody.orbitAngle}, orbitalInclination=${body.parentBody.orbitalInclination}, radius=${body.parentBody.radius}`);
          console.error(`Parent ${body.parentBody.name} local position:`, parentObject.position.clone());
        }
        console.error(`Body ${bodyName} local position:`, bodyObject.position.clone());
        return; // Avoid focusing on NaN
      }

      // IMPORTANT: Set OrbitControls target immediately
      this.controls.target.copy(bodyPosition);

      const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
      let distance;

      if (bodyName === "Phobos") {
        const K_PHOBOS = 5.0; // Reasonable zoom level for Phobos
        distance = body.radius * K_PHOBOS;
        distance = Math.max(
          distance,
          body.radius * 2.0,
          CONFIG.CAMERA.NEAR * 2,
        );
      } else if (bodyName === "Deimos") {
        const K_DEIMOS = 5.0; // Reduced Deimos zoom slightly
        distance = body.radius * K_DEIMOS;
        distance = Math.max(
          distance,
          body.radius * 0.05,
          CONFIG.CAMERA.NEAR * 2,
        );
      } else {
        // For all bodies, use a consistent screen ratio (fraction of screen height the body should occupy)
        const screenRatio = 0.4; // Reduced zoom level for all celestial bodies
        distance = body.radius / screenRatio / Math.tan(fovRadians / 2);
      }

      // Define a consistent offset direction for the camera relative to the target
      const cameraOffsetDirection = new THREE.Vector3(0.3, 0.3, 1).normalize(); // Slight top-right perspective

      // Calculate the target camera position
      const targetCameraPosition = new THREE.Vector3()
        .copy(bodyPosition)
        .addScaledVector(cameraOffsetDirection, distance);

      // Simulation pause logic and time panel visibility
      if (bodyName === "Sun") {
        this.isSimulationPaused = false; // Default to playing when Sun is focused
        if (this.timeControlsPanel)
          this.timeControlsPanel.classList.remove("hidden");
        this.updatePlayPauseButtonState(); // Set initial button state for Sun focus
      } else {
        this.isSimulationPaused = true;
        if (this.timeControlsPanel)
          this.timeControlsPanel.classList.add("hidden");
      }

      // Hide info panel when focusing on any body
      if (this.infoPanel && this.infoPanel.classList) {
        this.infoPanel.classList.add("hidden");
      }

      // Store the body name for use in the callback
      const currentBodyName = bodyName;
      
      // Animate to the target position using the current camera position as the starting point
      // Using a longer duration (3000ms) for a slower, more gentle animation
      // After animation completes, show the body info panel
      this.animateCameraToPosition(targetCameraPosition, bodyPosition, 3000, () => {
        // Show the body info panel after camera animation completes
        this.showBodyInfo(currentBodyName);
      });
    } // This closes the 'if (body)' block
  }

  resetCamera() {
    if (this.currentAnimation) {
      cancelAnimationFrame(this.currentAnimation);
      this.currentAnimation = null;
    }

    // Focus on Sun without showing details panel
    const sun = this.solarSystem.getBody("Sun");
    if (sun) {
      // Always hide info panel when resetting camera
      this.hideInfoPanel();
      
      // Clear selected body
      this.selectedBody = null;
      
      this.focusedBody = sun;
      this.isSimulationPaused = false; // Ensure simulation runs when focused on Sun
      
      // Show time controls when focused on Sun
      if (this.timeControlsPanel) {
        this.timeControlsPanel.classList.remove("hidden");
      }
      
      // Reset dropdown selection
      const dropdown = document.getElementById("focusDropdown");
      if (dropdown) {
        dropdown.value = "Sun";
      }
      
      // Get Sun position
      const sunObject = sun.getObject();
      if (!sunObject) return;
      const sunPosition = sunObject.getWorldPosition(new THREE.Vector3());
      
      // Calculate appropriate distance for Sun view
      const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
      const screenRatio = 0.35; // Further reduced zoom for the Sun specifically
      const distance = sun.radius / screenRatio / Math.tan(fovRadians / 2);
      
      // Position the camera to show the Milky Way galaxy arms from the top-right
      // Using a direct approach rather than offset calculation for more precise positioning
      const targetCameraPosition = new THREE.Vector3(45, 15, 25); // Position camera even further to the right to show Milky Way arms
      
      // Ensure we're looking directly at the Sun
      const lookAtPosition = new THREE.Vector3().copy(sunPosition);
      
      // Animate to the Sun position with a slower animation
      this.animateCameraToPosition(
        targetCameraPosition,
        lookAtPosition,
        3000 // Duration in milliseconds - increased for slower animation
      );
    }
  }

  animateCameraToPosition(targetPosition, targetLookAt, duration, onComplete = null) {
    // Use the current camera position as the starting point
    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = Date.now();

    const animateReset = () => {
      const elapsed = Date.now() - startTime;
      const linearProgress = Math.min(elapsed / duration, 1);
      
      // Simple smooth easing function
      const easedProgress = linearProgress * (2 - linearProgress); // Quadratic ease-out

      if (linearProgress < 1) {
        // Camera position animation
        this.camera.position.lerpVectors(
          startPosition,
          targetPosition,
          easedProgress
        );
        
        // Camera target animation
        this.controls.target.lerpVectors(startTarget, targetLookAt, easedProgress);
        this.controls.update();

        this.currentAnimation = requestAnimationFrame(animateReset);
      } else {
        // Animation complete
        this.camera.position.copy(targetPosition);
        this.controls.target.copy(targetLookAt);
        this.controls.update();
        this.currentAnimation = null;
        
        // Call the completion callback if provided
        if (onComplete) onComplete();
      }
    };

    animateReset();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const deltaTime = this.clock.getDelta();

    // Get the Sun for lighting updates (assuming getSun() and getObject() are correctly implemented)
    const sun = this.solarSystem.getSun(); // Make sure solarSystem has getSun()
    let sunPosition = new THREE.Vector3(0, 0, 0); // Default sun position if not found
    if (sun && sun.getObject()) {
      // Make sure sun and its objectGroup exist
      sunPosition = sun.getObject().position.clone();
    }

    // Update all celestial bodies - only rotation, no orbit movement
    const celestialBodies = this.solarSystem.getBodies();
    celestialBodies.forEach((body) => {
      // Update only rotation
      body.update(deltaTime, false);
        
      // If using custom shaders that need sun position:
      if (
        body.mesh &&
        body.mesh.material &&
        body.mesh.material.uniforms &&
        body.mesh.material.uniforms.sunPosition
      ) {
        body.mesh.material.uniforms.sunPosition.value.copy(sunPosition);
      }
    });

    // Update starfield
    if (this.starfield) {
      this.starfield.update(deltaTime, this.camera.position);
    }
    
    // Update Milky Way backdrop
    if (this.milkyWay) {
      this.milkyWay.update(deltaTime);
    }

    // Update OrbitControls (should be done regardless of pause state for camera interaction)
    if (this.controls) {
      this.controls.update();
    }

    // Check for camera focus updates if user is not controlling
    if (!this.userControlActive) {
      this.updateCameraFocus();
    }

    // Render the scene
    if (CONFIG.BLOOM_EFFECT.enabled && this.composer) {
      this.composer.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateCameraFocus() {
    // Placeholder for camera focusing logic
    if (this.focusedBody && !this.userControlActive) {
      // Camera focus logic would go here if implemented
    }
  }

  cleanup() {
    window.removeEventListener("resize", this.onWindowResize.bind(this));

    const resetButton = document.getElementById("resetCameraButton");
    if (resetButton) {
      resetButton.removeEventListener("click", this.resetCamera.bind(this));
    }

    const bodyList = document.getElementById("celestialBodyList");
    if (bodyList) {
      bodyList.removeEventListener(
        "click",
        this.handleBodySelection.bind(this),
      );
    }

    if (this.controls) {
      this.controls.dispose();
    }

    this.materialsToDispose.forEach((material) => material.dispose());
    this.geometriesToDispose.forEach((geometry) => geometry.dispose());

    this.scene.traverse((object) => {
      if (object.isMesh || object.isPoints) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
      // Remove event listeners from objects if any were added
      // Clean up any additional event listeners here if needed
    });

    if (this.solarSystem) {
      this.solarSystem.cleanup(); // Ensure SolarSystem also cleans up its resources
    }

    if (this.starfield) {
      this.starfield.dispose();
    }
    
    if (this.milkyWay) {
      this.milkyWay.dispose();
    }

    if (this.composer) {
      this.composer.passes.forEach((pass) => {
        if (pass.dispose) pass.dispose();
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement,
        );
      }
    }

    // Clear arrays
    this.materialsToDispose = [];
    this.geometriesToDispose = [];
    this.scene.children = []; // Clear scene children
  }

  checkLoadingComplete() {
    if (this.loadingManager.assetsLoaded >= this.loadingManager.assetsToLoad) {
        this.loadingManager.onComplete();
    }
  }

  updateLoadingProgress() {
    // Calculate loading percentage
    if (this.loadingManager.assetsToLoad === 0) return; // Avoid division by zero
    
    const percentComplete = Math.floor((this.loadingManager.assetsLoaded / this.loadingManager.assetsToLoad) * 100);
    
    // Update progress bar and percentage text
    const progressBar = document.querySelector('.progress-bar');
    const percentageText = document.querySelector('.loading-percentage');
    const loadingSubtitle = document.querySelector('.loading-subtitle');
    
    if (progressBar) {
      progressBar.style.width = `${percentComplete}%`;
    }
    
    if (percentageText) {
      percentageText.textContent = `${percentComplete}%`;
    }
    
    // Update loading message based on progress
    if (loadingSubtitle) {
      if (percentComplete < 30) {
        loadingSubtitle.textContent = 'Loading celestial bodies and textures...';
      } else if (percentComplete < 60) {
        loadingSubtitle.textContent = 'Positioning planets and moons...';
      } else if (percentComplete < 90) {
        loadingSubtitle.textContent = 'Preparing star field and galaxy backdrop...';
      } else {
        loadingSubtitle.textContent = 'Almost ready...';
      }
    }
    
    // Progress logging removed
  }

  hideLoadingScreen() {
    if (this.loadingScreenElement && this.loadingScreenElement.style.display !== 'none') {
        // Skip showing 100% progress and go straight to fade out
        
        // Immediately fade out the loading screen
        setTimeout(() => {
            this.loadingScreenElement.style.opacity = '0'; // Start fade out
            
            // Make the solar system visible as the loading screen fades out
            if (this.solarSystemGroup) {
                this.solarSystemGroup.visible = true;
            }
            
            setTimeout(() => {
                if (this.loadingScreenElement) this.loadingScreenElement.style.display = 'none';
            }, 500); // Match this duration to your CSS transition (assuming 0.5s)
        }, 100); // Minimal delay before fade out
        
        // Loading complete notification removed
    }
  }

}
