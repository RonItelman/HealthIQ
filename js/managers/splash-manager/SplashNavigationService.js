// SplashNavigationService - Handles splash screen navigation and routing

class SplashNavigationService {
    constructor() {
        this.isWaitingForUserInput = false;
        this.navigationHandler = null;
        
        if (window.DebugStore) {
            DebugStore.debug('SplashNavigationService initialized', {}, 'SPLASHNAV');
        }
    }
    
    /**
     * Initialize navigation service
     */
    init() {
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('SplashNavigationService init completed', {}, 'SPLASHNAV');
        }
    }
    
    /**
     * Setup event listeners for navigation events
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for app initialization complete
        EventBus.on('app:initialized', () => {
            this.handleAppInitialized();
        });
        
        // Listen for route navigation events
        EventBus.on('splash:userInteraction', () => {
            this.handleUserInteraction();
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Navigation event listeners setup', {}, 'SPLASHNAV');
        }
    }
    
    /**
     * Handle app initialization completion
     */
    handleAppInitialized() {
        // Start waiting for user input instead of auto-navigating
        this.isWaitingForUserInput = true;
        
        if (window.DebugStore) {
            DebugStore.info('App initialized - waiting for user input', {}, 'SPLASHNAV');
        }
        
        // Emit event to show user instruction
        if (window.EventBus) {
            EventBus.emit('splash:waitingForInput', {
                message: 'Tap anywhere to continue'
            });
        }
    }
    
    /**
     * Handle user interaction (click/tap)
     */
    handleUserInteraction() {
        if (!this.isWaitingForUserInput) return;
        
        this.isWaitingForUserInput = false;
        
        if (window.DebugStore) {
            DebugStore.info('User interaction detected - navigating to main', {}, 'SPLASHNAV');
        }
        
        // Navigate to main route
        this.navigateToMain();
    }
    
    /**
     * Navigate to main application route
     */
    navigateToMain() {
        try {
            // Use RouterManager for navigation if available
            if (window.AppRouterManager && window.AppRouterManager.isReady()) {
                window.AppRouterManager.navigate('/main', { source: 'splash' });
            } else {
                // Fallback navigation
                this.fallbackNavigation();
            }
            
            // Emit navigation event
            if (window.EventBus) {
                EventBus.emit('splash:navigationStarted', {
                    destination: '/main',
                    source: 'splash'
                });
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Navigation to main failed', {
                    error: error.message
                }, 'SPLASHNAV');
            }
            
            // Try fallback navigation
            this.fallbackNavigation();
        }
    }
    
    /**
     * Fallback navigation when RouterManager is not available
     */
    fallbackNavigation() {
        if (window.DebugStore) {
            DebugStore.warn('Using fallback navigation', {}, 'SPLASHNAV');
        }
        
        // Emit event to show main interface
        if (window.EventBus) {
            EventBus.emit('app:showMainInterface', {
                source: 'splash'
            });
        }
        
        // Hide splash screen
        if (window.EventBus) {
            EventBus.emit('splash:hide', {
                reason: 'navigation'
            });
        }
    }
    
    /**
     * Set custom navigation handler
     * @param {Function} handler - Custom navigation handler
     */
    setNavigationHandler(handler) {
        this.navigationHandler = handler;
        
        if (window.DebugStore) {
            DebugStore.debug('Custom navigation handler set', {
                hasHandler: !!handler
            }, 'SPLASHNAV');
        }
    }
    
    /**
     * Clear custom navigation handler
     */
    clearNavigationHandler() {
        this.navigationHandler = null;
        
        if (window.DebugStore) {
            DebugStore.debug('Custom navigation handler cleared', {}, 'SPLASHNAV');
        }
    }
    
    /**
     * Check if waiting for user input
     * @returns {boolean} - True if waiting for user input
     */
    isWaitingForInput() {
        return this.isWaitingForUserInput;
    }
    
    /**
     * Force navigation (bypass user input wait)
     */
    forceNavigation() {
        if (window.DebugStore) {
            DebugStore.info('Force navigation triggered', {}, 'SPLASHNAV');
        }
        
        this.isWaitingForUserInput = false;
        this.navigateToMain();
    }
    
    /**
     * Reset navigation state
     */
    reset() {
        this.isWaitingForUserInput = false;
        this.navigationHandler = null;
        
        if (window.DebugStore) {
            DebugStore.debug('Navigation state reset', {}, 'SPLASHNAV');
        }
    }
    
    /**
     * Get navigation statistics
     * @returns {Object} - Navigation stats
     */
    getStats() {
        return {
            isWaitingForInput: this.isWaitingForUserInput,
            hasCustomHandler: !!this.navigationHandler,
            routerAvailable: !!(window.AppRouterManager && window.AppRouterManager.isReady())
        };
    }
    
    /**
     * Destroy navigation service
     */
    destroy() {
        this.reset();
        
        // Remove event listeners
        if (window.EventBus) {
            EventBus.off('app:initialized');
            EventBus.off('splash:userInteraction');
        }
        
        if (window.DebugStore) {
            DebugStore.debug('SplashNavigationService destroyed', {}, 'SPLASHNAV');
        }
    }
}

// Export for use in other modules
window.SplashNavigationService = SplashNavigationService;