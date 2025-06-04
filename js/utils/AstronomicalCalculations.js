/**
 * Astronomical calculations for planetary positions
 * Based on simplified orbital mechanics for January 1, 2031 UTC
 */

// J2000 epoch: January 1, 2000, 12:00 TT
const J2000_EPOCH = 2451545.0;

// Target date: January 1, 2031, 00:00 UTC
const TARGET_DATE = new Date('2031-01-01T00:00:00.000Z');

/**
 * Convert date to Julian Day Number
 */
function dateToJulianDay(date) {
    return (date.getTime() / 86400000) + 2440587.5;
}

/**
 * Calculate days since J2000 epoch
 */
function daysSinceJ2000(date) {
    return dateToJulianDay(date) - J2000_EPOCH;
}

/**
 * Normalize angle to 0-360 degrees
 */
function normalizeAngle(angle) {
    angle = angle % 360;
    return angle < 0 ? angle + 360 : angle;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Orbital elements for planets (simplified)
 * Elements are for J2000.0 epoch with rates per century
 */
const ORBITAL_ELEMENTS = {
    MERCURY: {
        L0: 252.250906, dL: 149472.6746358, // Mean longitude
        a0: 0.38709843, da: 0.00000000,     // Semi-major axis (AU)
        e0: 0.20563661, de: 0.00002123,     // Eccentricity
        I0: 7.00559432, dI: -0.00590158,    // Inclination
        omega0: 77.45771895, domega: 0.15940013, // Longitude of perihelion
        Omega0: 48.33961819, dOmega: -0.12214182 // Longitude of ascending node
    },
    VENUS: {
        L0: 181.979801, dL: 58517.8156760,
        a0: 0.72332102, da: -0.00000026,
        e0: 0.00676399, de: -0.00005107,
        I0: 3.39777545, dI: 0.00043494,
        omega0: 131.76755713, domega: 0.05679648,
        Omega0: 76.67261496, dOmega: -0.27274174
    },
    EARTH: {
        L0: 100.466457, dL: 35999.3728565,
        a0: 1.00000018, da: -0.00000003,
        e0: 0.01673163, de: -0.00003661,
        I0: 0.00005, dI: -0.01337178,
        omega0: 102.93005885, domega: 0.31795260,
        Omega0: -5.11260389, dOmega: -0.24123856
    },
    MARS: {
        L0: 355.433000, dL: 19140.2993039,
        a0: 1.52371243, da: 0.00000097,
        e0: 0.09336511, de: 0.00009149,
        I0: 1.85181869, dI: -0.00724757,
        omega0: 336.04084445, domega: 0.15771958,
        Omega0: 49.71320984, dOmega: -0.26852431
    },
    CERES: {
        L0: 95.9891, dL: 13.0640, // Approximate values
        a0: 2.7691, da: 0.0,
        e0: 0.0756, de: 0.0,
        I0: 10.593, dI: 0.0,
        omega0: 73.597, domega: 0.0,
        Omega0: 80.329, dOmega: 0.0
    },
    VESTA: {
        L0: 307.851, dL: 17.4538,
        a0: 2.3618, da: 0.0,
        e0: 0.0887, de: 0.0,
        I0: 7.140, dI: 0.0,
        omega0: 151.198, domega: 0.0,
        Omega0: 103.926, dOmega: 0.0
    },
    PALLAS: {
        L0: 310.344, dL: 11.9951,
        a0: 2.7732, da: 0.0,
        e0: 0.2313, de: 0.0,
        I0: 34.837, dI: 0.0,
        omega0: 310.162, domega: 0.0,
        Omega0: 173.096, dOmega: 0.0
    },
    HYGIEA: {
        L0: 316.790, dL: 7.5546,
        a0: 3.1395, da: 0.0,
        e0: 0.1146, de: 0.0,
        I0: 3.834, dI: 0.0,
        omega0: 312.330, domega: 0.0,
        Omega0: 283.469, dOmega: 0.0
    }
};

/**
 * Calculate orbital elements for a given date
 */
function calculateOrbitalElements(bodyName, date) {
    const elements = ORBITAL_ELEMENTS[bodyName];
    if (!elements) {
        throw new Error(`Orbital elements not found for ${bodyName}`);
    }
    
    const T = daysSinceJ2000(date) / 36525.0; // Centuries since J2000
    
    return {
        L: normalizeAngle(elements.L0 + elements.dL * T),
        a: elements.a0 + elements.da * T,
        e: elements.e0 + elements.de * T,
        I: elements.I0 + elements.dI * T,
        omega: normalizeAngle(elements.omega0 + elements.domega * T),
        Omega: normalizeAngle(elements.Omega0 + elements.dOmega * T)
    };
}

/**
 * Solve Kepler's equation for eccentric anomaly
 */
function solveKeplerEquation(meanAnomaly, eccentricity, tolerance = 1e-6) {
    let E = meanAnomaly; // Initial guess
    let delta = 1.0;
    
    while (Math.abs(delta) > tolerance) {
        delta = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
        E -= delta;
    }
    
    return E;
}

/**
 * Calculate heliocentric position
 */
function calculateHeliocentricPosition(bodyName, date) {
    const elem = calculateOrbitalElements(bodyName, date);
    
    // Mean anomaly
    const M = toRadians(normalizeAngle(elem.L - elem.omega));
    
    // Eccentric anomaly
    const E = solveKeplerEquation(M, elem.e);
    
    // True anomaly
    const nu = 2 * Math.atan2(
        Math.sqrt(1 + elem.e) * Math.sin(E / 2),
        Math.sqrt(1 - elem.e) * Math.cos(E / 2)
    );
    
    // Distance from Sun
    const r = elem.a * (1 - elem.e * Math.cos(E));
    
    // Position in orbital plane
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    const z_orb = 0;
    
    // Convert to heliocentric ecliptic coordinates
    const omega_rad = toRadians(elem.omega);
    const Omega_rad = toRadians(elem.Omega);
    const I_rad = toRadians(elem.I);
    
    const cos_omega = Math.cos(omega_rad);
    const sin_omega = Math.sin(omega_rad);
    const cos_Omega = Math.cos(Omega_rad);
    const sin_Omega = Math.sin(Omega_rad);
    const cos_I = Math.cos(I_rad);
    const sin_I = Math.sin(I_rad);
    
    const x = (cos_omega * cos_Omega - sin_omega * sin_Omega * cos_I) * x_orb + 
              (-sin_omega * cos_Omega - cos_omega * sin_Omega * cos_I) * y_orb;
    const y = (cos_omega * sin_Omega + sin_omega * cos_Omega * cos_I) * x_orb + 
              (-sin_omega * sin_Omega + cos_omega * cos_Omega * cos_I) * y_orb;
    const z = sin_omega * sin_I * x_orb + cos_omega * sin_I * y_orb;
    
    return { x, y, z, r };
}

/**
 * Calculate orbital angle for a celestial body on the target date
 */
export function calculateOrbitalAngle(bodyName) {
    try {
        const position = calculateHeliocentricPosition(bodyName, TARGET_DATE);
        
        // Calculate angle in the XZ plane (our simulation's orbital plane)
        let angle = Math.atan2(position.z, position.x);
        
        // Normalize to 0-2π range
        if (angle < 0) angle += 2 * Math.PI;
        
        return angle;
    } catch (error) {
        console.warn(`Could not calculate position for ${bodyName}:`, error);
        return 0; // Fallback to default position
    }
}

/**
 * Get all planetary positions for January 1, 2031
 */
export function getAllPlanetaryPositions() {
    const bodies = ['MERCURY', 'VENUS', 'EARTH', 'MARS', 'CERES', 'VESTA', 'PALLAS', 'HYGIEA'];
    const positions = {};
    
    bodies.forEach(body => {
        positions[body] = calculateOrbitalAngle(body);
    });
    
    return positions;
}

/**
 * Moon position relative to Earth (simplified)
 */
export function calculateMoonPosition() {
    // Moon's orbital period is approximately 27.3 days
    const daysSince2000 = daysSinceJ2000(TARGET_DATE);
    const lunarCycles = daysSince2000 / 27.321661;
    const moonAngle = (lunarCycles % 1) * 2 * Math.PI;
    
    return moonAngle;
}