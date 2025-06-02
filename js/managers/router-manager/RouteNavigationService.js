// RouteNavigationService - Handles programmatic navigation and URL generation

class RouteNavigationService {
    constructor() {
        this.navigationHistory = [];
        this.maxHistorySize = 100;
        this.navigationQueue = [];
        this.isNavigating = false;
        
        if (window.DebugStore) {
            DebugStore.debug('RouteNavigationService initialized', {}, 'ROUTENAV');
        }
    }
    
    /**
     * Initialize navigation service
     */
    init() {
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('RouteNavigationService init completed', {}, 'ROUTENAV');
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for navigation requests
        EventBus.on('route:navigate', (data) => {
            this.navigate(data.path, data.data, data.options);
        });
        
        // Listen for navigation requests from components
        EventBus.on('navigation:requested', (data) => {
            this.handleComponentNavigation(data);
        });
        
        // Listen for menu navigation
        EventBus.on('menu:itemClicked', (data) => {
            this.handleMenuNavigation(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('RouteNavigationService event listeners setup', {}, 'ROUTENAV');
        }
    }
    
    /**
     * Navigate to a path
     * @param {string} path - Path to navigate to
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    navigate(path, data = {}, options = {}) {
        if (!path) {
            if (window.DebugStore) {
                DebugStore.warn('Navigation attempted with empty path', {}, 'ROUTENAV');
            }
            return;
        }
        
        // Queue navigation if currently navigating
        if (this.isNavigating && !options.force) {
            this.queueNavigation(path, data, options);
            return;
        }
        
        this.isNavigating = true;
        
        try {
            if (window.DebugStore) {
                DebugStore.info('Navigation started', {
                    path: path,
                    data: data,
                    options: options
                }, 'ROUTENAV');
            }
            
            // Record navigation
            this.recordNavigation(path, data, options);
            
            // Emit navigation started event
            if (window.EventBus) {
                EventBus.emit('navigation:started', {
                    path: path,
                    data: data,
                    options: options
                });
            }
            
            // Use RouteStateService to perform navigation
            if (window.RouteStateService) {
                window.RouteStateService.navigate(path, data, options);
            } else {
                // Fallback to manual URL update
                this.fallbackNavigate(path, options);
            }
            
            if (window.DebugStore) {
                DebugStore.success('Navigation completed', {
                    path: path
                }, 'ROUTENAV');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Navigation failed', {
                    path: path,
                    error: error.message
                }, 'ROUTENAV');
            }
            
            // Emit navigation error
            if (window.EventBus) {
                EventBus.emit('navigation:failed', {
                    path: path,
                    error: error.message
                });
            }
        } finally {
            this.isNavigating = false;
            this.processNavigationQueue();
        }
    }
    
    /**
     * Navigate to a named route
     * @param {string} routeName - Route name
     * @param {Object} params - Route parameters
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    navigateToRoute(routeName, params = {}, data = {}, options = {}) {
        // Get route by name from RouteHandlerService
        if (window.RouteHandlerService) {
            const route = window.RouteHandlerService.getRouteByName(routeName);
            if (route) {
                // Build URL with parameters
                const url = this.buildURL(route.path, params);
                this.navigate(url, data, options);
                return;
            }
        }
        
        if (window.DebugStore) {
            DebugStore.warn('Named route not found', {
                routeName: routeName
            }, 'ROUTENAV');
        }
        
        // Fallback to home
        this.navigate('/');
    }
    
    /**
     * Go back in navigation history
     */
    goBack() {
        if (window.DebugStore) {
            DebugStore.info('Going back in navigation', {}, 'ROUTENAV');
        }
        
        if (window.RouteStateService) {
            window.RouteStateService.goBack();
        } else {
            window.history.back();
        }
    }
    
    /**
     * Go forward in navigation history
     */
    goForward() {
        if (window.DebugStore) {
            DebugStore.info('Going forward in navigation', {}, 'ROUTENAV');
        }
        
        if (window.RouteStateService) {
            window.RouteStateService.goForward();
        } else {
            window.history.forward();
        }
    }
    
    /**
     * Replace current route
     * @param {string} path - New path
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    replace(path, data = {}, options = {}) {
        this.navigate(path, data, { ...options, replaceState: true });
    }
    
    /**
     * Handle component navigation requests
     * @param {Object} data - Navigation data
     */
    handleComponentNavigation(data) {
        const { destination, source } = data;
        
        if (window.DebugStore) {
            DebugStore.debug('Component navigation request', {
                destination: destination,
                source: source
            }, 'ROUTENAV');
        }
        
        // Map component destinations to routes
        const routeMap = {
            'health': '/health',
            'viewLogs': '/logs',
            'think': '/think',
            'debug': '/debug',
            'home': '/',
            'logs': '/logs'
        };
        
        const path = routeMap[destination];
        if (path) {
            this.navigate(path, { source: source });
        } else {
            if (window.DebugStore) {
                DebugStore.warn('Unknown navigation destination', {
                    destination: destination,
                    availableDestinations: Object.keys(routeMap)
                }, 'ROUTENAV');
            }
        }
    }
    
    /**
     * Handle menu navigation
     * @param {Object} data - Menu data
     */
    handleMenuNavigation(data) {
        const { action } = data;
        
        if (window.DebugStore) {
            DebugStore.debug('Menu navigation request', {
                action: action
            }, 'ROUTENAV');
        }
        
        // Map menu actions to routes
        const actionMap = {
            'health': '/health',
            'viewLogs': '/logs',
            'think': '/think',
            'debug': '/debug'
        };
        
        const path = actionMap[action];
        if (path) {
            this.navigate(path, { source: 'menu', action: action });
        }
    }
    
    /**
     * Queue navigation for later execution
     * @param {string} path - Path to navigate to
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    queueNavigation(path, data, options) {
        this.navigationQueue.push({
            path: path,
            data: data,
            options: options,
            queuedAt: new Date().toISOString()
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Navigation queued', {
                path: path,
                queueSize: this.navigationQueue.length
            }, 'ROUTENAV');
        }
    }
    
    /**
     * Process queued navigation
     */
    processNavigationQueue() {
        if (this.navigationQueue.length > 0 && !this.isNavigating) {
            const nextNavigation = this.navigationQueue.shift();
            
            if (window.DebugStore) {
                DebugStore.debug('Processing queued navigation', {
                    path: nextNavigation.path,
                    remainingQueue: this.navigationQueue.length
                }, 'ROUTENAV');
            }
            
            // Use a small delay to prevent rapid navigation
            setTimeout(() => {
                this.navigate(nextNavigation.path, nextNavigation.data, nextNavigation.options);
            }, 50);
        }
    }
    
    /**
     * Record navigation in history
     * @param {string} path - Navigation path
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    recordNavigation(path, data, options) {
        const record = {
            path: path,
            data: data,
            options: options,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 50)
        };
        
        this.navigationHistory.push(record);
        
        // Trim history if too large
        if (this.navigationHistory.length > this.maxHistorySize) {
            this.navigationHistory = this.navigationHistory.slice(-this.maxHistorySize);
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Navigation recorded', {
                path: path,
                historySize: this.navigationHistory.length
            }, 'ROUTENAV');
        }
    }
    
    /**
     * Build URL with parameters
     * @param {string} path - Base path
     * @param {Object} params - URL parameters
     * @returns {string} - Built URL
     */
    buildURL(path, params = {}) {
        let url = path;
        
        // Replace path parameters (future feature)
        // For now, just add query parameters
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                queryParams.append(key, value.toString());
            }
        });
        
        const queryString = queryParams.toString();
        if (queryString) {
            url += '?' + queryString;
        }
        
        return url;
    }
    
    /**
     * Fallback navigation for when RouteStateService is not available
     * @param {string} path - Path to navigate to
     * @param {Object} options - Navigation options
     */
    fallbackNavigate(path, options = {}) {
        if (options.replaceState) {
            window.history.replaceState(null, '', path);
        } else {
            window.history.pushState(null, '', path);
        }
        
        // Trigger route change manually
        if (window.EventBus) {
            EventBus.emit('route:changed', {
                to: { path: path },
                source: 'fallback'
            });
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Fallback navigation executed', {
                path: path,
                replaceState: options.replaceState
            }, 'ROUTENAV');
        }
    }
    
    /**
     * Get current URL
     * @returns {string} - Current URL
     */
    getCurrentURL() {
        return window.location.pathname + window.location.search + window.location.hash;
    }
    
    /**
     * Get navigation history
     * @returns {Array} - Navigation history
     */
    getNavigationHistory() {
        return [...this.navigationHistory];
    }
    
    /**
     * Clear navigation history
     */
    clearNavigationHistory() {
        this.navigationHistory = [];
        
        if (window.DebugStore) {
            DebugStore.info('Navigation history cleared', {}, 'ROUTENAV');
        }
    }
    
    /**
     * Get navigation statistics
     * @returns {Object} - Navigation stats
     */
    getNavigationStats() {
        const stats = {
            totalNavigations: this.navigationHistory.length,
            isNavigating: this.isNavigating,
            queuedNavigations: this.navigationQueue.length,
            recentNavigations: this.navigationHistory.slice(-5),
            routeFrequency: {}
        };
        
        // Calculate route frequency
        this.navigationHistory.forEach(record => {
            const path = record.path;
            stats.routeFrequency[path] = (stats.routeFrequency[path] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Check if currently navigating
     * @returns {boolean} - True if navigating
     */
    isCurrentlyNavigating() {
        return this.isNavigating;
    }
    
    /**
     * Get queued navigation count
     * @returns {number} - Number of queued navigations
     */
    getQueuedNavigationCount() {
        return this.navigationQueue.length;
    }
    
    /**
     * Clear navigation queue
     */
    clearNavigationQueue() {
        this.navigationQueue = [];
        
        if (window.DebugStore) {
            DebugStore.info('Navigation queue cleared', {}, 'ROUTENAV');
        }
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            navigationHistory: this.navigationHistory.length,
            isNavigating: this.isNavigating,
            queuedNavigations: this.navigationQueue.length,
            currentURL: this.getCurrentURL(),
            navigationStats: this.getNavigationStats()
        };
    }
    
    /**
     * Reset navigation service
     */
    reset() {
        this.navigationHistory = [];
        this.navigationQueue = [];
        this.isNavigating = false;
        
        if (window.DebugStore) {
            DebugStore.info('RouteNavigationService reset', {}, 'ROUTENAV');
        }
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        this.reset();
        
        if (window.DebugStore) {
            DebugStore.debug('RouteNavigationService destroyed', {}, 'ROUTENAV');
        }
    }
}

// Export for use in other modules
window.RouteNavigationService = RouteNavigationService;