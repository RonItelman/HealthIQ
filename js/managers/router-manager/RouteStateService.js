// RouteStateService - Handles route state management and browser history

class RouteStateService {
    constructor() {
        this.currentRoute = null;
        this.routeHistory = [];
        this.maxHistorySize = 50;
        this.routeData = new Map();
        this.isNavigating = false;
        
        if (window.DebugStore) {
            DebugStore.debug('RouteStateService initialized', {}, 'ROUTESTATE');
        }
    }
    
    /**
     * Initialize route state service
     */
    init() {
        this.setupBrowserEvents();
        this.loadInitialRoute();
        
        if (window.DebugStore) {
            DebugStore.debug('RouteStateService init completed', {
                currentRoute: this.currentRoute
            }, 'ROUTESTATE');
        }
    }
    
    /**
     * Setup browser history events
     */
    setupBrowserEvents() {
        // Listen for browser back/forward navigation
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });
        
        // Listen for hash changes (fallback for older browsers)
        window.addEventListener('hashchange', (event) => {
            this.handleHashChange(event);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Browser history events setup', {}, 'ROUTESTATE');
        }
    }
    
    /**
     * Load initial route from current URL
     */
    loadInitialRoute() {
        let path = this.getCurrentPath();
        
        // If path is root (/), redirect to splash for initial load
        if (path === '/' || path === '') {
            path = '/splash';
            // Update browser URL without adding to history
            window.history.replaceState(null, '', path);
        }
        
        const route = this.parseRoute(path);
        
        this.setCurrentRoute(route, false); // Don't push to history on initial load
        
        if (window.DebugStore) {
            DebugStore.info('Initial route loaded', {
                originalPath: this.getCurrentPath(),
                resolvedPath: path,
                route: route
            }, 'ROUTESTATE');
        }
    }
    
    /**
     * Navigate to a new route
     * @param {string} path - Route path
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    navigate(path, data = {}, options = {}) {
        if (this.isNavigating) {
            if (window.DebugStore) {
                DebugStore.warn('Navigation already in progress, ignoring', {
                    currentPath: this.currentRoute?.path,
                    requestedPath: path
                }, 'ROUTESTATE');
            }
            return;
        }
        
        this.isNavigating = true;
        
        try {
            const route = this.parseRoute(path);
            route.data = { ...route.data, ...data };
            
            if (window.DebugStore) {
                DebugStore.info('Navigating to route', {
                    from: this.currentRoute?.path || 'none',
                    to: path,
                    route: route,
                    options: options
                }, 'ROUTESTATE');
            }
            
            // Update browser history unless specified not to
            if (options.replaceState) {
                this.replaceHistoryState(route);
            } else if (options.pushState !== false) {
                this.pushHistoryState(route);
            }
            
            // Update current route
            this.setCurrentRoute(route, true);
            
            // Emit navigation event
            if (window.EventBus) {
                EventBus.emit('route:navigated', {
                    from: this.routeHistory.length > 1 ? this.routeHistory[this.routeHistory.length - 2] : null,
                    to: route,
                    data: data,
                    options: options
                });
            }
            
            if (window.DebugStore) {
                DebugStore.success('Navigation completed', {
                    path: path,
                    route: route
                }, 'ROUTESTATE');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Navigation failed', {
                    path: path,
                    error: error.message
                }, 'ROUTESTATE');
            }
            
            // Emit navigation error
            if (window.EventBus) {
                EventBus.emit('route:navigationError', {
                    path: path,
                    error: error.message
                });
            }
        } finally {
            this.isNavigating = false;
        }
    }
    
    /**
     * Go back in history
     */
    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Fallback to home if no history
            this.navigate('/');
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Going back in history', {
                historyLength: window.history.length
            }, 'ROUTESTATE');
        }
    }
    
    /**
     * Go forward in history
     */
    goForward() {
        window.history.forward();
        
        if (window.DebugStore) {
            DebugStore.debug('Going forward in history', {}, 'ROUTESTATE');
        }
    }
    
    /**
     * Replace current route without adding to history
     * @param {string} path - New path
     * @param {Object} data - Route data
     */
    replace(path, data = {}) {
        this.navigate(path, data, { replaceState: true });
    }
    
    /**
     * Handle browser popstate event
     * @param {PopStateEvent} event - Popstate event
     */
    handlePopState(event) {
        const path = this.getCurrentPath();
        const route = this.parseRoute(path);
        
        // Restore route data from state if available
        if (event.state && event.state.routeData) {
            route.data = event.state.routeData;
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Browser popstate handled', {
                path: path,
                route: route,
                state: event.state
            }, 'ROUTESTATE');
        }
        
        this.setCurrentRoute(route, false); // Don't push to history on popstate
        
        // Emit route change event
        if (window.EventBus) {
            EventBus.emit('route:changed', {
                route: route,
                source: 'popstate'
            });
        }
    }
    
    /**
     * Handle hash change event (fallback)
     * @param {HashChangeEvent} event - Hash change event
     */
    handleHashChange(event) {
        if (window.DebugStore) {
            DebugStore.debug('Hash change detected', {
                oldURL: event.oldURL,
                newURL: event.newURL
            }, 'ROUTESTATE');
        }
        
        // Handle hash-based routing if needed
        const hash = window.location.hash.slice(1);
        if (hash && !this.getCurrentPath().includes(hash)) {
            this.navigate(hash);
        }
    }
    
    /**
     * Set current route
     * @param {Object} route - Route object
     * @param {boolean} addToHistory - Whether to add to route history
     */
    setCurrentRoute(route, addToHistory = true) {
        const previousRoute = this.currentRoute;
        this.currentRoute = route;
        
        // Add to route history
        if (addToHistory) {
            this.addToRouteHistory(route);
        }
        
        // Store route data
        this.routeData.set(route.path, route.data || {});
        
        // Emit route change event
        if (window.EventBus) {
            EventBus.emit('route:changed', {
                from: previousRoute,
                to: route,
                source: 'navigation'
            });
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Current route updated', {
                from: previousRoute?.path,
                to: route.path,
                addedToHistory: addToHistory
            }, 'ROUTESTATE');
        }
    }
    
    /**
     * Parse route path into route object
     * @param {string} path - Route path
     * @returns {Object} - Route object
     */
    parseRoute(path) {
        // Clean the path
        path = path || '/';
        if (path.startsWith('#')) {
            path = path.slice(1);
        }
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Parse path segments
        const segments = path.split('/').filter(segment => segment.length > 0);
        
        // Extract query parameters
        const [pathPart, queryString] = path.split('?');
        const queryParams = this.parseQueryString(queryString);
        
        return {
            path: pathPart || '/',
            segments: segments,
            params: queryParams,
            data: {},
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Parse query string into object
     * @param {string} queryString - Query string
     * @returns {Object} - Query parameters
     */
    parseQueryString(queryString) {
        const params = {};
        if (!queryString) return params;
        
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
        });
        
        return params;
    }
    
    /**
     * Add route to history
     * @param {Object} route - Route to add
     */
    addToRouteHistory(route) {
        this.routeHistory.push(route);
        
        // Trim history if too large
        if (this.routeHistory.length > this.maxHistorySize) {
            this.routeHistory = this.routeHistory.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * Push state to browser history
     * @param {Object} route - Route object
     */
    pushHistoryState(route) {
        const state = {
            routeData: route.data,
            timestamp: route.timestamp
        };
        
        window.history.pushState(state, '', route.path);
        
        if (window.DebugStore) {
            DebugStore.debug('Pushed history state', {
                path: route.path,
                state: state
            }, 'ROUTESTATE');
        }
    }
    
    /**
     * Replace current history state
     * @param {Object} route - Route object
     */
    replaceHistoryState(route) {
        const state = {
            routeData: route.data,
            timestamp: route.timestamp
        };
        
        window.history.replaceState(state, '', route.path);
        
        if (window.DebugStore) {
            DebugStore.debug('Replaced history state', {
                path: route.path,
                state: state
            }, 'ROUTESTATE');
        }
    }
    
    /**
     * Get current URL path
     * @returns {string} - Current path
     */
    getCurrentPath() {
        return window.location.pathname + window.location.search;
    }
    
    /**
     * Get current route
     * @returns {Object|null} - Current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Get route history
     * @returns {Array} - Route history
     */
    getRouteHistory() {
        return [...this.routeHistory];
    }
    
    /**
     * Get route data
     * @param {string} path - Route path
     * @returns {Object} - Route data
     */
    getRouteData(path) {
        return this.routeData.get(path) || {};
    }
    
    /**
     * Set route data
     * @param {string} path - Route path
     * @param {Object} data - Data to set
     */
    setRouteData(path, data) {
        this.routeData.set(path, data);
        
        if (window.DebugStore) {
            DebugStore.debug('Route data updated', {
                path: path,
                dataKeys: Object.keys(data)
            }, 'ROUTESTATE');
        }
    }
    
    /**
     * Check if currently navigating
     * @returns {boolean} - True if navigating
     */
    isCurrentlyNavigating() {
        return this.isNavigating;
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            currentRoute: this.currentRoute,
            routeHistorySize: this.routeHistory.length,
            storedRouteData: this.routeData.size,
            isNavigating: this.isNavigating,
            browserHistoryLength: window.history.length,
            currentPath: this.getCurrentPath()
        };
    }
    
    /**
     * Reset route state
     */
    reset() {
        this.routeHistory = [];
        this.routeData.clear();
        this.isNavigating = false;
        
        // Navigate to home
        this.navigate('/', {}, { replaceState: true });
        
        if (window.DebugStore) {
            DebugStore.info('Route state reset', {}, 'ROUTESTATE');
        }
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('hashchange', this.handleHashChange);
        
        this.routeHistory = [];
        this.routeData.clear();
        
        if (window.DebugStore) {
            DebugStore.debug('RouteStateService destroyed', {}, 'ROUTESTATE');
        }
    }
}

// Export for use in other modules
window.RouteStateService = RouteStateService;