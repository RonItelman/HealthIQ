// SplashUIService - Handles splash screen DOM creation and styling

class SplashUIService {
    constructor() {
        this.splashElement = null;
        this.isCreated = false;
        
        if (window.DebugStore) {
            DebugStore.debug('SplashUIService initialized', {}, 'SPLASHUI');
        }
    }
    
    /**
     * Initialize UI service
     */
    init() {
        if (window.DebugStore) {
            DebugStore.debug('SplashUIService init completed', {}, 'SPLASHUI');
        }
    }
    
    /**
     * Create splash screen HTML structure
     */
    createSplashHTML() {
        if (this.isCreated) {
            if (window.DebugStore) {
                DebugStore.warn('Splash HTML already created', {}, 'SPLASHUI');
            }
            return;
        }
        
        const splashHTML = `
            <div id="splashScreen" class="splash-screen">
                <div class="splash-content">
                    <div class="splash-logo">
                        <img src="logo.svg" alt="Dots Logo" class="splash-logo-img">
                        <div class="splash-app-name">Dots</div>
                    </div>
                    <canvas id="splashCanvas" class="splash-canvas"></canvas>
                    <div class="splash-tagline">Connecting Your Health Patterns</div>
                    <div class="splash-instruction">Tap anywhere to continue</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', splashHTML);
        this.splashElement = document.getElementById('splashScreen');
        this.isCreated = true;
        
        if (window.DebugStore) {
            DebugStore.debug('Splash HTML created', {
                element: !!this.splashElement
            }, 'SPLASHUI');
        }
    }
    
    /**
     * Show splash screen with animations
     */
    show() {
        if (!this.splashElement) {
            if (window.DebugStore) {
                DebugStore.error('Cannot show splash - element not created', {}, 'SPLASHUI');
            }
            return;
        }
        
        this.splashElement.style.display = 'flex';
        
        // Fade in animation
        setTimeout(() => {
            this.splashElement.classList.add('splash-visible');
        }, 10);
        
        // Staggered logo animation
        setTimeout(() => {
            const logo = document.querySelector('.splash-logo');
            if (logo) logo.classList.add('logo-visible');
        }, 200);
        
        setTimeout(() => {
            const tagline = document.querySelector('.splash-tagline');
            if (tagline) tagline.classList.add('tagline-visible');
        }, 800);
        
        setTimeout(() => {
            const instruction = document.querySelector('.splash-instruction');
            if (instruction) instruction.classList.add('instruction-visible');
        }, 1200);
        
        if (window.DebugStore) {
            DebugStore.info('Splash screen shown', {}, 'SPLASHUI');
        }
    }
    
    /**
     * Hide splash screen with fade out animation
     * @param {number} fadeOutDuration - Duration of fade out animation
     */
    hide(fadeOutDuration = 600) {
        if (!this.splashElement) return;
        
        // Fade out animation
        this.splashElement.classList.add('splash-hiding');
        
        setTimeout(() => {
            if (this.splashElement) {
                this.splashElement.style.display = 'none';
                this.splashElement.remove();
                this.splashElement = null;
                this.isCreated = false;
            }
        }, fadeOutDuration);
        
        if (window.DebugStore) {
            DebugStore.info('Splash screen hidden', {
                fadeOutDuration: fadeOutDuration
            }, 'SPLASHUI');
        }
    }
    
    /**
     * Get splash canvas element
     * @returns {HTMLCanvasElement|null} - Canvas element
     */
    getCanvas() {
        return document.getElementById('splashCanvas');
    }
    
    /**
     * Get splash screen element
     * @returns {HTMLElement|null} - Splash screen element
     */
    getSplashElement() {
        return this.splashElement;
    }
    
    /**
     * Check if splash is created
     * @returns {boolean} - True if splash HTML is created
     */
    isCreated() {
        return this.isCreated;
    }
    
    /**
     * Add click/tap handler to splash screen
     * @param {Function} handler - Click handler function
     */
    addClickHandler(handler) {
        if (!this.splashElement) return;
        
        this.splashElement.addEventListener('click', handler);
        this.splashElement.addEventListener('touchend', handler);
        
        if (window.DebugStore) {
            DebugStore.debug('Click handler added to splash screen', {}, 'SPLASHUI');
        }
    }
    
    /**
     * Remove click/tap handler from splash screen
     * @param {Function} handler - Click handler function
     */
    removeClickHandler(handler) {
        if (!this.splashElement) return;
        
        this.splashElement.removeEventListener('click', handler);
        this.splashElement.removeEventListener('touchend', handler);
        
        if (window.DebugStore) {
            DebugStore.debug('Click handler removed from splash screen', {}, 'SPLASHUI');
        }
    }
    
    /**
     * Get UI service statistics
     * @returns {Object} - UI service stats
     */
    getStats() {
        return {
            isCreated: this.isCreated,
            hasElement: !!this.splashElement,
            elementId: this.splashElement?.id || null
        };
    }
}

// Export for use in other modules
window.SplashUIService = SplashUIService;