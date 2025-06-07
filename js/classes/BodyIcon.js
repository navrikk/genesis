import * as THREE from 'three';

/**
 * Creates icons and labels for celestial bodies when zoomed out
 */
export class BodyIcon {
    constructor(body, scene) {
        this.body = body;
        this.scene = scene;
        this.iconGroup = new THREE.Group();
        this.icon = null;
        this.label = null;
        this.isVisible = false;
        this.minDistance = 50; // Minimum distance to show icon
        
        this.createIcon();
        this.createLabel();
        
        // Add to scene
        this.scene.add(this.iconGroup);
    }

    createIcon() {
        // Create a simple circle geometry for the icon
        const geometry = new THREE.CircleGeometry(0.5, 16);
        
        // Different colors for different body types
        let color = 0xFFFFFF;
        if (this.body.name === 'Sun') {
            color = 0xFFDD00;
        } else if (['Mercury', 'Venus', 'Earth', 'Mars'].includes(this.body.name)) {
            color = 0x4A90E2; // Blue for inner planets
        } else if (this.body.name === 'Jupiter') {
            color = 0xD2691E; // Orange for Jupiter
        } else if (['Moon', 'Phobos', 'Deimos', 'Io', 'Europa', 'Ganymede', 'Callisto'].includes(this.body.name)) {
            color = 0x888888; // Gray for moons
        } else {
            color = 0xBBBBBB; // Light gray for asteroids
        }
        
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.icon = new THREE.Mesh(geometry, material);
        this.icon.name = `${this.body.name}_icon`;
        this.iconGroup.add(this.icon);
    }

    createLabel() {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Set font and measure text
        context.font = 'Bold 24px Arial';
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text with outline
        const text = this.body.name;
        context.strokeText(text, canvas.width / 2, canvas.height / 2);
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        // Create label geometry
        const geometry = new THREE.PlaneGeometry(4, 1);
        this.label = new THREE.Mesh(geometry, material);
        this.label.position.y = 1.5; // Position above the icon
        this.label.name = `${this.body.name}_label`;
        this.iconGroup.add(this.label);
    }

    update(camera) {
        if (!this.body.getObject()) return;
        
        // Get body world position
        const bodyPosition = new THREE.Vector3();
        this.body.getObject().getWorldPosition(bodyPosition);
        
        // Calculate distance from camera
        const distance = camera.position.distanceTo(bodyPosition);
        
        // Show icon if camera is far enough
        const shouldShow = distance > this.minDistance;
        
        if (shouldShow !== this.isVisible) {
            this.isVisible = shouldShow;
            this.iconGroup.visible = shouldShow;
        }
        
        if (this.isVisible) {
            // Position icon at body location
            this.iconGroup.position.copy(bodyPosition);
            
            // Make icon and label face the camera
            this.iconGroup.lookAt(camera.position);
            
            // Scale based on distance for consistent size
            const scale = Math.max(1, distance / 50);
            this.iconGroup.scale.setScalar(scale);
        }
    }

    setVisible(visible) {
        this.iconGroup.visible = visible && this.isVisible;
    }

    dispose() {
        if (this.icon) {
            this.icon.geometry.dispose();
            this.icon.material.dispose();
        }
        if (this.label) {
            this.label.geometry.dispose();
            this.label.material.map.dispose();
            this.label.material.dispose();
        }
        if (this.iconGroup.parent) {
            this.iconGroup.parent.remove(this.iconGroup);
        }
    }
}