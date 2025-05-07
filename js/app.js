import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import CONFIG from './config.js';
import { isWebGLAvailable } from './utils/webgl-check.js';
import { SolarSystem } from './classes/SolarSystem.js';
import { Sun } from './classes/Sun.js';
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
        this.controls.minDistance = CONFIG.SUN.RADIUS * 1.5; // Don't zoom inside the sun
        this.controls.maxDistance = CONFIG.STARFIELD.RADIUS / 10; // Don't zoom too far out

        // Create Sun
        const sun = new Sun();
        this.solarSystem.addBody(sun);
        // Collect materials and geometries for disposal
        if (sun.mesh) {
            if (sun.mesh.material) this.materialsToDispose.push(sun.mesh.material);
            if (sun.mesh.geometry) this.geometriesToDispose.push(sun.mesh.geometry);
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

        // Hide loading screen and start animation
        document.getElementById('loadingScreen').style.display = 'none';
        this.animate();

        console.log("Solar System Initialized. Scene graph:", this.scene);
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
