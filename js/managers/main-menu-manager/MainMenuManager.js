// MainMenuManager - Main coordinator for menu operations

class MainMenuManager {
    constructor() {
        // Initialize service components
        this.toggleService = new MenuToggleService();
        this.navigationService = new MenuNavigationService();
        this.uiService = new MenuUIService();
        
        if (window.DebugStore) {
            DebugStore.debug('MainMenuManager initialized', {}, 'MAINMENU');
        }
    }
    
    /**
     * Initialize menu manager
     */
    init() {
        if (window.DebugStore) {
            DebugStore.info('MainMenuManager initialization started', {}, 'MAINMENU');
        }
        
        // Initialize services
        this.toggleService.init();
        this.navigationService.init();
        this.uiService.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.success('MainMenuManager initialized successfully', {
                toggleServiceReady: !!this.toggleService,
                navigationServiceReady: !!this.navigationService,
                uiServiceReady: !!this.uiService,
                elementsReady: this.uiService.areElementsReady()
            }, 'MAINMENU');
        }
        
        console.log('MainMenuManager initialized with coordinated services');
    }
    
    /**
     * Set up event bus listeners
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Menu toggle events
        EventBus.on('menu:toggleRequested', () => {
            this.toggleMenu();
        });
        
        EventBus.on('menu:closeRequested', () => {
            this.closeMenu();
        });
        
        EventBus.on('menu:escapePressed', () => {
            if (this.toggleService.isMenuOpen()) {
                this.closeMenu();
            }
        });
        
        // Menu item navigation events
        EventBus.on('menu:itemClicked', (data) => {
            this.handleMenuItemClick(data.action);
        });
        
        // Listen for menu state changes to update UI
        EventBus.on('menu:opened', () => {
            this.uiService.updateVisualState(true);
        });
        
        EventBus.on('menu:closed', () => {
            this.uiService.updateVisualState(false);
        });
        
        // Navigation completion - close menu after successful navigation
        EventBus.on('navigation:requested', () => {
            this.closeMenu();
        });
        
        if (window.DebugStore) {
            DebugStore.debug('MainMenuManager event listeners setup', {}, 'MAINMENU');
        }
    }
    
    /**
     * Toggle menu open/close
     */
    toggleMenu() {
        this.toggleService.toggleMenu();
        
        if (window.DebugStore) {
            DebugStore.debug('Menu toggle requested', {
                newState: this.toggleService.isMenuOpen()
            }, 'MAINMENU');
        }
    }
    
    /**
     * Open menu
     */
    openMenu() {
        this.toggleService.openMenu();
        
        if (window.DebugStore) {
            DebugStore.debug('Menu open requested', {}, 'MAINMENU');
        }
    }
    
    /**
     * Close menu
     */
    closeMenu() {
        this.toggleService.closeMenu();
        
        if (window.DebugStore) {
            DebugStore.debug('Menu close requested', {}, 'MAINMENU');
        }
    }
    
    /**
     * Handle menu item click and navigation
     * @param {string} action - Menu action
     */
    handleMenuItemClick(action) {
        if (window.DebugStore) {
            DebugStore.info('Menu item click handled', {
                action: action
            }, 'MAINMENU');
        }
        
        // Add visual feedback
        this.uiService.addMenuItemFeedback(action);
        
        // Navigate to requested destination
        this.navigationService.navigateToAction(action);
    }
    
    /**
     * Check if menu is currently open
     * @returns {boolean} - True if menu is open
     */
    isMenuOpen() {
        return this.toggleService.isMenuOpen();
    }
    
    /**
     * Force close menu (for external triggers)
     */
    forceCloseMenu() {
        this.toggleService.forceClose();
        
        if (window.DebugStore) {
            DebugStore.debug('Menu force close requested', {}, 'MAINMENU');
        }
    }
    
    /**
     * Navigate directly to a menu action
     * @param {string} action - Action to navigate to
     */
    navigateToAction(action) {
        if (window.DebugStore) {
            DebugStore.info('Direct navigation requested', {
                action: action
            }, 'MAINMENU');
        }
        
        this.navigationService.navigateToAction(action);
    }
    
    /**
     * Get available navigation actions
     * @returns {Array} - Array of available actions
     */
    getAvailableActions() {
        return this.navigationService.getAvailableActions();
    }
    
    /**
     * Check if action is available
     * @param {string} action - Action to check
     * @returns {boolean} - True if action exists
     */
    isActionAvailable(action) {
        return this.navigationService.isActionAvailable(action);
    }
    
    /**
     * Get comprehensive menu state
     * @returns {Object} - Complete menu state
     */
    getState() {
        return {
            toggle: this.toggleService.getState(),
            ui: this.uiService.getState(),
            navigation: this.navigationService.getStats(),
            manager: {
                initialized: true,
                servicesReady: {
                    toggle: !!this.toggleService,
                    navigation: !!this.navigationService,
                    ui: !!this.uiService
                }
            }
        };
    }
    
    /**
     * Reset menu to default state
     */
    reset() {
        this.toggleService.reset();
        this.uiService.resetVisualState();
        
        if (window.DebugStore) {
            DebugStore.info('Menu manager reset to default state', {}, 'MAINMENU');
        }
    }
    
    /**
     * Check if menu manager is ready
     * @returns {boolean} - True if all services are ready
     */
    isReady() {
        return !!(this.toggleService && 
                 this.navigationService && 
                 this.uiService && 
                 this.uiService.areElementsReady());
    }
    
    /**
     * Get menu statistics
     * @returns {Object} - Menu usage statistics
     */
    getStats() {
        return {
            isOpen: this.isMenuOpen(),
            availableActions: this.getAvailableActions().length,
            elementsReady: this.uiService.areElementsReady(),
            servicesInitialized: {
                toggle: !!this.toggleService,
                navigation: !!this.navigationService,
                ui: !!this.uiService
            }
        };
    }
    
    /**
     * Destroy menu manager (cleanup)
     */
    destroy() {
        // Clean up services
        if (this.uiService && this.uiService.destroy) {
            this.uiService.destroy();
        }
        
        // Reset states
        this.reset();
        
        if (window.DebugStore) {
            DebugStore.debug('MainMenuManager destroyed', {}, 'MAINMENU');
        }
    }
}

// Export for use in other modules
window.MainMenuManager = MainMenuManager;