import { App } from './app.js';

// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
