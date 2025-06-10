import * as THREE from 'three';

/**
 * Animation utilities for smooth interpolation and frame rate management
 */
export class AnimationUtils {
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
}