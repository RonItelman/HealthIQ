// MenuUIService - Handles menu DOM interactions and visual feedback

class MenuUIService {
    constructor() {
        this.elements = {};
        this.eventListeners = new Map();
        
        if (window.DebugStore) {
            DebugStore.debug('MenuUIService initialized', {}, 'MENUUI');
        }
    }
    
    /**
     * Initialize UI service
     */
    init() {
        this.findElements();
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('MenuUIService init completed', {
                elementsFound: Object.keys(this.elements).length
            }, 'MENUUI');
        }
    }
    
    /**
     * Find menu elements in DOM
     */
    findElements() {
        this.elements = {
            headerLeft: document.querySelector('.header-left'),
            mainMenu: document.getElementById('mainMenu'),
            menuOverlay: document.getElementById('menuOverlay'),
            menuHealthBtn: document.getElementById('menuHealthBtn'),
            menuViewBtn: document.getElementById('menuViewBtn'),
            menuThinkBtn: document.getElementById('menuThinkBtn'),
            menuDebugBtn: document.getElementById('menuDebugBtn')
        };
        
        // Verify required elements exist
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.warn('MenuUIService: Missing elements:', missingElements);
            if (window.DebugStore) {
                DebugStore.warn('Missing menu elements', {
                    missingElements: missingElements
                }, 'MENUUI');
            }
        }
    }
    
    /**
     * Setup event listeners for menu UI
     */
    setupEventListeners() {
        // Header click to toggle menu
        if (this.elements.headerLeft) {
            const headerClickHandler = (e) => {
                e.preventDefault();
                this.handleHeaderClick();
            };
            this.elements.headerLeft.addEventListener('click', headerClickHandler);
            this.eventListeners.set('headerClick', headerClickHandler);
        }
        
        // Overlay click to close menu
        if (this.elements.menuOverlay) {
            const overlayClickHandler = () => {
                this.handleOverlayClick();
            };
            this.elements.menuOverlay.addEventListener('click', overlayClickHandler);
            this.eventListeners.set('overlayClick', overlayClickHandler);
        }
        
        // Menu item clicks
        this.setupMenuItemListeners();
        
        // Keyboard events
        this.setupKeyboardListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('Menu UI event listeners setup', {
                listenerCount: this.eventListeners.size
            }, 'MENUUI');
        }
    }
    
    /**
     * Setup menu item event listeners
     */
    setupMenuItemListeners() {
        const menuItems = [
            { element: this.elements.menuHealthBtn, action: 'health' },
            { element: this.elements.menuViewBtn, action: 'viewLogs' },
            { element: this.elements.menuThinkBtn, action: 'think' },
            { element: this.elements.menuDebugBtn, action: 'debug' }
        ];
        
        menuItems.forEach(({ element, action }) => {
            if (element) {
                const handler = () => {
                    this.handleMenuItemClick(action);
                };
                element.addEventListener('click', handler);
                this.eventListeners.set(`menuItem_${action}`, handler);
            }
        });
    }
    
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        const keydownHandler = (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        };
        document.addEventListener('keydown', keydownHandler);
        this.eventListeners.set('keydown', keydownHandler);
    }
    
    /**
     * Handle header click
     */
    handleHeaderClick() {
        if (window.EventBus) {
            EventBus.emit('menu:toggleRequested', {
                source: 'header'
            });
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Header clicked for menu toggle', {}, 'MENUUI');
        }
    }
    
    /**
     * Handle overlay click
     */
    handleOverlayClick() {
        if (window.EventBus) {
            EventBus.emit('menu:closeRequested', {
                source: 'overlay'
            });
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Overlay clicked to close menu', {}, 'MENUUI');
        }
    }
    
    /**
     * Handle menu item click
     * @param {string} action - Menu action
     */
    handleMenuItemClick(action) {
        if (window.EventBus) {
            EventBus.emit('menu:itemClicked', {
                action: action,
                timestamp: new Date().toISOString()
            });
        }
        
        if (window.DebugStore) {
            DebugStore.info('Menu item clicked', {
                action: action
            }, 'MENUUI');
        }
    }
    
    /**
     * Handle escape key press
     */
    handleEscapeKey() {
        if (window.EventBus) {
            EventBus.emit('menu:escapePressed', {
                timestamp: new Date().toISOString()
            });
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Escape key pressed', {}, 'MENUUI');
        }
    }
    
    /**
     * Show menu visually
     */
    showMenu() {
        if (this.elements.mainMenu) {
            this.elements.mainMenu.classList.add('menu-open');
        }
        
        if (this.elements.menuOverlay) {
            this.elements.menuOverlay.classList.add('overlay-visible');
        }
        
        if (this.elements.headerLeft) {
            this.elements.headerLeft.classList.add('menu-active');
        }
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        if (window.DebugStore) {
            DebugStore.debug('Menu shown visually', {}, 'MENUUI');
        }
    }
    
    /**
     * Hide menu visually
     */
    hideMenu() {
        if (this.elements.mainMenu) {
            this.elements.mainMenu.classList.remove('menu-open');
        }
        
        if (this.elements.menuOverlay) {
            this.elements.menuOverlay.classList.remove('overlay-visible');
        }
        
        if (this.elements.headerLeft) {
            this.elements.headerLeft.classList.remove('menu-active');
        }
        
        // Restore body scrolling
        document.body.style.overflow = 'auto';
        
        if (window.DebugStore) {
            DebugStore.debug('Menu hidden visually', {}, 'MENUUI');
        }
    }
    
    /**
     * Update menu visual state
     * @param {boolean} isOpen - Whether menu should be shown as open
     */
    updateVisualState(isOpen) {
        if (isOpen) {
            this.showMenu();
        } else {
            this.hideMenu();
        }
    }
    
    /**
     * Add visual feedback to menu item
     * @param {string} action - Menu action
     */
    addMenuItemFeedback(action) {
        const element = this.elements[`menu${action.charAt(0).toUpperCase() + action.slice(1)}Btn`];
        if (element) {
            element.classList.add('menu-item-active');
            
            // Remove feedback after short delay
            setTimeout(() => {
                element.classList.remove('menu-item-active');
            }, 200);
        }
    }
    
    /**
     * Check if menu elements are properly loaded
     * @returns {boolean} - True if all essential elements are found
     */
    areElementsReady() {
        const essentialElements = ['headerLeft', 'mainMenu', 'menuOverlay'];
        return essentialElements.every(key => this.elements[key]);
    }
    
    /**
     * Get current UI state
     * @returns {Object} - Current UI state
     */
    getState() {
        return {
            elementsReady: this.areElementsReady(),
            menuVisible: this.elements.mainMenu?.classList.contains('menu-open') || false,
            overlayVisible: this.elements.menuOverlay?.classList.contains('overlay-visible') || false,
            headerActive: this.elements.headerLeft?.classList.contains('menu-active') || false,
            bodyScrollLocked: document.body.style.overflow === 'hidden'
        };
    }
    
    /**
     * Reset visual state (for cleanup)
     */
    resetVisualState() {
        this.hideMenu();
        
        if (window.DebugStore) {
            DebugStore.debug('Menu UI visual state reset', {}, 'MENUUI');
        }
    }
    
    /**
     * Destroy UI service (cleanup)
     */
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach((handler, key) => {
            if (key === 'keydown') {
                document.removeEventListener('keydown', handler);
            } else if (key === 'headerClick' && this.elements.headerLeft) {
                this.elements.headerLeft.removeEventListener('click', handler);
            } else if (key === 'overlayClick' && this.elements.menuOverlay) {
                this.elements.menuOverlay.removeEventListener('click', handler);
            } else if (key.startsWith('menuItem_')) {
                const action = key.replace('menuItem_', '');
                const element = this.elements[`menu${action.charAt(0).toUpperCase() + action.slice(1)}Btn`];
                if (element) {
                    element.removeEventListener('click', handler);
                }
            }
        });
        
        this.eventListeners.clear();
        this.resetVisualState();
        
        if (window.DebugStore) {
            DebugStore.debug('MenuUIService destroyed', {}, 'MENUUI');
        }
    }
}

// Export for use in other modules
window.MenuUIService = MenuUIService;