import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import CONFIG from "./config.js";
import { isWebGLAvailable } from "./utils/webgl-check.js";
import { SolarSystem } from "./classes/SolarSystem.js";
import { Sun } from "./classes/Sun.js";
import { Mercury } from "./classes/Mercury.js";
import { Venus } from "./classes/Venus.js";
import { Earth } from "./classes/Earth.js";
import { Moon } from "./classes/Moon.js";
import { Mars } from "./classes/Mars.js";
import { Phobos } from "./classes/Phobos.js";
import { Deimos } from "./classes/Deimos.js";
import { Jupiter } from "./classes/Jupiter.js";
import { Saturn } from "./classes/Saturn.js";
import { Io } from "./classes/Io.js";
import { Europa } from "./classes/Europa.js";
import { Ganymede } from "./classes/Ganymede.js";
import { Callisto } from "./classes/Callisto.js";
import { Ceres } from "./classes/Ceres.js";
import { Vesta } from "./classes/Vesta.js";
import { Pallas } from "./classes/Pallas.js";
import { Hygiea } from "./classes/Hygiea.js";
import { Starfield } from "./classes/Starfield.js";
import { MilkyWay } from "./classes/MilkyWay.js";
import { getBodyData } from "./utils/CelestialBodyData.js";

/**
 * Main application class for the 3D solar system
 */
export default class App {
  constructor() {
    const webGLAvailable = isWebGLAvailable();
    
    if (!webGLAvailable) {
      document.getElementById("webgl-compatibility").style.display = "flex";
      document.getElementById("loadingScreen").style.display = "none";
      console.error("WebGL is not supported or available.");
      return;
    } else {
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
    this.solarSystem = null;
    this.starfield = null;
    this.milkyWay = null;
    this.clock = new THREE.Clock();
    this.composer = null;
    this.bloomPass = null;

    this.materialsToDispose = [];
    this.geometriesToDispose = [];

    this.focusedBody = null;
    this.currentAnimation = null;
    this.isSimulationPaused = false;

    // Info panel state
    this.selectedBody = null;
    this.infoPanel = null;

    // Audio player state
    this.soundtrack = null;
    this.isMuted = false;

    // Time controls
    this.timeControlsPanel = null;
    this.playPauseButton = null;
    this.timeScaleSlider = null;
    this.timeScaleValue = null;
    this.liveButton = null;
    
    // DateTime system
    this.simulationTime = new Date();
    this.isLiveTime = true;
    this.lastUpdateTime = Date.now();
    

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

    // Quirky loading messages
    this.loadingMessages = {
      titles: [
        "Preparing Solar System",
        "Assembling the Cosmos",
        "Brewing Some Starlight",
        "Gathering Cosmic Dust",
        "Tuning Planetary Frequencies",
        "Calibrating Gravity Wells",
        "Polishing Asteroid Belts",
        "Warming Up the Sun",
        "Teaching Planets to Orbit",
        "Installing Rocket Boosters",
        "Charging Solar Panels",
        "Awakening Ancient Stars"
      ],
      subtitles: [
        "Loading celestial bodies and textures...",
        "Please don't adjust your reality...",
        "Convincing photons to behave...",
        "Herding space cats into formation...",
        "Downloading more RAM for Jupiter...",
        "Asking Mars nicely to be red...",
        "Teaching Saturn to hula hoop...",
        "Bribing Einstein for better physics...",
        "Negotiating with black holes...",
        "Untangling Saturn's rings...",
        "Debugging the laws of physics...",
        "Calibrating the space-time continuum...",
        "Installing cosmic WiFi...",
        "Buffering the Big Bang...",
        "Compressing 13.8 billion years...",
        "Rendering the impossible...",
        "Consulting with aliens...",
        "Feeding the space hamsters...",
        "Turning it off and on again...",
        "Googling 'how to universe'...",
        "Applying space-grade duct tape...",
        "Reticulating splines in zero-G..."
      ]
    };

    // Random loading messages are now set directly in HTML

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
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.copy(CONFIG.CAMERA.INITIAL_POSITION);
    this.camera.lookAt(CONFIG.CAMERA.LOOK_AT);
    this.scene.add(this.camera);

    // Very minimal ambient light to prevent complete darkness
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0.00001; // Significantly reduced for extreme close-ups on tiny objects
    this.controls.maxDistance = CONFIG.STARFIELD.RADIUS / 10;

    // Create a group for the solar system that will be initially invisible
    this.solarSystemGroup = new THREE.Group();
    this.scene.add(this.solarSystemGroup);
    this.solarSystemGroup.visible = false; // Hide until loading is complete
    
    // Initialize solar system with the group as parent container
    this.solarSystem = new SolarSystem(this.scene, this.solarSystemGroup);
    
    // Ensure the scene is completely black during loading
    this.renderer.setClearColor(0x000000, 1.0); // Pure black background
    
    // Create Sun
    const sun = new Sun(this.solarSystemGroup); // Add to group instead of scene
    this.solarSystem.addBody(sun);
    if (sun.mesh) {
      if (sun.mesh.material) this.materialsToDispose.push(sun.mesh.material);
      if (sun.mesh.geometry) this.geometriesToDispose.push(sun.mesh.geometry);
    }

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

    // Create Jupiter
    this.jupiter = new Jupiter(this.solarSystemGroup);
    this.solarSystem.addBody(this.jupiter);
    if (this.jupiter.mesh) {
      if (this.jupiter.mesh.material) this.materialsToDispose.push(this.jupiter.mesh.material);
      if (this.jupiter.mesh.geometry) this.geometriesToDispose.push(this.jupiter.mesh.geometry);
    }

    // Create Jupiter's moons
    this.io = new Io(this.jupiter);
    this.solarSystem.addBody(this.io);
    if (this.io.mesh) {
      if (this.io.mesh.material) this.materialsToDispose.push(this.io.mesh.material);
      if (this.io.mesh.geometry) this.geometriesToDispose.push(this.io.mesh.geometry);
    }

    this.europa = new Europa(this.jupiter);
    this.solarSystem.addBody(this.europa);
    if (this.europa.mesh) {
      if (this.europa.mesh.material) this.materialsToDispose.push(this.europa.mesh.material);
      if (this.europa.mesh.geometry) this.geometriesToDispose.push(this.europa.mesh.geometry);
    }

    this.ganymede = new Ganymede(this.jupiter);
    this.solarSystem.addBody(this.ganymede);
    if (this.ganymede.mesh) {
      if (this.ganymede.mesh.material) this.materialsToDispose.push(this.ganymede.mesh.material);
      if (this.ganymede.mesh.geometry) this.geometriesToDispose.push(this.ganymede.mesh.geometry);
    }

    this.callisto = new Callisto(this.jupiter);
    this.solarSystem.addBody(this.callisto);
    if (this.callisto.mesh) {
      if (this.callisto.mesh.material) this.materialsToDispose.push(this.callisto.mesh.material);
      if (this.callisto.mesh.geometry) this.geometriesToDispose.push(this.callisto.mesh.geometry);
    }

    // Create Saturn
    this.saturn = new Saturn(this.solarSystemGroup);
    this.solarSystem.addBody(this.saturn);
    if (this.saturn.mesh) {
      if (this.saturn.mesh.material) this.materialsToDispose.push(this.saturn.mesh.material);
      if (this.saturn.mesh.geometry) this.geometriesToDispose.push(this.saturn.mesh.geometry);
    }
    // Dispose Saturn rings materials
    if (this.saturn.rings) {
      if (this.saturn.rings.material) this.materialsToDispose.push(this.saturn.rings.material);
      if (this.saturn.rings.geometry) this.geometriesToDispose.push(this.saturn.rings.geometry);
    }

    // Create Ceres (dwarf planet in asteroid belt)
    const ceres = new Ceres(this.solarSystemGroup);
    this.solarSystem.addBody(ceres);
    if (ceres.mesh) {
      if (ceres.mesh.material) this.materialsToDispose.push(ceres.mesh.material);
      if (ceres.mesh.geometry) this.geometriesToDispose.push(ceres.mesh.geometry);
    }

    // Create Vesta (asteroid)
    const vesta = new Vesta(this.solarSystemGroup);
    this.solarSystem.addBody(vesta);
    if (vesta.mesh) {
      if (vesta.mesh.material) this.materialsToDispose.push(vesta.mesh.material);
      if (vesta.mesh.geometry) this.geometriesToDispose.push(vesta.mesh.geometry);
    }

    // Create Pallas (asteroid)
    const pallas = new Pallas(this.solarSystemGroup);
    this.solarSystem.addBody(pallas);
    if (pallas.mesh) {
      if (pallas.mesh.material) this.materialsToDispose.push(pallas.mesh.material);
      if (pallas.mesh.geometry) this.geometriesToDispose.push(pallas.mesh.geometry);
    }

    // Create Hygiea (asteroid)
    const hygiea = new Hygiea(this.solarSystemGroup);
    this.solarSystem.addBody(hygiea);
    if (hygiea.mesh) {
      if (hygiea.mesh.material) this.materialsToDispose.push(hygiea.mesh.material);
      if (hygiea.mesh.geometry) this.geometriesToDispose.push(hygiea.mesh.geometry);
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

    // Initialize datetime display and button states
    this.updateDateTimeDisplay();
    this.updatePlayPauseButtonState();
    this.updateLiveButtonState();

    // Start animation loop
    this.animate();

    // Check if loading is already complete
    this.checkLoadingComplete();
  }


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
      { 
        name: "Asteroid Belt", 
        icon: "fa-asterisk",
        asteroids: [
          { name: "Ceres", icon: "fa-certificate" },
          { name: "Vesta", icon: "fa-circle" },
          { name: "Pallas", icon: "fa-circle" },
          { name: "Hygiea", icon: "fa-circle" }
        ]
      },
      { 
        name: "Jupiter", 
        icon: "fa-circle",
        moons: [
          { name: "Io", icon: "fa-circle" },
          { name: "Europa", icon: "fa-circle" },
          { name: "Ganymede", icon: "fa-circle" },
          { name: "Callisto", icon: "fa-circle" }
        ]
      },
      { 
        name: "Saturn", 
        icon: "fa-ring"
      },
    ];

    // Create hierarchical dropdown menu
    celestialBodiesHierarchy.forEach((body) => {
      const hasSubmenu = (body.moons && body.moons.length > 0) || (body.asteroids && body.asteroids.length > 0);
      
      if (hasSubmenu) {
        // Create parent body option with submenu
        const parentOption = document.createElement("div");
        parentOption.className = "focus-option parent-option";
        parentOption.innerHTML = `<i class="fas ${body.icon}"></i> ${body.name} <i class="fas fa-chevron-right submenu-icon"></i>`;
        
        // Create submenu container
        const submenu = document.createElement("div");
        submenu.className = "submenu";
        
        // Add Safari-compatible hover logic for submenus
        let submenuHideTimeout = null;
        
        const showSubmenu = () => {
          // Clear any existing hide timeout
          if (submenuHideTimeout) {
            clearTimeout(submenuHideTimeout);
            submenuHideTimeout = null;
          }
          
          // Hide all other submenus immediately to prevent overlap
          document.querySelectorAll('.submenu.show-submenu').forEach(otherSubmenu => {
            if (otherSubmenu !== submenu) {
              otherSubmenu.classList.remove('show-submenu');
            }
          });
          
          // Check if submenu would go below screen edge and adjust positioning
          const parentRect = parentOption.getBoundingClientRect();
          const submenuHeight = 200; // Approximate submenu height
          const windowHeight = window.innerHeight;
          
          if (parentRect.bottom + submenuHeight > windowHeight) {
            // Position submenu upward
            submenu.style.top = 'auto';
            submenu.style.bottom = '0px';
          } else {
            // Default positioning
            submenu.style.top = '-5px';
            submenu.style.bottom = 'auto';
          }
          
          submenu.classList.add("show-submenu");
        };
        
        const hideSubmenu = () => {
          submenuHideTimeout = setTimeout(() => {
            submenu.classList.remove("show-submenu");
          }, 100); // Reduced timeout for faster hiding
        };
        
        // Parent option hover events
        parentOption.addEventListener("mouseenter", showSubmenu);
        parentOption.addEventListener("mouseleave", hideSubmenu);
        
        // Submenu hover events
        submenu.addEventListener("mouseenter", showSubmenu);
        submenu.addEventListener("mouseleave", hideSubmenu);
        
        // Add click handler for the parent body (only if it's not "Asteroid Belt")
        if (body.name !== "Asteroid Belt") {
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
        }
        
        // Add moon/asteroid options to submenu
        const submenuItems = body.moons || body.asteroids || [];
        submenuItems.forEach(item => {
          const itemOption = document.createElement("div");
          itemOption.className = "focus-option moon-option";
          itemOption.innerHTML = `<i class="fas ${item.icon}"></i> ${item.name}`;
          itemOption.addEventListener("click", (e) => {
            e.stopPropagation();
            // Only call focusOnBody - showBodyInfo will be called after animation completes
            this.focusOnBody(item.name);
            focusButton.blur();
          });
          submenu.appendChild(itemOption);
        });
        
        parentOption.appendChild(submenu);
        focusContainer.appendChild(parentOption);
      } else {
        // Create regular option for bodies without submenu
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

    // Implement the specified behavior rules:
    // 1. On hover - show the tooltip label
    // 2. On click - show extended menu & hide tooltip
    // 3. On click again or outside the extended menu - hide extended menu
    // 4. On hover again - show the tooltip
    
    // Helper function to hide menu and restore tooltip capability
    const hideMenu = () => {
      focusContainer.classList.remove("show");
      focusButton.classList.remove("active");
      focusButton.classList.remove("hide-tooltip");
      
      // Hide all submenus when main dropdown closes
      document.querySelectorAll('.submenu.show-submenu').forEach(submenu => {
        submenu.classList.remove('show-submenu');
      });
    };
    
    // Helper function to show menu and hide tooltip
    const showMenu = () => {
      focusButton.classList.add("hide-tooltip");
      focusContainer.classList.add("show");
      focusButton.classList.add("active");
    };
    
    // Helper function to check if menu is open
    const isMenuOpen = () => {
      return focusContainer.classList.contains("show");
    };
    
    // Rule 2: On click - toggle extended menu
    focusButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isMenuOpen()) {
        // Show menu and hide tooltip
        showMenu();
      } else {
        // Rule 3: Click again - hide extended menu
        hideMenu();
      }
    });
    
    // Rule 3: Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (isMenuOpen() && !focusButton.contains(e.target) && !focusContainer.contains(e.target)) {
        hideMenu();
      }
    });
    
    // Prevent clicks on the container from bubbling to the button
    focusContainer.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Append the dropdown to the focus button
    focusButton.appendChild(focusContainer);
    // Insert the focus button at the beginning of the controls
    const controlsPanel = document.getElementById("controls");
    controlsPanel.insertBefore(focusButton, controlsPanel.firstChild);

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

    // Setup Time Controls (now split into center and right panels)
    this.timeControlsPanel = document.getElementById('timeControls');
    this.speedControlsPanel = document.getElementById('speedControls');
    this.playPauseButton = document.getElementById('playPauseButton');
    this.timeScaleSlider = document.getElementById('timeScale');
    this.timeScaleValue = document.getElementById('timeScaleValue');
    this.liveButton = document.getElementById('liveButton');

    if (this.playPauseButton) {
      this.playPauseButton.addEventListener('click', () => {
        this.isSimulationPaused = !this.isSimulationPaused;
        
        // When paused, deactivate live mode
        if (this.isSimulationPaused) {
          this.isLiveTime = false;
        }
        
        this.updatePlayPauseButtonState();
        this.updateLiveButtonState();
        this.updateDateTimeDisplay();
      });
    }

    // Setup custom slider
    this.setupCustomSlider();

    if (this.liveButton) {
      this.liveButton.addEventListener('click', () => {
        this.isLiveTime = !this.isLiveTime;
        if (this.isLiveTime) {
          // Resume simulation when activating live mode
          this.isSimulationPaused = false;
          
          this.simulationTime = new Date();
          this.timeScaleSlider.value = 0; // Index 0 in the map corresponds to 1x (real-time)
          CONFIG.ANIMATION.timeScale = 1;
          this.timeScaleValue.textContent = this.formatTimeUnit(1, true);
          
          // Update custom slider position
          const customSlider = document.getElementById('customTimeSlider');
          const sliderThumb = document.getElementById('sliderThumb');
          if (customSlider && sliderThumb) {
            sliderThumb.style.left = '50%'; // Center position for 1x
            const segments = customSlider.querySelectorAll('.slider-segment');
            segments.forEach((segment, index) => {
              segment.classList.toggle('active', index === 6); // Center segment
            });
          }
          
          // Reset all celestial bodies to their current astronomical positions
          this.resetCelestialBodiesPosition();
        }
        this.updateLiveButtonState();
        this.updatePlayPauseButtonState();
        this.updateDateTimeDisplay();
      });
    }

    // Setup Toggle Trails button (disabled for now - functionality not implemented)
    const toggleTrailsButton = document.getElementById('toggleTrailsButton');
    if (toggleTrailsButton) {
      toggleTrailsButton.style.display = 'none'; // Hide the button since trails are not implemented
    }

    // Setup Toggle Icons button (disabled for now)
    const toggleIconsButton = document.getElementById('toggleIconsButton');
    if (toggleIconsButton) {
      toggleIconsButton.style.display = 'none'; // Hide the button for now
    }
    
    // Hide all controls initially using existing implementation
    this.hideAllControls();
  }

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
    
    if (this.speedControlsPanel) {
      this.speedControlsPanel.classList.add("hidden");
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
    
    if (this.timeControlsPanel) {
      this.timeControlsPanel.classList.remove("hidden");
    }
    
    if (this.speedControlsPanel) {
      this.speedControlsPanel.classList.remove("hidden");
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
      this.playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      this.playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
  }

  updateLiveButtonState() {
    if (!this.liveButton) return;

    if (this.isLiveTime) {
      this.liveButton.classList.add('active');
      this.liveButton.innerHTML = '<span class="live-dot"></span> LIVE';
    } else {
      this.liveButton.classList.remove('active');
      this.liveButton.innerHTML = '<span class="live-dot"></span> LIVE';
    }
    
    // Update time scale display to hide/show based on live mode
    if (this.timeScaleValue) {
      this.timeScaleValue.textContent = this.formatTimeUnit(CONFIG.ANIMATION.timeScale, this.isLiveTime);
    }
  }

  updateDateTimeDisplay() {
    const datetimeText = document.getElementById('datetimeText');
    const datetimeStatus = document.getElementById('datetimeStatus');
    const panelTimeText = document.getElementById('panelTimeText');
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    };
    const timeString = this.simulationTime.toLocaleDateString('en-US', options);
    
    if (datetimeText) {
      datetimeText.textContent = timeString;
    }
    
    // Update panel time display with just the time portion
    if (panelTimeText) {
      const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      };
      panelTimeText.textContent = this.simulationTime.toLocaleDateString('en-US', timeOptions);
    }
    
    if (datetimeStatus) {
      datetimeStatus.className = 'datetime-status';
      if (this.isLiveTime) {
        datetimeStatus.textContent = 'LIVE';
        datetimeStatus.classList.add('live');
      } else if (this.isSimulationPaused) {
        datetimeStatus.textContent = 'PAUSED';
        datetimeStatus.classList.add('paused');
      } else {
        const statusText = this.formatTimeUnit(CONFIG.ANIMATION.timeScale, this.isLiveTime);
        datetimeStatus.textContent = statusText ? statusText.toUpperCase() : "";
      }
    }
  }

  async resetCelestialBodiesPosition() {
    try {
      const { calculateOrbitalAngle, calculateMoonPosition } = await import('./utils/AstronomicalCalculations.js');
      
      // Reset each celestial body to its current astronomical position
      const celestialBodies = this.solarSystem.getBodies();
      celestialBodies.forEach(body => {
        if (body.name === 'Moon') {
          // Special handling for Moon
          body.orbitAngle = calculateMoonPosition();
        } else if (body.name !== 'Sun' && !body.parentBody) {
          // For planets and asteroids (not moons)
          try {
            body.orbitAngle = calculateOrbitalAngle(body.name.toUpperCase());
          } catch (error) {
            console.warn(`Could not reset position for ${body.name}:`, error);
          }
        } else if (body.parentBody) {
          // For moons, reset to initial orbital position to prevent jumping
          body.orbitAngle = body.orbitAngle || 0;
        }
        // Update position immediately
        body.updatePosition();
      });
    } catch (error) {
      console.error('Error resetting celestial body positions:', error);
    }
  }

  updateSimulationTime(deltaTime) {
    if (!this.isSimulationPaused) {
      if (this.isLiveTime) {
        // In live mode, follow real time
        this.simulationTime = new Date();
      } else {
        // In simulation mode, advance time based on time unit
        // Time unit: 1x = 1 second per second (real-time), 10x = 10 seconds per second, -1x = -1 second per second (reverse)
        const timeUnit = CONFIG.ANIMATION.timeScale; // seconds per second
        const timeAdvancement = deltaTime * 1000 * timeUnit; // milliseconds
        
        this.simulationTime.setTime(this.simulationTime.getTime() + timeAdvancement);
        
        // Clamp to valid date range
        const minDate = new Date(CONFIG.TIME.minYear, 0, 1);
        const maxDate = new Date(CONFIG.TIME.maxYear, 11, 31);
        
        if (this.simulationTime < minDate) {
          this.simulationTime = minDate;
        } else if (this.simulationTime > maxDate) {
          this.simulationTime = maxDate;
        }
      }
    }
    
    // Update display more frequently for smooth updates
    const now = Date.now();
    if (now - this.lastUpdateTime > 100) { // Update every 100ms
      this.updateDateTimeDisplay();
      this.lastUpdateTime = now;
    }
  }

  /**
   * Convert time unit to intuitive display text
   * @param {number} timeUnit - Time unit (seconds per second)
   * @param {boolean} isLiveMode - Whether live mode is active
   * @returns {string} Intuitive display text
   */
  formatTimeUnit(timeUnit, isLiveMode = false) {
    const absValue = Math.abs(timeUnit);
    const isReverse = timeUnit < 0;
    const reversePrefix = isReverse ? "← " : "";
    
    if (absValue === 1) {
      // Always show speed display to prevent layout jumping
      return isReverse ? "← 1 sec/s" : "1 sec/s";
    } else if (absValue < 60) {
      return `${reversePrefix}${absValue} sec/sec`;
    } else if (absValue < 3600) {
      const minutes = Math.round(absValue / 60);
      return `${reversePrefix}${minutes} min/sec`;
    } else if (absValue < 86400) {
      const hours = Math.round(absValue / 3600);
      return `${reversePrefix}${hours} hr/sec`;
    } else if (absValue < 604800) {
      const days = Math.round(absValue / 86400);
      return `${reversePrefix}${days} day/sec`;
    } else if (absValue < 31536000) {
      const weeks = Math.round(absValue / 604800);
      return `${reversePrefix}${weeks} wk/sec`;
    } else {
      const years = Math.round(absValue / 31536000);
      return `${reversePrefix}${years} yr/sec`;
    }
  }

  /**
   * Setup custom time scale slider
   */
  setupCustomSlider() {
    // Define fixed time unit positions for better UX
    const timeScaleMap = [
      -1000000, -100000, -10000, -1000, -100, -10,       // Negative values (reverse time)
      1,                                                  // Center at 1x (1 second per second - real time)
      10, 100, 1000, 10000, 100000, 1000000             // Positive values (forward time)
    ];
    
    const customSlider = document.getElementById('customTimeSlider');
    const sliderThumb = document.getElementById('sliderThumb');
    const hiddenInput = this.timeScaleSlider;
    
    if (!customSlider || !sliderThumb || !hiddenInput) return;
    
    let currentValue = 0; // Start at center (1x)
    
    const updateSlider = (value) => {
      currentValue = value;
      const percentage = ((value + 6) / 12) * 100; // Convert -6 to 6 range to 0-100%
      sliderThumb.style.left = `${percentage}%`;
      
      // Update segments active state
      const segments = customSlider.querySelectorAll('.slider-segment');
      segments.forEach((segment, index) => {
        segment.classList.toggle('active', index === value + 6);
      });
      
      // Update hidden input
      hiddenInput.value = value;
      
      // Update time unit
      const actualTimeUnit = timeScaleMap[value + 6];
      CONFIG.ANIMATION.timeScale = actualTimeUnit;
      
      // Format display value with intuitive units
      this.timeScaleValue.textContent = this.formatTimeUnit(actualTimeUnit, this.isLiveTime);
      
      // Exit live mode if changed from 1x (real-time)
      if (this.isLiveTime && actualTimeUnit !== 1) {
        this.isLiveTime = false;
        this.updateLiveButtonState();
        this.updateDateTimeDisplay();
      }
    };
    
    // Click handler for slider track
    customSlider.addEventListener('click', (e) => {
      const rect = customSlider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newValue = Math.round(percentage * 12) - 6; // Convert to -6 to 6 range
      const clampedValue = Math.max(-6, Math.min(6, newValue));
      updateSlider(clampedValue);
    });
    
    // Drag functionality for thumb
    let isDragging = false;
    
    sliderThumb.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const rect = customSlider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round(percentage * 12) - 6;
      updateSlider(newValue);
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // Initialize slider position
    updateSlider(0);
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
          body.radius * 2,
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

      // Time controls are always visible when controls are shown
      if (this.areControlsVisible && this.timeControlsPanel) {
        this.timeControlsPanel.classList.remove("hidden");
      }
      if (this.areControlsVisible && this.speedControlsPanel) {
        this.speedControlsPanel.classList.remove("hidden");
      }
      this.updatePlayPauseButtonState();

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
      this.isSimulationPaused = false; // Ensure simulation runs when reset
      
      // Show time controls if controls are visible
      if (this.areControlsVisible && this.timeControlsPanel) {
        this.timeControlsPanel.classList.remove("hidden");
      }
      if (this.areControlsVisible && this.speedControlsPanel) {
        this.speedControlsPanel.classList.remove("hidden");
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
    const deltaTime = Math.min(this.clock.getDelta(), 1/15); // Cap delta time for stability (max 15 FPS)

    // Get the Sun for lighting updates (assuming getSun() and getObject() are correctly implemented)
    const sun = this.solarSystem.getSun(); // Make sure solarSystem has getSun()
    let sunPosition = new THREE.Vector3(0, 0, 0); // Default sun position if not found
    if (sun && sun.getObject()) {
      // Make sure sun and its objectGroup exist
      sunPosition = sun.getObject().position.clone();
    }

    // Update simulation time
    this.updateSimulationTime(deltaTime);

    // Update all celestial bodies with time unit scaling
    const scaledDeltaTime = deltaTime * CONFIG.ANIMATION.timeScale;
    const shouldAnimate = !this.isSimulationPaused && CONFIG.ANIMATION.enabled;
    
    
    const celestialBodies = this.solarSystem.getBodies();
    celestialBodies.forEach((body) => {
      // Update with proper animation flag and scaled time
      body.update(scaledDeltaTime, shouldAnimate);
        
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

    // Always update camera focus to follow the focused body
    this.updateCameraFocus();

    // Render the scene
    if (CONFIG.BLOOM_EFFECT.enabled && this.composer) {
      this.composer.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateCameraFocus() {
    if (this.focusedBody) {
      // Get the current world position of the focused body
      const bodyObject = this.focusedBody.getObject();
      if (!bodyObject) return;
      
      const bodyPosition = bodyObject.getWorldPosition(new THREE.Vector3());
      
      // Check for valid position
      if (isNaN(bodyPosition.x) || isNaN(bodyPosition.y) || isNaN(bodyPosition.z)) {
        return;
      }
      
      // Calculate how much the body has moved since last frame
      const currentTarget = this.controls.target.clone();
      const movement = bodyPosition.clone().sub(currentTarget);
      
      // Only update if there's significant movement to avoid jitter
      // Use smaller threshold for small bodies like Deimos to prevent accumulation jumping
      const threshold = this.focusedBody.radius < 0.1 ? 0.0001 : 0.001;
      if (movement.length() > threshold) {
        // Move both the camera and the target by the same amount
        // This keeps the user's view relative to the body unchanged
        this.camera.position.add(movement);
        this.controls.target.copy(bodyPosition);
        
        // Update the controls without disrupting user interaction
        this.controls.update();
      }
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
    
    if (progressBar) {
      progressBar.style.width = `${percentComplete}%`;
    }
    
    if (percentageText) {
      percentageText.textContent = `${percentComplete}%`;
    }
    
    // Don't override the quirky loading messages - let them continue rotating
    // The startLoadingTextRotation() handles all text updates now
    
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

// Global debug function for Jupiter system
window.debugJupiterSystem = function() {
    console.log('=== JUPITER SYSTEM DEBUG INFO ===');
    
    // Find Jupiter and its moons in the scene
    const app = window.app;
    if (!app) {
        console.error('App not found on window');
        return;
    }
    
    const jupiter = app.jupiter;
    const io = app.io;
    const europa = app.europa;
    const ganymede = app.ganymede;
    const callisto = app.callisto;
    
    if (jupiter) {
        console.log('Jupiter:');
        console.log('  Radius (3D units):', jupiter.mesh.geometry.parameters.radius);
        console.log('  Position:', jupiter.mesh.position);
        console.log('  Config diameter:', jupiter.config?.DIAMETER_KM || CONFIG.JUPITER.DIAMETER_KM);
        console.log('  Calculated radius:', jupiter.config?.RADIUS || CONFIG.JUPITER.RADIUS);
    }
    
    const moons = [
        { name: 'Io', obj: io },
        { name: 'Europa', obj: europa },
        { name: 'Ganymede', obj: ganymede },
        { name: 'Callisto', obj: callisto }
    ];
    
    moons.forEach(moon => {
        if (moon.obj) {
            console.log(`${moon.name}:`);
            console.log('  Radius (3D units):', moon.obj.mesh.geometry.parameters.radius);
            console.log('  Local position:', moon.obj.mesh.position);
            
            // Get world position by adding Jupiter's position
            const worldPos = new THREE.Vector3();
            moon.obj.mesh.getWorldPosition(worldPos);
            console.log('  World position:', worldPos);
            
            // Distance from Jupiter center (world coordinates)
            const jupiterWorldPos = new THREE.Vector3();
            if (jupiter && jupiter.mesh) {
                jupiter.mesh.getWorldPosition(jupiterWorldPos);
            }
            const distanceFromJupiter = worldPos.distanceTo(jupiterWorldPos);
            console.log('  Distance from Jupiter center:', distanceFromJupiter);
            
            console.log('  Config diameter:', moon.obj.config?.DIAMETER_KM);
            console.log('  Config orbit radius:', moon.obj.config?.ORBIT_RADIUS);
            console.log('  Calculated radius:', moon.obj.config?.RADIUS);
            
            // Check if moon is inside Jupiter
            const jupiterRadius = jupiter ? (jupiter.config?.RADIUS || CONFIG.JUPITER.RADIUS) : 0;
            if (distanceFromJupiter < jupiterRadius) {
                console.log(`  ⚠️  ${moon.name} is INSIDE Jupiter! (${distanceFromJupiter} < ${jupiterRadius})`);
            } else {
                console.log(`  ✅  ${moon.name} is outside Jupiter (${distanceFromJupiter} > ${jupiterRadius})`);
            }
        }
    });
    
    // Scale factor analysis
    console.log('\n=== SCALE FACTOR ANALYSIS ===');
    console.log('CONFIG.SCALE_FACTOR:', CONFIG.SCALE_FACTOR);
    
    // Real vs scaled ratios
    console.log('\n=== REAL vs SCALED RATIOS ===');
    console.log('Real Jupiter diameter: 142,984 km');
    console.log('Real Io diameter: 3,643 km');
    console.log('Real Io/Jupiter ratio: ', (3643 / 142984).toFixed(4));
    console.log('Scaled Io/Jupiter ratio: ', ((3643 * 10) / (142984 * 10)).toFixed(4));
};
