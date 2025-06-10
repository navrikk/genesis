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
    },
    Ceres: {
        mass: '9.39 × 10^20 kg',
        gravity: '0.27 m/s²',
        temperature: '-106°C (average)',
        orbitRadius: '414 million km',
        orbitPeriod: '4.6 years',
        rotationPeriod: '9.1 hours',
        description: 'Ceres is the largest object in the asteroid belt between Mars and Jupiter. It is the only dwarf planet in the inner solar system and was the first asteroid to be discovered. Ceres is composed of rock and ice and may have a subsurface ocean.'
    },
    Vesta: {
        mass: '2.59 × 10^20 kg',
        gravity: '0.25 m/s²',
        temperature: '-188°C (average)',
        orbitRadius: '353 million km',
        orbitPeriod: '3.6 years',
        rotationPeriod: '5.3 hours',
        description: 'Vesta is the second-most massive asteroid in the asteroid belt. It has a differentiated interior and shows evidence of ancient volcanic activity. Vesta is notable for having a large impact crater at its south pole that is nearly as large as the asteroid itself.'
    },
    Pallas: {
        mass: '2.04 × 10^20 kg',
        gravity: '0.2 m/s²',
        temperature: '-164°C (average)',
        orbitRadius: '414 million km',
        orbitPeriod: '4.6 years',
        rotationPeriod: '7.8 hours',
        description: 'Pallas is the third-largest asteroid in the asteroid belt. It has an unusually high orbital inclination and is likely a remnant protoplanet. Pallas has a low density, suggesting it may be a rubble pile held together by gravity.'
    },
    Jupiter: {
        mass: '1.898 × 10^27 kg',
        gravity: '24.79 m/s²',
        temperature: '-108°C (cloud tops)',
        orbitRadius: '778.5 million km',
        orbitPeriod: '11.86 years',
        rotationPeriod: '9.9 hours',
        description: 'Jupiter is the largest planet in the Solar System and the fifth planet from the Sun. It is a gas giant with a mass more than twice that of all other planets combined. Jupiter is composed primarily of hydrogen and helium and is known for its Great Red Spot, a giant anticyclonic storm.'
    },
    Saturn: {
        mass: '5.683 × 10^26 kg',
        gravity: '10.44 m/s²',
        temperature: '-178°C (average)',
        orbitRadius: '1.432 billion km',
        orbitPeriod: '29.46 years',
        rotationPeriod: '10.7 hours',
        description: 'Saturn is the sixth planet from the Sun and the second-largest in the Solar System. Known for its spectacular ring system made of ice and rock particles, Saturn is a gas giant composed mostly of hydrogen and helium. It has a very low density and would float in water. Saturn has 146 known moons, including Titan with its thick atmosphere and methane lakes, and Enceladus with its subsurface ocean. The planet features a unique hexagonal storm at its north pole.'
    },
    Io: {
        mass: '8.9319 × 10^22 kg',
        gravity: '1.796 m/s²',
        temperature: '-143°C (average)',
        orbitRadius: '421,700 km (from Jupiter)',
        orbitPeriod: '1.77 days',
        rotationPeriod: '1.77 days (tidally locked)',
        description: 'Io is the innermost of the four Galilean moons of Jupiter and the most volcanically active body in the Solar System. It has over 400 active volcanoes and a sulfur-rich surface that gives it its distinctive yellow and orange coloration.'
    },
    Europa: {
        mass: '4.7998 × 10^22 kg',
        gravity: '1.314 m/s²',
        temperature: '-160°C (surface)',
        orbitRadius: '671,034 km (from Jupiter)',
        orbitPeriod: '3.55 days',
        rotationPeriod: '3.55 days (tidally locked)',
        description: 'Europa is the smallest of the four Galilean moons and has a smooth, icy surface with relatively few craters. It likely harbors a subsurface ocean beneath its ice shell, making it one of the most promising places to search for extraterrestrial life.'
    },
    Ganymede: {
        mass: '1.4819 × 10^23 kg',
        gravity: '1.428 m/s²',
        temperature: '-181°C (average)',
        orbitRadius: '1,070,412 km (from Jupiter)',
        orbitPeriod: '7.15 days',
        rotationPeriod: '7.15 days (tidally locked)',
        description: 'Ganymede is the largest moon in the Solar System and the only moon known to have its own magnetic field. It has a differentiated interior and shows evidence of past geological activity with both dark and bright terrain.'
    },
    Callisto: {
        mass: '1.0759 × 10^23 kg',
        gravity: '1.235 m/s²',
        temperature: '-139°C (average)',
        orbitRadius: '1,882,709 km (from Jupiter)',
        orbitPeriod: '16.69 days',
        rotationPeriod: '16.69 days (tidally locked)',
        description: 'Callisto is the outermost of the four Galilean moons and the most heavily cratered object in the Solar System. It has a very ancient surface that has remained largely unchanged for billions of years.'
    },
    Hygiea: {
        mass: '8.32 × 10^19 kg',
        gravity: '0.14 m/s²',
        temperature: '-180°C (average)',
        orbitRadius: '470 million km',
        orbitPeriod: '5.6 years',
        rotationPeriod: '13.8 hours',
        description: 'Hygiea is the fourth-largest asteroid in the asteroid belt and the largest C-type asteroid. Recent observations suggest it may be nearly spherical enough to qualify as a dwarf planet. It is composed primarily of carbonaceous material and has a very dark surface.'
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
               bodyName === 'Jupiter' ? '69,911 km' :
               bodyName === 'Io' ? '1,821.6 km' :
               bodyName === 'Europa' ? '1,560.8 km' :
               bodyName === 'Ganymede' ? '2,634.1 km' :
               bodyName === 'Callisto' ? '2,410.3 km' :
               bodyName === 'Phobos' ? '11.1 km (mean)' :
               bodyName === 'Deimos' ? '6.2 km (mean)' :
               bodyName === 'Ceres' ? '470 km (mean)' :
               bodyName === 'Vesta' ? '262.7 km (mean)' :
               bodyName === 'Pallas' ? '256 km (mean)' :
               bodyName === 'Hygiea' ? '217 km (mean)' : 'Unknown',
        mass: data.mass || 'Unknown',
        gravity: data.gravity || 'Unknown',
        temperature: data.temperature || 'Unknown',
        orbitRadius: data.orbitRadius || 'Unknown',
        orbitPeriod: data.orbitPeriod || 'Unknown',
        rotationPeriod: data.rotationPeriod || 'Unknown',
        description: data.description || 'No information available.'
    };
}
