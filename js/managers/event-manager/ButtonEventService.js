// ButtonEventService - Handles main UI button interactions

class ButtonEventService {
    constructor() {
        this.buttonHandlers = new Map();
        
        if (window.DebugStore) {
            DebugStore.debug('ButtonEventService initialized', {}, 'BUTTONEVENTS');
        }
    }
    
    /**
     * Initialize button event service
     */
    init() {
        this.setupMainButtons();
        this.setupModalButtons();
        
        if (window.DebugStore) {
            DebugStore.debug('ButtonEventService init completed', {
                handlersRegistered: this.buttonHandlers.size
            }, 'BUTTONEVENTS');
        }
    }
    
    /**
     * Setup main interface buttons
     */
    setupMainButtons() {
        // Log button
        this.addButtonHandler('logBtn', () => {
            this.handleLogButtonClick();
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Main UI buttons setup', {}, 'BUTTONEVENTS');
        }
    }
    
    /**
     * Setup modal action buttons
     */
    setupModalButtons() {
        // Close modal button
        this.addButtonHandler('closeBtn', () => {
            this.handleCloseButtonClick();
        });
        
        // Copy as markdown button
        this.addButtonHandler('copyBtn', () => {
            this.handleCopyButtonClick();
        });
        
        // Toggle summary/analysis view button
        this.addButtonHandler('summaryBtn', () => {
            this.handleSummaryButtonClick();
        });
        
        // Clear logs button
        this.addButtonHandler('clearLogsBtn', () => {
            this.handleClearLogsButtonClick();
        });
        
        // Copy JSON data button
        this.addButtonHandler('dataBtn', () => {
            this.handleDataButtonClick();
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Modal buttons setup', {
                modalButtonCount: 5
            }, 'BUTTONEVENTS');
        }
    }
    
    /**
     * Add button event handler
     * @param {string} buttonId - Button element ID
     * @param {Function} handler - Click handler function
     */
    addButtonHandler(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handler);
            this.buttonHandlers.set(buttonId, handler);
            
            if (window.DebugStore) {
                DebugStore.debug('Button handler added', {
                    buttonId: buttonId
                }, 'BUTTONEVENTS');
            }
        } else {
            if (window.DebugStore) {
                DebugStore.warn('Button not found', {
                    buttonId: buttonId
                }, 'BUTTONEVENTS');
            }
        }
    }
    
    /**
     * Handle log button click
     */
    handleLogButtonClick() {
        if (window.DebugStore) {
            DebugStore.info('Log button clicked', {}, 'BUTTONEVENTS');
        }
        
        // Emit event for log creation
        if (window.EventBus) {
            EventBus.emit('logEntry:createRequested', {
                source: 'logButton',
                timestamp: new Date().toISOString()
            });
        }
        
        // Fallback to LogManager direct call
        if (window.LogManager && window.LogManager.createEntry) {
            window.LogManager.createEntry();
        } else {
            console.warn('LogManager not available');
        }
    }
    
    /**
     * Handle close button click
     */
    handleCloseButtonClick() {
        if (window.DebugStore) {
            DebugStore.info('Close button clicked', {}, 'BUTTONEVENTS');
        }
        
        // Emit modal close event
        if (window.EventBus) {
            EventBus.emit('modal:closeRequested', {
                source: 'closeButton',
                modalType: 'log'
            });
        }
        
        // Fallback to LogManager direct call
        if (window.LogManager && window.LogManager.closeLogModal) {
            window.LogManager.closeLogModal();
        }
    }
    
    /**
     * Handle copy button click
     */
    handleCopyButtonClick() {
        if (window.DebugStore) {
            DebugStore.info('Copy markdown button clicked', {}, 'BUTTONEVENTS');
        }
        
        // Emit copy markdown event
        if (window.EventBus) {
            EventBus.emit('clipboard:copyMarkdownRequested', {
                source: 'copyButton'
            });
        }
    }
    
    /**
     * Handle summary button click
     */
    handleSummaryButtonClick() {
        if (window.DebugStore) {
            DebugStore.info('Summary/analysis button clicked', {}, 'BUTTONEVENTS');
        }
        
        // Emit view toggle event
        if (window.EventBus) {
            EventBus.emit('logView:toggleRequested', {
                viewType: 'summary',
                source: 'summaryButton'
            });
        }
        
        // Fallback to LogManager direct call
        if (window.LogManager && window.LogManager.toggleView) {
            window.LogManager.toggleView('summary');
        }
    }
    
    /**
     * Handle clear logs button click
     */
    handleClearLogsButtonClick() {
        if (window.DebugStore) {
            DebugStore.info('Clear logs button clicked', {}, 'BUTTONEVENTS');
        }
        
        // Emit clear logs event
        if (window.EventBus) {
            EventBus.emit('logEntry:clearAllRequested', {
                source: 'clearButton'
            });
        }
    }
    
    /**
     * Handle data button click
     */
    handleDataButtonClick() {
        if (window.DebugStore) {
            DebugStore.info('Copy JSON data button clicked', {}, 'BUTTONEVENTS');
        }
        
        // Emit copy JSON event
        if (window.EventBus) {
            EventBus.emit('clipboard:copyJSONRequested', {
                source: 'dataButton'
            });
        }
    }
    
    /**
     * Animate button after action
     * @param {string} buttonId - Button ID
     * @param {string} tempIcon - Temporary icon to show
     * @param {string} originalIcon - Original icon to restore
     * @param {number} duration - Animation duration in ms
     */
    animateButton(buttonId, tempIcon, originalIcon, duration = 2000) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        
        const iconElement = btn.querySelector('.material-symbols-outlined');
        if (!iconElement) return;
        
        const originalIconText = iconElement.textContent;
        iconElement.textContent = tempIcon;
        
        setTimeout(() => {
            iconElement.textContent = originalIconText;
        }, duration);
        
        if (window.DebugStore) {
            DebugStore.debug('Button animated', {
                buttonId: buttonId,
                tempIcon: tempIcon,
                duration: duration
            }, 'BUTTONEVENTS');
        }
    }
    
    /**
     * Get registered button handlers
     * @returns {Array} - Array of button IDs
     */
    getRegisteredButtons() {
        return Array.from(this.buttonHandlers.keys());
    }
    
    /**
     * Check if button is registered
     * @param {string} buttonId - Button ID to check
     * @returns {boolean} - True if button is registered
     */
    isButtonRegistered(buttonId) {
        return this.buttonHandlers.has(buttonId);
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            totalButtons: this.buttonHandlers.size,
            registeredButtons: this.getRegisteredButtons(),
            mainButtons: ['logBtn'],
            modalButtons: ['closeBtn', 'copyBtn', 'summaryBtn', 'clearLogsBtn', 'dataBtn']
        };
    }
    
    /**
     * Remove button handler
     * @param {string} buttonId - Button ID to remove
     */
    removeButtonHandler(buttonId) {
        const button = document.getElementById(buttonId);
        const handler = this.buttonHandlers.get(buttonId);
        
        if (button && handler) {
            button.removeEventListener('click', handler);
            this.buttonHandlers.delete(buttonId);
            
            if (window.DebugStore) {
                DebugStore.debug('Button handler removed', {
                    buttonId: buttonId
                }, 'BUTTONEVENTS');
            }
        }
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        // Remove all button handlers
        this.buttonHandlers.forEach((handler, buttonId) => {
            this.removeButtonHandler(buttonId);
        });
        
        this.buttonHandlers.clear();
        
        if (window.DebugStore) {
            DebugStore.debug('ButtonEventService destroyed', {}, 'BUTTONEVENTS');
        }
    }
}

// Export for use in other modules
window.ButtonEventService = ButtonEventService;