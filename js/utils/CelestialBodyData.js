/**
 * Celestial body data for the info panel
 */
export const CELESTIAL_BODY_DATA = {
    Sun: {
        mass: '1.989 × 10^30 kg',
        gravity: '274 m/s²',
        temperature: '5,500°C (surface)',
        orbitRadius: 'N/A',
        orbitPeriod: 'N/A',
        rotationPeriod: '25-35 days',
        description: 'The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core. The Sun radiates energy mainly as light, ultraviolet, and infrared radiation, and is the most important source of energy for life on Earth.'
    },
    Mercury: {
        mass: '3.3011 × 10^23 kg',
        gravity: '3.7 m/s²',
        temperature: '-173°C to 427°C',
        orbitRadius: '57.9 million km',
        orbitPeriod: '88 days',
        rotationPeriod: '58.6 days',
        description: 'Mercury is the smallest and innermost planet in the Solar System. It has a cratered surface similar to the Moon and has no natural satellites. Mercury has a large iron core that generates a magnetic field about 1% as strong as Earth\'s.'
    },
    Venus: {
        mass: '4.8675 × 10^24 kg',
        gravity: '8.87 m/s²',
        temperature: '462°C',
        orbitRadius: '108.2 million km',
        orbitPeriod: '225 days',
        rotationPeriod: '243 days (retrograde)',
        description: 'Venus is the second planet from the Sun. It has the densest atmosphere of all terrestrial planets, consisting mainly of carbon dioxide. The atmospheric pressure at the planet\'s surface is about 92 times the sea level pressure of Earth. Venus is the hottest planet in our solar system.'
    },
    Earth: {
        mass: '5.97237 × 10^24 kg',
        gravity: '9.807 m/s²',
        temperature: '15°C (average)',
        orbitRadius: '149.6 million km',
        orbitPeriod: '365.25 days',
        rotationPeriod: '23.93 hours',
        description: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of Earth\'s surface is covered with water. Earth\'s atmosphere consists of 78% nitrogen, 21% oxygen, and 1% other gases.'
    },
    Moon: {
        mass: '7.342 × 10^22 kg',
        gravity: '1.62 m/s²',
        temperature: '-173°C to 127°C',
        orbitRadius: '384,400 km (from Earth)',
        orbitPeriod: '27.3 days',
        rotationPeriod: '27.3 days (tidally locked)',
        description: 'The Moon is Earth\'s only natural satellite. It is the fifth-largest satellite in the Solar System and the largest and most massive relative to its parent planet. The Moon is a differentiated body with a geochemically distinct crust, mantle, and core.'
    },
    Mars: {
        mass: '6.4171 × 10^23 kg',
        gravity: '3.721 m/s²',
        temperature: '-153°C to 20°C',
        orbitRadius: '227.9 million km',
        orbitPeriod: '687 days',
        rotationPeriod: '24.6 hours',
        description: 'Mars is the fourth planet from the Sun. It has a thin atmosphere and is a dusty, cold desert world with a very thin atmosphere. Mars is also a dynamic planet with seasons, polar ice caps, canyons, extinct volcanoes, and evidence that it was even more active in the past.'
    },
    Phobos: {
        mass: '1.0659 × 10^16 kg',
        gravity: '0.0057 m/s²',
        temperature: '-40°C (average)',
        orbitRadius: '9,376 km (from Mars)',
        orbitPeriod: '7.7 hours',
        rotationPeriod: '7.7 hours (tidally locked)',
        description: 'Phobos is the innermost and larger of the two natural satellites of Mars. It is named after the Greek god Phobos, a son of Ares (Mars) and Aphrodite (Venus). Phobos is a small, irregularly shaped object with a mean radius of 11 km and is heavily cratered.'
    },
    Deimos: {
        mass: '1.4762 × 10^15 kg',
        gravity: '0.003 m/s²',
        temperature: '-40°C (average)',
        orbitRadius: '23,463 km (from Mars)',
        orbitPeriod: '30.3 hours',
        rotationPeriod: '30.3 hours (tidally locked)',
        description: 'Deimos is the smaller and outermost of the two natural satellites of Mars. It is named after Deimos, a figure representing dread in Greek mythology. Deimos has a mean radius of 6.2 km and takes 30.3 hours to orbit Mars.'
    }
};

/**
 * Get formatted data for a celestial body
 * @param {string} bodyName - Name of the celestial body
 * @param {number} radius - Radius in km
 * @returns {Object} Formatted data for the info panel
 */
export function getBodyData(bodyName) {
    const data = CELESTIAL_BODY_DATA[bodyName] || {};
    
    return {
        name: bodyName,
        radius: bodyName === 'Sun' ? '696,340 km' :
               bodyName === 'Mercury' ? '2,439.7 km' :
               bodyName === 'Venus' ? '6,051.8 km' :
               bodyName === 'Earth' ? '6,371 km' :
               bodyName === 'Moon' ? '1,737.4 km' :
               bodyName === 'Mars' ? '3,389.5 km' :
               bodyName === 'Phobos' ? '11.1 km (mean)' :
               bodyName === 'Deimos' ? '6.2 km (mean)' : 'Unknown',
        mass: data.mass || 'Unknown',
        gravity: data.gravity || 'Unknown',
        temperature: data.temperature || 'Unknown',
        orbitRadius: data.orbitRadius || 'Unknown',
        orbitPeriod: data.orbitPeriod || 'Unknown',
        rotationPeriod: data.rotationPeriod || 'Unknown',
        description: data.description || 'No information available.'
    };
}
