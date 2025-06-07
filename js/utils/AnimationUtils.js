import * as THREE from 'three';

/**
 * Animation utilities for smooth interpolation and frame rate management
 */
export class AnimationUtils {
    /**
     * Smooth step interpolation for easing
     * @param {number} t - Input value between 0 and 1
     * @returns {number} Smoothed value between 0 and 1
     */
    static smoothStep(t) {
        return t * t * (3.0 - 2.0 * t);
    }

    /**
     * Smoother step interpolation for more gradual easing
     * @param {number} t - Input value between 0 and 1
     * @returns {number} Smoothed value between 0 and 1
     */
    static smootherStep(t) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    /**
     * Exponential ease-out function
     * @param {number} t - Input value between 0 and 1
     * @returns {number} Eased value
     */
    static easeOutExpo(t) {
        return t === 1.0 ? 1.0 : 1.0 - Math.pow(2.0, -10.0 * t);
    }

    /**
     * Cubic ease-out function
     * @param {number} t - Input value between 0 and 1
     * @returns {number} Eased value
     */
    static easeOutCubic(t) {
        return 1.0 - Math.pow(1.0 - t, 3.0);
    }

    /**
     * Lerp between two values with optional easing
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @param {Function} easingFunction - Optional easing function
     * @returns {number} Interpolated value
     */
    static lerp(a, b, t, easingFunction = null) {
        if (easingFunction) {
            t = easingFunction(t);
        }
        return a + (b - a) * t;
    }

    /**
     * Spherical linear interpolation for angles (handles wrapping)
     * @param {number} a - Start angle in radians
     * @param {number} b - End angle in radians
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated angle
     */
    static slerpAngle(a, b, t) {
        // Normalize angles to [-π, π]
        a = this.normalizeAngle(a);
        b = this.normalizeAngle(b);
        
        // Find the shortest path
        let diff = b - a;
        if (diff > Math.PI) {
            diff -= 2 * Math.PI;
        } else if (diff < -Math.PI) {
            diff += 2 * Math.PI;
        }
        
        return a + diff * t;
    }

    /**
     * Normalize angle to [-π, π] range
     * @param {number} angle - Angle in radians
     * @returns {number} Normalized angle
     */
    static normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * Create a frame rate limiter
     * @param {number} targetFPS - Target frames per second
     * @returns {Object} Frame limiter object
     */
    static createFrameLimiter(targetFPS = 60) {
        const targetFrameTime = 1000 / targetFPS;
        let lastFrameTime = 0;
        let accumulator = 0;

        return {
            shouldRender(currentTime) {
                const deltaTime = currentTime - lastFrameTime;
                lastFrameTime = currentTime;
                accumulator += deltaTime;

                if (accumulator >= targetFrameTime) {
                    accumulator -= targetFrameTime;
                    return true;
                }
                return false;
            },
            
            getDeltaTime() {
                return Math.min(targetFrameTime / 1000, 1/30); // Cap at 30 FPS minimum
            }
        };
    }

    /**
     * Create smooth orbital motion with proper physics
     * @param {number} currentAngle - Current angle in radians
     * @param {number} orbitalSpeed - Orbital speed in radians per second
     * @param {number} deltaTime - Time step in seconds (can be negative for backward motion)
     * @param {number} eccentricity - Orbital eccentricity (0 = circular, <1 = elliptical)
     * @returns {number} New angle
     */
    static updateOrbitalMotion(currentAngle, orbitalSpeed, deltaTime, eccentricity = 0) {
        // For circular orbits, simple angular motion (deltaTime can be negative)
        if (eccentricity === 0) {
            return currentAngle + orbitalSpeed * deltaTime;
        }
        
        // For elliptical orbits, vary speed based on position (Kepler's second law)
        // Speed is faster at perihelion, slower at aphelion
        const speedVariation = 1 + eccentricity * Math.cos(currentAngle);
        const adjustedSpeed = orbitalSpeed * speedVariation;
        
        return currentAngle + adjustedSpeed * deltaTime;
    }

    /**
     * Create smooth camera transitions
     * @param {THREE.Camera} camera - Camera to animate
     * @param {THREE.Vector3} targetPosition - Target position
     * @param {THREE.Vector3} targetLookAt - Target look-at point
     * @param {number} duration - Animation duration in milliseconds
     * @param {Function} onComplete - Completion callback
     * @returns {Object} Animation controller
     */
    static createCameraAnimation(camera, targetPosition, targetLookAt, duration = 1000, onComplete = null) {
        const startPosition = camera.position.clone();
        const startLookAt = new THREE.Vector3(); // Current look-at would need to be tracked
        const startTime = Date.now();
        let animationId = null;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeOutCubic(progress);

            // Interpolate position
            camera.position.lerpVectors(startPosition, targetPosition, easedProgress);

            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                camera.position.copy(targetPosition);
                if (onComplete) onComplete();
            }
        };

        animate();

        return {
            stop() {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        };
    }

    /**
     * Calculate optimal level of detail based on distance
     * @param {number} distance - Distance from camera
     * @param {number} baseDistance - Base reference distance
     * @returns {number} LOD level (0 = highest quality, higher = lower quality)
     */
    static calculateLOD(distance, baseDistance = 10) {
        const ratio = distance / baseDistance;
        if (ratio < 1) return 0;
        if (ratio < 5) return 1;
        if (ratio < 20) return 2;
        return 3;
    }

    /**
     * Create adaptive quality system based on performance
     * @param {number} targetFPS - Target FPS
     * @returns {Object} Quality controller
     */
    static createAdaptiveQuality(targetFPS = 60) {
        const frameHistory = [];
        const historySize = 60; // Keep 1 second of history at 60fps
        let currentQuality = 1.0;

        return {
            updatePerformance(deltaTime) {
                const fps = 1 / deltaTime;
                frameHistory.push(fps);
                
                if (frameHistory.length > historySize) {
                    frameHistory.shift();
                }

                const averageFPS = frameHistory.reduce((sum, fps) => sum + fps, 0) / frameHistory.length;
                
                // Adjust quality based on performance
                if (averageFPS < targetFPS * 0.8) {
                    currentQuality = Math.max(0.5, currentQuality - 0.1);
                } else if (averageFPS > targetFPS * 0.95) {
                    currentQuality = Math.min(1.0, currentQuality + 0.05);
                }

                return currentQuality;
            },

            getQuality() {
                return currentQuality;
            }
        };
    }
}