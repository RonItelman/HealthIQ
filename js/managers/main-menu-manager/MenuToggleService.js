// MenuToggleService - Handles menu open/close state management

class MenuToggleService {
    constructor() {
        this.isOpen = false;
        
        if (window.DebugStore) {
            DebugStore.debug('MenuToggleService initialized', {}, 'MENUTOGGLE');
        }
    }
    
    /**
     * Initialize toggle service
     */
    init() {
        if (window.DebugStore) {
            DebugStore.debug('MenuToggleService init completed', {}, 'MENUTOGGLE');
        }
    }
    
    /**
     * Toggle menu open/close
     */
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Menu toggled', {
                isOpen: this.isOpen
            }, 'MENUTOGGLE');
        }
    }
    
    /**
     * Open menu
     */
    openMenu() {
        if (this.isOpen) {
            if (window.DebugStore) {
                DebugStore.debug('Menu already open, ignoring open request', {}, 'MENUTOGGLE');
            }
            return;
        }
        
        this.isOpen = true;
        
        // Emit menu opened event
        if (window.EventBus) {
            EventBus.emit('menu:opened', {
                menuType: 'main',
                timestamp: new Date().toISOString()
            });
        }
        
        if (window.DebugStore) {
            DebugStore.info('Main menu opened', {}, 'MENUTOGGLE');
        }
    }
    
    /**
     * Close menu
     */
    closeMenu() {
        if (!this.isOpen) {
            if (window.DebugStore) {
                DebugStore.debug('Menu already closed, ignoring close request', {}, 'MENUTOGGLE');
            }
            return;
        }
        
        this.isOpen = false;
        
        // Emit menu closed event
        if (window.EventBus) {
            EventBus.emit('menu:closed', {
                menuType: 'main',
                timestamp: new Date().toISOString()
            });
        }
        
        if (window.DebugStore) {
            DebugStore.info('Main menu closed', {}, 'MENUTOGGLE');
        }
    }
    
    /**
     * Check if menu is open
     * @returns {boolean} - True if menu is open
     */
    isMenuOpen() {
        return this.isOpen;
    }
    
    /**
     * Force close menu (for external triggers)
     */
    forceClose() {
        if (this.isOpen) {
            this.closeMenu();
            
            if (window.DebugStore) {
                DebugStore.debug('Menu force closed', {}, 'MENUTOGGLE');
            }
        }
    }
    
    /**
     * Get current state
     * @returns {Object} - Current state
     */
    getState() {
        return {
            isOpen: this.isOpen,
            lastToggled: new Date().toISOString()
        };
    }
    
    /**
     * Reset state (for cleanup/testing)
     */
    reset() {
        this.isOpen = false;
        
        if (window.DebugStore) {
            DebugStore.debug('Menu toggle state reset', {}, 'MENUTOGGLE');
        }
    }
}

// Export for use in other modules
window.MenuToggleService = MenuToggleService;