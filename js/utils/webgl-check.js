/**
 * Checks if WebGL is available in the current browser
 * @returns {boolean} True if WebGL is supported, false otherwise
 */
export function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        

        if (window.WebGL2RenderingContext && canvas.getContext('webgl2')) {
            console.log('WebGL 2.0 is supported');
            return true;
        }
        

        if (window.WebGLRenderingContext) {

            const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (context) {
                console.log('WebGL 1.0 is supported');
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

/**
 * Provides detailed diagnostics about WebGL support
 * @returns {Object} Object containing diagnostic information
 */
export function getWebGLDiagnostics() {
    const diagnostics = {
        webgl1Supported: false,
        webgl2Supported: false,
        renderer: null,
        vendor: null,
        unmaskedRenderer: null,
        unmaskedVendor: null,
        maxTextureSize: null,
        error: null
    };
    
    try {
        const canvas = document.createElement('canvas');
        

        const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl1) {
            diagnostics.webgl1Supported = true;
            diagnostics.renderer = gl1.getParameter(gl1.RENDERER);
            diagnostics.vendor = gl1.getParameter(gl1.VENDOR);
            diagnostics.maxTextureSize = gl1.getParameter(gl1.MAX_TEXTURE_SIZE);
            

            const debugInfo = gl1.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                diagnostics.unmaskedRenderer = gl1.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                diagnostics.unmaskedVendor = gl1.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            }
        }
        

        const gl2 = canvas.getContext('webgl2');
        if (gl2) {
            diagnostics.webgl2Supported = true;
        }
        
    } catch (e) {
        diagnostics.error = e.message;
    }
    
    return diagnostics;
}
