// MenuNavigationService - Handles menu item navigation and routing

class MenuNavigationService {
    constructor() {
        this.menuActions = {
            health: this.navigateToHealth.bind(this),
            viewLogs: this.navigateToViewLogs.bind(this),
            think: this.navigateToThink.bind(this),
            debug: this.navigateToDebug.bind(this)
        };
        
        if (window.DebugStore) {
            DebugStore.debug('MenuNavigationService initialized', {
                actionsCount: Object.keys(this.menuActions).length
            }, 'MENUNAV');
        }
    }
    
    /**
     * Initialize navigation service
     */
    init() {
        if (window.DebugStore) {
            DebugStore.debug('MenuNavigationService init completed', {}, 'MENUNAV');
        }
    }
    
    /**
     * Handle navigation to health issues
     */
    navigateToHealth() {
        if (window.DebugStore) {
            DebugStore.info('Navigating to health issues', {}, 'MENUNAV');
        }
        
        try {
            // Use RouterManager for navigation if available
            if (window.AppRouterManager && window.AppRouterManager.isReady()) {
                window.AppRouterManager.navigate('/health', { source: 'mainMenu' });
            } else {
                // Fallback to direct modal if router not available
                if (window.EventBus) {
                    EventBus.emit('navigation:requested', {
                        destination: 'health',
                        source: 'mainMenu'
                    });
                }
                
                if (window.HealthManager && window.HealthManager.showHealthModal) {
                    window.HealthManager.showHealthModal();
                } else if (window.Health && window.Health.showHealthModal) {
                    window.Health.showHealthModal();
                } else {
                    console.warn('Health modal handler not found');
                    this.showNavigationError('Health');
                }
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Health navigation failed', {
                    error: error.message
                }, 'MENUNAV');
            }
            this.showNavigationError('Health');
        }
    }
    
    /**
     * Handle navigation to view logs
     */
    navigateToViewLogs() {
        if (window.DebugStore) {
            DebugStore.info('Navigating to view logs', {}, 'MENUNAV');
        }
        
        try {
            // Use RouterManager for navigation if available
            if (window.AppRouterManager && window.AppRouterManager.isReady()) {
                window.AppRouterManager.navigate('/logs', { source: 'mainMenu' });
            } else {
                // Fallback to direct modal if router not available
                if (window.EventBus) {
                    EventBus.emit('navigation:requested', {
                        destination: 'viewLogs',
                        source: 'mainMenu'
                    });
                }
                
                if (window.LogManager && window.LogManager.showLogModal) {
                    window.LogManager.showLogModal();
                } else {
                    console.warn('LogManager not found');
                    this.showNavigationError('View Logs');
                }
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('View logs navigation failed', {
                    error: error.message
                }, 'MENUNAV');
            }
            this.showNavigationError('View Logs');
        }
    }
    
    /**
     * Handle navigation to think view
     */
    navigateToThink() {
        if (window.DebugStore) {
            DebugStore.info('Navigating to think view', {}, 'MENUNAV');
        }
        
        try {
            // Emit navigation event
            if (window.EventBus) {
                EventBus.emit('navigation:requested', {
                    destination: 'think',
                    source: 'mainMenu'
                });
            }
            
            // Use ThinkModalManager or fallback to legacy
            if (window.ThinkModalManager && window.ThinkModalManager.open) {
                window.ThinkModalManager.open();
            } else if (window.ThinkModal && window.ThinkModal.open) {
                window.ThinkModal.open();
            } else if (window.EventHandler && window.EventHandler.showThinkView) {
                window.EventHandler.showThinkView();
            } else {
                console.warn('Think modal handler not found');
                this.showNavigationError('Think');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Think navigation failed', {
                    error: error.message
                }, 'MENUNAV');
            }
            this.showNavigationError('Think');
        }
    }
    
    /**
     * Handle navigation to debug view
     */
    navigateToDebug() {
        if (window.DebugStore) {
            DebugStore.info('Navigating to debug view', {}, 'MENUNAV');
        }
        
        try {
            // Emit navigation event
            if (window.EventBus) {
                EventBus.emit('navigation:requested', {
                    destination: 'debug',
                    source: 'mainMenu'
                });
            }
            
            // Use new DebugManager if available, fallback to legacy
            if (window.DebugManager && window.DebugManager.showDebugModal) {
                window.DebugManager.showDebugModal();
            } else if (window.DebugModal && window.DebugModal.showModal) {
                window.DebugModal.showModal();
            } else {
                console.warn('Debug modal handler not found');
                this.showNavigationError('Debug');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Debug navigation failed', {
                    error: error.message
                }, 'MENUNAV');
            }
            this.showNavigationError('Debug');
        }
    }
    
    /**
     * Handle navigation by action name
     * @param {string} action - Action name (health, viewLogs, think, debug)
     */
    navigateToAction(action) {
        if (window.DebugStore) {
            DebugStore.debug('Navigation action requested', {
                action: action
            }, 'MENUNAV');
        }
        
        if (this.menuActions[action]) {
            this.menuActions[action]();
        } else {
            console.warn(`Unknown navigation action: ${action}`);
            if (window.DebugStore) {
                DebugStore.warn('Unknown navigation action', {
                    action: action,
                    availableActions: Object.keys(this.menuActions)
                }, 'MENUNAV');
            }
        }
    }
    
    /**
     * Show navigation error to user
     * @param {string} destination - Destination that failed
     */
    showNavigationError(destination) {
        // Emit toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: `Sorry, ${destination} is temporarily unavailable`,
                type: 'error'
            });
        }
        
        // Emit error event
        if (window.EventBus) {
            EventBus.emit('navigation:failed', {
                destination: destination,
                source: 'mainMenu',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Get available navigation actions
     * @returns {Array} - Array of available action names
     */
    getAvailableActions() {
        return Object.keys(this.menuActions);
    }
    
    /**
     * Check if action is available
     * @param {string} action - Action to check
     * @returns {boolean} - True if action exists
     */
    isActionAvailable(action) {
        return this.menuActions.hasOwnProperty(action);
    }
    
    /**
     * Get navigation statistics
     * @returns {Object} - Navigation stats
     */
    getStats() {
        return {
            availableActions: this.getAvailableActions().length,
            actions: this.getAvailableActions()
        };
    }
}

// Export for use in other modules
window.MenuNavigationService = MenuNavigationService;