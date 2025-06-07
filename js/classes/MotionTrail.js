import * as THREE from 'three';

/**
 * Creates motion trails for celestial bodies, showing their historical path
 */
export class MotionTrail {
    constructor(body, maxTrailLength = 200, trailColor = 0x4444ff) {
        this.body = body;
        this.maxTrailLength = maxTrailLength;
        this.trailColor = trailColor;
        this.trailPositions = [];
        this.trailGeometry = null;
        this.trailMaterial = null;
        this.trailLine = null;
        this.lastRecordTime = 0;
        this.recordInterval = 100; // Record position every 100ms
        
        this.createTrail();
    }

    createTrail() {
        // Initialize with empty positions
        const positions = new Float32Array(this.maxTrailLength * 3);
        
        this.trailGeometry = new THREE.BufferGeometry();
        this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        this.trailMaterial = new THREE.LineBasicMaterial({
            color: this.trailColor,
            transparent: true,
            opacity: 0.7,
            vertexColors: true
        });

        // Create colors array for gradient effect
        const colors = new Float32Array(this.maxTrailLength * 3);
        const color = new THREE.Color(this.trailColor);
        
        for (let i = 0; i < this.maxTrailLength; i++) {
            const alpha = i / this.maxTrailLength;
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        this.trailLine = new THREE.Line(this.trailGeometry, this.trailMaterial);
        this.trailLine.name = `${this.body.name}_trail`;
        this.trailLine.visible = false; // Hidden by default
    }

    update(currentTime) {
        // Only record position at intervals to avoid too dense trails
        if (currentTime - this.lastRecordTime < this.recordInterval) {
            return;
        }
        
        this.lastRecordTime = currentTime;
        
        // Get current world position of the body
        const bodyObject = this.body.getObject();
        if (!bodyObject) return;
        
        const worldPosition = new THREE.Vector3();
        bodyObject.getWorldPosition(worldPosition);
        
        // Add new position to trail
        this.trailPositions.push(worldPosition.clone());
        
        // Remove old positions if we exceed max length
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        // Update geometry with new positions
        this.updateGeometry();
    }

    updateGeometry() {
        if (!this.trailGeometry || this.trailPositions.length < 2) return;
        
        const positions = this.trailGeometry.attributes.position.array;
        const colors = this.trailGeometry.attributes.color.array;
        const baseColor = new THREE.Color(this.trailColor);
        
        // Fill positions array
        for (let i = 0; i < this.maxTrailLength; i++) {
            if (i < this.trailPositions.length) {
                const pos = this.trailPositions[i];
                positions[i * 3] = pos.x;
                positions[i * 3 + 1] = pos.y;
                positions[i * 3 + 2] = pos.z;
                
                // Create fade effect - newer positions are more opaque
                const alpha = i / this.trailPositions.length;
                colors[i * 3] = baseColor.r * alpha;
                colors[i * 3 + 1] = baseColor.g * alpha;
                colors[i * 3 + 2] = baseColor.b * alpha;
            } else {
                // Empty positions
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
                colors[i * 3] = 0;
                colors[i * 3 + 1] = 0;
                colors[i * 3 + 2] = 0;
            }
        }
        
        this.trailGeometry.attributes.position.needsUpdate = true;
        this.trailGeometry.attributes.color.needsUpdate = true;
        
        // Update draw range to only render the positions we have
        this.trailGeometry.setDrawRange(0, Math.max(0, this.trailPositions.length - 1));
    }

    setVisible(visible) {
        if (this.trailLine) {
            this.trailLine.visible = visible;
        }
    }

    getTrailObject() {
        return this.trailLine;
    }

    clearTrail() {
        this.trailPositions = [];
        this.updateGeometry();
    }

    dispose() {
        if (this.trailGeometry) {
            this.trailGeometry.dispose();
        }
        if (this.trailMaterial) {
            this.trailMaterial.dispose();
        }
    }
}