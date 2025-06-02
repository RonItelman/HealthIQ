// SplashManager - Main coordinator for splash screen functionality

class SplashManager {
    constructor() {
        // Initialize service components
        this.uiService = new SplashUIService();
        this.animationService = new SplashAnimationService();
        this.navigationService = new SplashNavigationService();
        
        this.isInitialized = false;
        this.isVisible = false;
        this.clickHandler = null;
        
        if (window.DebugStore) {
            DebugStore.debug('SplashManager initialized', {}, 'SPLASHMANAGER');
        }
    }
    
    /**
     * Initialize splash manager
     */
    init() {
        if (this.isInitialized) {
            if (window.DebugStore) {
                DebugStore.warn('SplashManager already initialized', {}, 'SPLASHMANAGER');
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.info('SplashManager initialization started', {}, 'SPLASHMANAGER');
        }
        
        try {
            // Initialize services in order
            this.uiService.init();
            this.animationService.init();
            this.navigationService.init();
            
            // Setup cross-service coordination
            this.setupServiceCoordination();
            
            this.isInitialized = true;
            
            if (window.DebugStore) {
                DebugStore.success('SplashManager initialized successfully', {
                    uiServiceReady: !!this.uiService,
                    animationServiceReady: !!this.animationService,
                    navigationServiceReady: !!this.navigationService
                }, 'SPLASHMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('SplashManager initialization failed', {
                    error: error.message
                }, 'SPLASHMANAGER');
            }
            throw error;
        }
    }
    
    /**
     * Setup coordination between splash services
     */
    setupServiceCoordination() {
        if (!window.EventBus) return;
        
        // Listen for splash hide events
        EventBus.on('splash:hide', (data) => {
            this.hide();
        });
        
        // Listen for splash show events
        EventBus.on('splash:show', (data) => {
            this.show();
        });
        
        // Listen for user interaction
        EventBus.on('splash:userInteraction', (data) => {
            this.handleUserInteraction(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('SplashManager service coordination setup', {}, 'SPLASHMANAGER');
        }
    }
    
    /**
     * Show splash screen
     */
    show() {
        if (!this.isInitialized) {
            if (window.DebugStore) {
                DebugStore.error('Cannot show splash - not initialized', {}, 'SPLASHMANAGER');
            }
            return;
        }
        
        if (this.isVisible) {
            if (window.DebugStore) {
                DebugStore.warn('Splash already visible', {}, 'SPLASHMANAGER');
            }
            return;
        }
        
        try {
            // Create and show UI
            this.uiService.createSplashHTML();
            this.uiService.show();
            
            // Setup canvas and start animation
            const canvas = this.uiService.getCanvas();
            if (canvas) {
                this.animationService.setupCanvas(canvas);
                this.animationService.startAnimation();
            }
            
            // Setup click handler for user interaction
            this.setupClickHandler();
            
            this.isVisible = true;
            
            // Emit splash shown event
            if (window.EventBus) {
                EventBus.emit('splash:shown', {
                    timestamp: new Date().toISOString()
                });
            }
            
            if (window.DebugStore) {
                DebugStore.info('Splash screen shown', {
                    hasCanvas: !!canvas,
                    animationRunning: this.animationService.isRunning()
                }, 'SPLASHMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to show splash screen', {
                    error: error.message
                }, 'SPLASHMANAGER');
            }
        }
    }
    
    /**
     * Hide splash screen
     */
    hide() {
        if (!this.isVisible) return;
        
        try {
            // Stop animation
            this.animationService.stopAnimation();
            
            // Remove click handler
            this.removeClickHandler();
            
            // Hide UI
            this.uiService.hide();
            
            this.isVisible = false;
            
            // Emit splash hidden event
            if (window.EventBus) {
                EventBus.emit('splash:hidden', {
                    timestamp: new Date().toISOString()
                });
            }
            
            if (window.DebugStore) {
                DebugStore.info('Splash screen hidden', {}, 'SPLASHMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to hide splash screen', {
                    error: error.message
                }, 'SPLASHMANAGER');
            }
        }
    }
    
    /**
     * Setup click handler for user interaction
     */
    setupClickHandler() {
        this.clickHandler = (event) => {
            event.preventDefault();
            
            if (window.DebugStore) {
                DebugStore.info('User interaction detected on splash', {
                    eventType: event.type
                }, 'SPLASHMANAGER');
            }
            
            // Emit user interaction event
            if (window.EventBus) {
                EventBus.emit('splash:userInteraction', {
                    eventType: event.type,
                    timestamp: new Date().toISOString()
                });
            }
        };
        
        this.uiService.addClickHandler(this.clickHandler);
    }
    
    /**
     * Remove click handler
     */
    removeClickHandler() {
        if (this.clickHandler) {
            this.uiService.removeClickHandler(this.clickHandler);
            this.clickHandler = null;
        }
    }
    
    /**
     * Handle user interaction
     * @param {Object} data - Interaction data
     */
    handleUserInteraction(data) {
        if (window.DebugStore) {
            DebugStore.debug('Handling user interaction', {
                data: data
            }, 'SPLASHMANAGER');
        }
        
        // Let navigation service handle the navigation
        // (it will check if it's waiting for input)
    }
    
    /**
     * Check if splash is visible
     * @returns {boolean} - True if splash is visible
     */
    isVisible() {
        return this.isVisible;
    }
    
    /**
     * Check if splash is ready
     * @returns {boolean} - True if splash is ready
     */
    isReady() {
        return this.isInitialized && 
               this.uiService && 
               this.animationService && 
               this.navigationService;
    }
    
    /**
     * Update splash configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
        if (config.animation) {
            this.animationService.updateConfig(config.animation);
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Splash config updated', {
                config: config
            }, 'SPLASHMANAGER');
        }
    }
    
    /**
     * Get comprehensive splash state
     * @returns {Object} - Complete splash state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isVisible: this.isVisible,
            ui: this.uiService.getStats(),
            animation: this.animationService.getStats(),
            navigation: this.navigationService.getStats()
        };
    }
    
    /**
     * Get splash statistics
     * @returns {Object} - Splash usage statistics
     */
    getStats() {
        return {
            isReady: this.isReady(),
            isVisible: this.isVisible,
            animationRunning: this.animationService.isRunning(),
            waitingForInput: this.navigationService.isWaitingForInput(),
            servicesInitialized: {
                ui: !!this.uiService,
                animation: !!this.animationService,
                navigation: !!this.navigationService
            }
        };
    }
    
    /**
     * Reset splash state
     */
    reset() {
        this.hide();
        this.navigationService.reset();
        
        if (window.DebugStore) {
            DebugStore.info('SplashManager reset', {}, 'SPLASHMANAGER');
        }
    }
    
    /**
     * Destroy splash manager (cleanup)
     */
    destroy() {
        // Clean up services
        if (this.animationService) {
            this.animationService.destroy();
        }
        
        if (this.navigationService) {
            this.navigationService.destroy();
        }
        
        // Remove click handler
        this.removeClickHandler();
        
        // Hide UI
        if (this.isVisible) {
            this.hide();
        }
        
        this.isInitialized = false;
        
        if (window.DebugStore) {
            DebugStore.debug('SplashManager destroyed', {}, 'SPLASHMANAGER');
        }
    }
}

// Export for use in other modules
window.SplashManager = SplashManager;