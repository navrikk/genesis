/**
 * Checks if WebGL is available in the current browser
 * @returns {boolean} True if WebGL is supported, false otherwise
 */
export function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}
