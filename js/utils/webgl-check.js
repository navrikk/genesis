/**
 * Checks if WebGL is available in the current browser
 * @returns {boolean} True if WebGL is supported, false otherwise
 */
export function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        

        if (window.WebGL2RenderingContext && canvas.getContext('webgl2')) {
            return true;
        }
        

        if (window.WebGLRenderingContext) {

            const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (context) {
                return true;
            }
        }
        

        console.warn('WebGL not supported');
        return false;
    } catch (e) {
        console.error('Error checking WebGL support:', e);
        return false;
    }
}