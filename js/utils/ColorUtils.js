/**
 * Utility functions for color manipulation
 */

export class ColorUtils {
    /**
     * Generate a random color as a hex value
     * @returns {number} Random color as a hex value
     */
    static getRandomColor() {
        // Generate a random color with good visibility (not too dark)
        const r = Math.floor(Math.random() * 200 + 55); // 55-255
        const g = Math.floor(Math.random() * 200 + 55); // 55-255
        const b = Math.floor(Math.random() * 200 + 55); // 55-255
        
        // Convert to hex format
        return (r << 16) | (g << 8) | b;
    }
}
