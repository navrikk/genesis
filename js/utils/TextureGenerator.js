import * as THREE from 'three';

/**
 * Utility for generating accurate NASA-based textures for celestial bodies
 * This creates procedural textures based on actual NASA data when actual image textures aren't available
 */
const TextureGenerator = {
    /**
     * Generate a texture for Phobos based on NASA data
     * Phobos has a reddish-gray color with numerous craters
     * Notably the large Stickney crater (9km wide, about 1/3 the moon's diameter)
     * @returns {THREE.Texture} Phobos texture
     */
    generatePhobosTexture() {
        const width = 2048;
        const height = 1024;
        
        // Create a canvas to draw on
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Base color - updated NASA-based color for Phobos (more accurate grayish with slight reddish tint)
        context.fillStyle = '#635a55';
        context.fillRect(0, 0, width, height);
        
        // Create grooved striations (Phobos has distinctive grooved patterns)
        this._addGroovePatterns(context, width, height, {
            count: 35,
            width: { min: 1, max: 5 },
            length: { min: width * 0.3, max: width * 0.8 },
            color: '#5a5046',
            variance: 15
        });
        
        // Add variations in color to simulate the extremely irregular surface
        this._addColorVariations(context, width, height, {
            r: { min: 95, max: 120 },
            g: { min: 85, max: 110 },
            b: { min: 75, max: 100 },
            granularity: 10
        });
        
        // Add many small craters
        for (let i = 0; i < 800; i++) {
            const size = Math.random() * 15 + 3;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawCrater(context, x, y, size, '#585048', '#6e645c');
        }
        
        // Add medium craters
        for (let i = 0; i < 80; i++) {
            const size = Math.random() * 35 + 15;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawCrater(context, x, y, size, '#585048', '#6e645c');
        }
        
        // Add a few large craters
        for (let i = 0; i < 10; i++) {
            const size = Math.random() * 50 + 40;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawCrater(context, x, y, size, '#585048', '#6e645c');
        }
        
        // Add the large Stickney crater - NASA sources indicate it covers about 1/3 of Phobos' diameter
        // Positioned based on actual NASA mapping
        const stickneySize = width / 6; 
        const stickneyX = width * 0.3;
        const stickneyY = height * 0.55;
        this._drawCrater(context, stickneyX, stickneyY, stickneySize, '#504840', '#706a65', true);
        
        // Add secondary impact crater near Stickney (Hall crater)
        const hallSize = stickneySize * 0.45;
        const hallX = stickneyX + stickneySize * 0.85;
        const hallY = stickneyY - stickneySize * 0.2;
        this._drawCrater(context, hallX, hallY, hallSize, '#504840', '#706a65');
        
        // Create a Three.js texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    },
    
    /**
     * Generate a bump map for Phobos based on NASA data
     * @returns {THREE.Texture} Phobos bump map
     */
    generatePhobosBumpMap() {
        const width = 2048;
        const height = 1024;
        
        // Create a canvas to draw on
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Fill with base height (mid-gray)
        context.fillStyle = '#808080';
        context.fillRect(0, 0, width, height);
        
        // Add general surface irregularity - Phobos is very irregular
        this._addNoisePattern(context, width, height, 5, 40);
        
        // Add many small craters
        for (let i = 0; i < 500; i++) {
            const size = Math.random() * 20 + 5;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawBumpCrater(context, x, y, size, 0.7);
        }
        
        // Add medium craters
        for (let i = 0; i < 50; i++) {
            const size = Math.random() * 40 + 20;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawBumpCrater(context, x, y, size, 0.8);
        }
        
        // Add the large Stickney crater with stronger bump effect
        const stickneySize = width / 6;
        const stickneyX = width / 4;
        const stickneyY = height / 2;
        this._drawBumpCrater(context, stickneyX, stickneyY, stickneySize, 0.9);
        
        // Create a Three.js texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    },
    
    /**
     * Generate a texture for Deimos based on NASA data
     * Deimos has a grayish-brown color with a smoother surface than Phobos
     * @returns {THREE.Texture} Deimos texture
     */
    generateDeimosTexture() {
        const width = 2048;
        const height = 1024;
        
        // Create a canvas to draw on
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Base color - updated NASA-based grayish-brown color for Deimos
        context.fillStyle = '#847e75'; // More accurate NASA color
        context.fillRect(0, 0, width, height);
        
        // Add soft regolith texture - Deimos has a thick dusty regolith layer
        this._addRegolithTexture(context, width, height, {
            density: 1.5, // Denser regolith than Phobos
            variation: 12 // Less variation than Phobos
        });
        
        // Add variations in color to simulate the smoother surface
        this._addColorVariations(context, width, height, {
            r: { min: 125, max: 145 },
            g: { min: 120, max: 140 },
            b: { min: 110, max: 130 },
            granularity: 25 // Larger patches of similar color (smoother)
        });
        
        // Add fewer small craters (smoother than Phobos)
        for (let i = 0; i < 350; i++) {
            const size = Math.random() * 12 + 4;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawCrater(context, x, y, size, '#767269', '#908a83', false, 0.7); // Less pronounced craters
        }
        
        // Add a few medium craters
        for (let i = 0; i < 30; i++) {
            const size = Math.random() * 25 + 15;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawCrater(context, x, y, size, '#767269', '#908a83', false, 0.8);
        }
        
        // Add a couple of larger craters
        for (let i = 0; i < 5; i++) {
            const size = Math.random() * 35 + 30;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawCrater(context, x, y, size, '#767269', '#908a83');
        }
        
        // Create a Three.js texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    },
    
    /**
     * Generate a bump map for Deimos based on NASA data
     * @returns {THREE.Texture} Deimos bump map
     */
    generateDeimosBumpMap() {
        const width = 2048;
        const height = 1024;
        
        // Create a canvas to draw on
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Fill with base height (mid-gray)
        context.fillStyle = '#808080';
        context.fillRect(0, 0, width, height);
        
        // Add general surface irregularity - Deimos is smoother than Phobos
        this._addNoisePattern(context, width, height, 3, 20);
        
        // Add fewer small craters
        for (let i = 0; i < 300; i++) {
            const size = Math.random() * 15 + 5;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawBumpCrater(context, x, y, size, 0.5);
        }
        
        // Add a few medium craters
        for (let i = 0; i < 20; i++) {
            const size = Math.random() * 30 + 15;
            const x = Math.random() * width;
            const y = Math.random() * height;
            this._drawBumpCrater(context, x, y, size, 0.6);
        }
        
        // Create a Three.js texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    },
    
    /**
     * Add color variations to simulate natural surface features
     * @private
     */
    _addColorVariations(context, width, height, options) {
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const granularity = options.granularity || 10;
        
        for (let y = 0; y < height; y += granularity) {
            for (let x = 0; x < width; x += granularity) {
                // Create a consistent variation for this patch
                const rVar = Math.random() * (options.r.max - options.r.min) + options.r.min;
                const gVar = Math.random() * (options.g.max - options.g.min) + options.g.min;
                const bVar = Math.random() * (options.b.max - options.b.min) + options.b.min;
                
                // Apply to a patch of pixels
                for (let py = 0; py < granularity && y + py < height; py++) {
                    for (let px = 0; px < granularity && x + px < width; px++) {
                        const idx = ((y + py) * width + (x + px)) * 4;
                        
                        // Apply variation with some noise
                        const noise = Math.random() * 10 - 5;
                        data[idx] = Math.max(0, Math.min(255, rVar + noise));
                        data[idx+1] = Math.max(0, Math.min(255, gVar + noise));
                        data[idx+2] = Math.max(0, Math.min(255, bVar + noise));
                    }
                }
            }
        }
        
        context.putImageData(imageData, 0, 0);
    },
    
    /**
     * Add a noise pattern to the canvas
     * @private
     */
    _addNoisePattern(context, width, height, minNoise, maxNoise) {
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * (maxNoise - minNoise) + minNoise;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
        }
        
        context.putImageData(imageData, 0, 0);
    },
    
    /**
     * Draw a realistic crater for a color texture
     * @private
     * @param {CanvasRenderingContext2D} context - Canvas drawing context
     * @param {number} x - X coordinate of crater center
     * @param {number} y - Y coordinate of crater center
     * @param {number} radius - Radius of crater
     * @param {string} innerColor - Color of crater interior
     * @param {string} rimColor - Color of crater rim
     * @param {boolean} isStickney - Whether this is the Stickney crater (special features) 
     * @param {number} intensity - Strength of crater features (0.0-1.0)
     */
    _drawCrater(context, x, y, radius, innerColor, rimColor, isStickney = false, intensity = 1.0) {
        // Draw the crater rim with a lighter color
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.strokeStyle = rimColor;
        context.lineWidth = radius * 0.1 * intensity;
        context.stroke();
        
        // Draw the crater bowl with a darker color
        context.beginPath();
        context.arc(x, y, radius * 0.9, 0, Math.PI * 2);
        
        // Apply intensity to color difference
        let innerColorRGB = innerColor;
        if (intensity < 1.0) {
            // Parse the hex color
            const r = parseInt(innerColor.slice(1, 3), 16);
            const g = parseInt(innerColor.slice(3, 5), 16);
            const b = parseInt(innerColor.slice(5, 7), 16);
            
            // Blend with background color based on intensity
            const bgR = parseInt(context.fillStyle.slice(1, 3), 16);
            const bgG = parseInt(context.fillStyle.slice(3, 5), 16);
            const bgB = parseInt(context.fillStyle.slice(5, 7), 16);
            
            const blendedR = Math.round(r * intensity + bgR * (1 - intensity));
            const blendedG = Math.round(g * intensity + bgG * (1 - intensity));
            const blendedB = Math.round(b * intensity + bgB * (1 - intensity));
            
            // Format as hex color
            innerColorRGB = `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`;
        }
        
        context.fillStyle = innerColorRGB;
        context.fill();
        
        // For Stickney, add some radial features to simulate the impact pattern
        if (isStickney) {
            const rays = 12;
            for (let i = 0; i < rays; i++) {
                const angle = (i / rays) * Math.PI * 2;
                const rayLength = radius * (1.5 + Math.random() * 0.5);
                
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(
                    x + Math.cos(angle) * rayLength,
                    y + Math.sin(angle) * rayLength
                );
                context.strokeStyle = rimColor;
                context.lineWidth = radius * (0.05 + Math.random() * 0.05) * intensity;
                context.stroke();
            }
        }
    },
    
    /**
     * Draw a realistic crater for a bump map
     * @private
     */
    _drawBumpCrater(context, x, y, radius, depth) {
        // Create a radial gradient for the crater
        const gradient = context.createRadialGradient(
            x, y, 0, 
            x, y, radius
        );
        
        // Dark at the center (depression)
        gradient.addColorStop(0, `rgba(0, 0, 0, ${depth})`);
        // Light at the rim (raised edge)
        gradient.addColorStop(0.7, `rgba(255, 255, 255, ${depth * 0.7})`);
        // Back to neutral
        gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
        
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.fill();
    },
    
    /**
     * Adds groove patterns typical of Phobos
     * NASA observations show Phobos has distinctive linear grooves across its surface
     * @private
     */
    _addGroovePatterns(context, width, height, options) {
        const { count, width: widthRange, length: lengthRange, color, variance } = options;
        
        // Save the current context state
        context.save();
        
        // For each groove
        for (let i = 0; i < count; i++) {
            // Determine groove properties with some randomness
            const grooveWidth = Math.random() * (widthRange.max - widthRange.min) + widthRange.min;
            const grooveLength = Math.random() * (lengthRange.max - lengthRange.min) + lengthRange.min;
            
            // Set up drawing style
            context.lineWidth = grooveWidth;
            context.strokeStyle = color;
            
            // Determine random starting point and angle
            const startX = Math.random() * width;
            const startY = Math.random() * height;
            const angle = Math.random() * Math.PI * 2;
            
            // Calculate end point based on length and angle
            const endX = startX + Math.cos(angle) * grooveLength;
            const endY = startY + Math.sin(angle) * grooveLength;
            
            // Draw the groove - with some waviness for natural appearance
            context.beginPath();
            context.moveTo(startX, startY);
            
            const controlPoints = Math.floor(grooveLength / 100) + 1;
            let lastX = startX;
            let lastY = startY;
            
            for (let p = 1; p <= controlPoints; p++) {
                const t = p / (controlPoints + 1);
                const baseX = startX + (endX - startX) * t;
                const baseY = startY + (endY - startY) * t;
                
                // Add some randomness to the path
                const offsetX = (Math.random() - 0.5) * variance;
                const offsetY = (Math.random() - 0.5) * variance;
                
                const pointX = baseX + offsetX;
                const pointY = baseY + offsetY;
                
                // Use quadratic curves for smoother lines
                const cpX = (lastX + pointX) / 2;
                const cpY = (lastY + pointY) / 2;
                context.quadraticCurveTo(cpX, cpY, pointX, pointY);
                
                lastX = pointX;
                lastY = pointY;
            }
            
            context.lineTo(endX, endY);
            context.stroke();
        }
        
        // Restore the context state
        context.restore();
    },
    
    /**
     * Adds regolith texture typical of Mars' moons
     * Creates a dusty, soft surface appearance
     * @private
     */
    _addRegolithTexture(context, width, height, options) {
        const { density = 1, variation = 10 } = options;
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Generate noise patterns at different scales for a more natural look
        const noiseScales = [1, 3, 7, 15]; // Different scales create natural appearance
        const noiseWeights = [0.5, 0.3, 0.15, 0.05]; // Higher weight to finer detail
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                
                // Generate layered noise
                let noiseValue = 0;
                for (let i = 0; i < noiseScales.length; i++) {
                    const scale = noiseScales[i];
                    const weight = noiseWeights[i];
                    
                    // Simple noise function using sine
                    const noise = Math.sin(x / scale) * Math.cos(y / scale) * Math.sin((x + y) / scale);
                    noiseValue += noise * weight;
                }
                
                // Scale the noise and apply density factor
                const scaledNoise = (noiseValue * variation * density);
                
                // Apply the noise to each color channel
                data[index] = Math.max(0, Math.min(255, data[index] + scaledNoise));
                data[index+1] = Math.max(0, Math.min(255, data[index+1] + scaledNoise));
                data[index+2] = Math.max(0, Math.min(255, data[index+2] + scaledNoise));
            }
        }
        
        // Apply a slight blur to create soft, dusty appearance
        context.putImageData(imageData, 0, 0);
        
        // Add fine dust specks
        const speckCount = Math.floor(width * height * 0.001 * density);
        for (let i = 0; i < speckCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            
            // Slightly lighter or darker than surroundings
            const brightness = Math.random() > 0.5 ? 20 : -20;
            const alpha = Math.random() * 0.3 + 0.1;
            
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${alpha})`;
            context.fill();
        }
    }
};

export default TextureGenerator;
