// KeyboardEventService - Handles keyboard shortcuts and interactions

class KeyboardEventService {
    constructor() {
        this.keyboardHandlers = new Map();
        this.activeShortcuts = new Set();
        
        if (window.DebugStore) {
            DebugStore.debug('KeyboardEventService initialized', {}, 'KEYBOARDEVENTS');
        }
    }
    
    /**
     * Initialize keyboard event service
     */
    init() {
        this.setupGlobalKeyboardListeners();
        this.registerDefaultShortcuts();
        
        if (window.DebugStore) {
            DebugStore.debug('KeyboardEventService init completed', {
                shortcutsRegistered: this.activeShortcuts.size
            }, 'KEYBOARDEVENTS');
        }
    }
    
    /**
     * Setup global keyboard listeners
     */
    setupGlobalKeyboardListeners() {
        const keydownHandler = (e) => {
            this.handleKeyDown(e);
        };
        
        const keyupHandler = (e) => {
            this.handleKeyUp(e);
        };
        
        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);
        
        this.keyboardHandlers.set('keydown', keydownHandler);
        this.keyboardHandlers.set('keyup', keyupHandler);
        
        if (window.DebugStore) {
            DebugStore.debug('Global keyboard listeners setup', {}, 'KEYBOARDEVENTS');
        }
    }
    
    /**
     * Register default keyboard shortcuts
     */
    registerDefaultShortcuts() {
        // Escape key - close modals
        this.registerShortcut('Escape', () => {
            this.handleEscapeKey();
        }, 'Close modals and overlays');
        
        // Ctrl+Enter - quick log entry
        this.registerShortcut('Control+Enter', () => {
            this.handleQuickLog();
        }, 'Quick log entry submission');
        
        // Ctrl+Shift+D - debug modal (if enabled)
        this.registerShortcut('Control+Shift+KeyD', () => {
            this.handleDebugShortcut();
        }, 'Open debug modal');
        
        if (window.DebugStore) {
            DebugStore.debug('Default keyboard shortcuts registered', {
                shortcutCount: this.activeShortcuts.size
            }, 'KEYBOARDEVENTS');
        }
    }
    
    /**
     * Handle keydown events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        const shortcutKey = this.buildShortcutKey(e);
        
        if (this.activeShortcuts.has(shortcutKey)) {
            const handler = this.getShortcutHandler(shortcutKey);
            if (handler) {
                e.preventDefault();
                handler(e);
                
                if (window.DebugStore) {
                    DebugStore.debug('Keyboard shortcut executed', {
                        shortcut: shortcutKey,
                        key: e.key,
                        ctrlKey: e.ctrlKey,
                        shiftKey: e.shiftKey,
                        altKey: e.altKey
                    }, 'KEYBOARDEVENTS');
                }
                
                // Emit keyboard shortcut event
                if (window.EventBus) {
                    EventBus.emit('keyboard:shortcutExecuted', {
                        shortcut: shortcutKey,
                        key: e.key,
                        modifiers: {
                            ctrl: e.ctrlKey,
                            shift: e.shiftKey,
                            alt: e.altKey
                        }
                    });
                }
            }
        }
    }
    
    /**
     * Handle keyup events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        // Currently not used, but available for future shortcuts
        // that need keyup handling (like key combinations)
    }
    
    /**
     * Handle Escape key press
     */
    handleEscapeKey() {
        if (window.DebugStore) {
            DebugStore.info('Escape key pressed', {}, 'KEYBOARDEVENTS');
        }
        
        // Emit escape key event
        if (window.EventBus) {
            EventBus.emit('keyboard:escapePressed', {
                timestamp: new Date().toISOString()
            });
        }
        
        // Close log modal if open
        if (window.LogManager && window.LogManager.closeLogModal) {
            window.LogManager.closeLogModal();
        }
        
        // Close health modal if open (legacy support)
        const healthModal = document.getElementById('healthModal');
        if (healthModal && healthModal.style.display === 'block') {
            healthModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Close debug modal if open
        if (window.DebugManager && window.DebugManager.closeDebugModal) {
            window.DebugManager.closeDebugModal();
        }
        
        // Close main menu if open
        if (window.MainMenuManager && window.MainMenuManager.isMenuOpen()) {
            window.MainMenuManager.closeMenu();
        }
    }
    
    /**
     * Handle quick log shortcut (Ctrl+Enter)
     */
    handleQuickLog() {
        if (window.DebugStore) {
            DebugStore.info('Quick log shortcut activated', {}, 'KEYBOARDEVENTS');
        }
        
        // Focus on log textarea if it exists
        const logTextarea = document.getElementById('logText');
        if (logTextarea) {
            logTextarea.focus();
        }
        
        // Emit quick log event
        if (window.EventBus) {
            EventBus.emit('logEntry:quickLogRequested', {
                source: 'keyboard'
            });
        }
    }
    
    /**
     * Handle debug shortcut (Ctrl+Shift+D)
     */
    handleDebugShortcut() {
        if (window.DebugStore) {
            DebugStore.info('Debug shortcut activated', {}, 'KEYBOARDEVENTS');
        }
        
        // Emit debug modal event
        if (window.EventBus) {
            EventBus.emit('debug:showModalRequested', {
                source: 'keyboard'
            });
        }
        
        // Fallback to direct debug manager call
        if (window.DebugManager && window.DebugManager.showDebugModal) {
            window.DebugManager.showDebugModal();
        }
    }
    
    /**
     * Build shortcut key string from keyboard event
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {string} - Shortcut key string
     */
    buildShortcutKey(e) {
        const parts = [];
        
        if (e.ctrlKey) parts.push('Control');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Meta');
        
        // Use e.code for consistent key identification
        const key = e.code || e.key;
        parts.push(key);
        
        return parts.join('+');
    }
    
    /**
     * Register a keyboard shortcut
     * @param {string} shortcut - Shortcut key combination
     * @param {Function} handler - Handler function
     * @param {string} description - Description of shortcut
     */
    registerShortcut(shortcut, handler, description = '') {
        this.activeShortcuts.add(shortcut);
        
        // Store handler in a way we can retrieve it
        if (!window.__keyboardShortcuts) {
            window.__keyboardShortcuts = new Map();
        }
        window.__keyboardShortcuts.set(shortcut, { handler, description });
        
        if (window.DebugStore) {
            DebugStore.debug('Keyboard shortcut registered', {
                shortcut: shortcut,
                description: description
            }, 'KEYBOARDEVENTS');
        }
    }
    
    /**
     * Get shortcut handler
     * @param {string} shortcut - Shortcut key combination
     * @returns {Function|null} - Handler function or null
     */
    getShortcutHandler(shortcut) {
        if (window.__keyboardShortcuts) {
            const shortcutData = window.__keyboardShortcuts.get(shortcut);
            return shortcutData ? shortcutData.handler : null;
        }
        return null;
    }
    
    /**
     * Unregister a keyboard shortcut
     * @param {string} shortcut - Shortcut key combination
     */
    unregisterShortcut(shortcut) {
        this.activeShortcuts.delete(shortcut);
        
        if (window.__keyboardShortcuts) {
            window.__keyboardShortcuts.delete(shortcut);
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Keyboard shortcut unregistered', {
                shortcut: shortcut
            }, 'KEYBOARDEVENTS');
        }
    }
    
    /**
     * Get all registered shortcuts
     * @returns {Array} - Array of shortcut objects
     */
    getRegisteredShortcuts() {
        const shortcuts = [];
        
        if (window.__keyboardShortcuts) {
            window.__keyboardShortcuts.forEach((data, shortcut) => {
                shortcuts.push({
                    shortcut: shortcut,
                    description: data.description
                });
            });
        }
        
        return shortcuts;
    }
    
    /**
     * Check if shortcut is registered
     * @param {string} shortcut - Shortcut to check
     * @returns {boolean} - True if shortcut is registered
     */
    isShortcutRegistered(shortcut) {
        return this.activeShortcuts.has(shortcut);
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            totalShortcuts: this.activeShortcuts.size,
            registeredShortcuts: this.getRegisteredShortcuts(),
            activeShortcuts: Array.from(this.activeShortcuts)
        };
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        // Remove global keyboard listeners
        this.keyboardHandlers.forEach((handler, eventType) => {
            document.removeEventListener(eventType, handler);
        });
        
        this.keyboardHandlers.clear();
        this.activeShortcuts.clear();
        
        // Clear global shortcuts
        if (window.__keyboardShortcuts) {
            window.__keyboardShortcuts.clear();
        }
        
        if (window.DebugStore) {
            DebugStore.debug('KeyboardEventService destroyed', {}, 'KEYBOARDEVENTS');
        }
    }
}

// Export for use in other modules
window.KeyboardEventService = KeyboardEventService;