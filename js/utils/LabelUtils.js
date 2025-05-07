import * as THREE from 'three';

/**
 * Utility functions for creating and managing celestial body labels
 */
export class LabelUtils {
    /**
     * Creates a label for a celestial body with size proportional to the body's radius
     * @param {string} name - Name of the celestial body
     * @param {number} radius - Radius of the celestial body
     * @param {number} [minFontSize=12] - Minimum font size
     * @param {number} [maxFontSize=24] - Maximum font size
     * @param {number} [minScale=0.3] - Minimum scale for very small bodies
     * @param {number} [maxScale=1.2] - Maximum scale for very large bodies
     * @returns {THREE.Sprite} The label sprite
     */
    static createLabel(name, radius, minFontSize = 12, maxFontSize = 24, minScale = 0.3, maxScale = 1.2) {
        // Create a canvas for the label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Calculate font size based on radius (logarithmic scale)
        // This ensures small bodies have readable text but large bodies don't have enormous text
        const baseFontSize = Math.max(minFontSize, Math.min(maxFontSize, 
            minFontSize + (Math.log(radius + 1) / Math.log(10)) * (maxFontSize - minFontSize)
        ));
        
        // Round to nearest even number for cleaner rendering
        const fontSize = Math.round(baseFontSize / 2) * 2;
        
        // Draw text on the canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set font properties for a more modern, visible look
        context.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
        
        // Draw multiple strokes for a stronger glow effect
        context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        context.lineWidth = 4;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;
        
        // Draw outer glow
        context.shadowColor = 'rgba(0, 0, 0, 0.8)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.strokeText(name, textX, textY);
        
        // Draw bright text
        context.fillStyle = 'rgba(255, 255, 255, 1.0)';
        context.shadowColor = 'rgba(255, 255, 255, 0.5)';
        context.shadowBlur = 4;
        context.fillText(name, textX, textY);
        
        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            depthTest: false, // Make labels always visible
            depthWrite: false,
            sizeAttenuation: true // Scale with distance
        });
        
        // Calculate sprite scale based on radius (logarithmic scale)
        const baseScale = Math.max(minScale, Math.min(maxScale, 
            minScale + (Math.log(radius + 1) / Math.log(10)) * (maxScale - minScale)
        ));
        
        // Create the sprite with appropriate scale
        const label = new THREE.Sprite(spriteMaterial);
        label.scale.set(baseScale, baseScale * 0.5, 1);
        
        // Position above the celestial body with increased height for better visibility
        label.position.set(0, radius * 2.5, 0);
        
        // Add property for label visibility toggling
        label.userData.isLabel = true;
        
        return label;
    }
}
