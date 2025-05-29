# Genesis - Interactive 3D Solar System Visualization

Genesis is an interactive 3D web application that simulates our solar system, allowing users to explore and learn about celestial bodies including the Sun, planets, and moons.

## Features

- Realistic 3D models of the Sun, planets (Mercury, Venus, Earth, Mars), and moons (Earth's Moon, Mars' Phobos and Deimos)
- Accurate orbital mechanics and rotations
- Interactive camera controls for exploring the solar system
- Detailed information panels for each celestial body
- Beautiful visual effects including sun glow and star field
- Ambient space soundtrack

## Technologies Used

- Three.js for 3D rendering and animations
- JavaScript (ES6+) for application logic
- HTML5 and CSS3 for structure and styling
- Tailwind CSS for UI components
- Vite as the build tool and development server

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Development

Run the development server:

```
npm run dev
```

This will start a local development server, typically at http://localhost:5173

### Building for Production

Create a production build:

```
npm run build
```

Preview the production build:

```
npm run preview
```

## Browser Compatibility

Genesis requires WebGL support. It works best in modern browsers such as:
- Chrome
- Firefox
- Safari
- Edge

## License

ISC License

## Acknowledgments

- Three.js community for the powerful 3D library
- NASA for reference data on celestial bodies
