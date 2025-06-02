// RouterManager - Main coordinator for all routing operations

class RouterManager {
    constructor() {
        // Initialize service components
        this.stateService = new RouteStateService();
        this.handlerService = new RouteHandlerService();
        this.navigationService = new RouteNavigationService();
        
        this.isInitialized = false;
        
        if (window.DebugStore) {
            DebugStore.debug('RouterManager initialized', {}, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Initialize router manager
     */
    init() {
        if (this.isInitialized) {
            if (window.DebugStore) {
                DebugStore.warn('RouterManager already initialized', {}, 'ROUTERMANAGER');
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.info('RouterManager initialization started', {}, 'ROUTERMANAGER');
        }
        
        try {
            // Initialize services in order
            this.handlerService.init();  // Register routes first
            this.navigationService.init(); // Setup navigation handling
            this.stateService.init();    // Start state management and load initial route
            
            // Setup cross-service coordination
            this.setupServiceCoordination();
            
            // Setup application routing integration
            this.setupApplicationIntegration();
            
            this.isInitialized = true;
            
            if (window.DebugStore) {
                DebugStore.success('RouterManager initialized successfully', {
                    stateServiceReady: !!this.stateService,
                    handlerServiceReady: !!this.handlerService,
                    navigationServiceReady: !!this.navigationService,
                    registeredRoutes: this.handlerService.getStats().routeCount,
                    currentRoute: this.stateService.getCurrentRoute()?.path
                }, 'ROUTERMANAGER');
            }
            
            console.log('RouterManager initialized with client-side routing');
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('RouterManager initialization failed', {
                    error: error.message
                }, 'ROUTERMANAGER');
            }
            throw error;
        }
    }
    
    /**
     * Setup coordination between routing services
     */
    setupServiceCoordination() {
        if (!window.EventBus) return;
        
        // Listen for route changes to update app state
        EventBus.on('route:changed', (data) => {
            this.handleRouteChange(data);
        });
        
        // Listen for navigation events to update debug logs
        EventBus.on('navigation:started', (data) => {
            this.logNavigationEvent('started', data);
        });
        
        EventBus.on('navigation:failed', (data) => {
            this.logNavigationEvent('failed', data);
        });
        
        // Listen for route handling events
        EventBus.on('route:handled', (data) => {
            this.handleRouteHandled(data);
        });
        
        EventBus.on('route:error', (data) => {
            this.handleRouteError(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('RouterManager service coordination setup', {}, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Setup integration with existing application components
     */
    setupApplicationIntegration() {
        if (!window.EventBus) return;
        
        // Integrate with modal system
        EventBus.on('modal:opened', (data) => {
            this.handleModalOpened(data);
        });
        
        EventBus.on('modal:closed', (data) => {
            this.handleModalClosed(data);
        });
        
        // Integrate with menu system
        EventBus.on('menu:opened', () => {
            this.updateRouteData({ menuOpen: true });
        });
        
        EventBus.on('menu:closed', () => {
            this.updateRouteData({ menuOpen: false });
        });
        
        // Listen for app state changes
        EventBus.on('app:stateChanged', (data) => {
            this.updateRouteData({ appState: data });
        });
        
        if (window.DebugStore) {
            DebugStore.debug('RouterManager application integration setup', {}, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Handle route change
     * @param {Object} data - Route change data
     */
    handleRouteChange(data) {
        const route = data.to;
        
        if (window.DebugStore) {
            DebugStore.info('Route change handled by RouterManager', {
                from: data.from?.path,
                to: route.path,
                source: data.source
            }, 'ROUTERMANAGER');
        }
        
        // Update app state with current route
        this.updateAppState(route);
        
        // Log route change for analytics
        this.logRouteChange(data);
        
        // Emit app-level route change event
        if (window.EventBus) {
            EventBus.emit('app:routeChanged', {
                route: route,
                previousRoute: data.from,
                routeData: this.stateService.getRouteData(route.path)
            });
        }
    }
    
    /**
     * Handle route successfully handled
     * @param {Object} data - Route handled data
     */
    handleRouteHandled(data) {
        if (window.DebugStore) {
            DebugStore.debug('Route successfully handled', {
                path: data.route.path,
                routeName: data.matchedRoute.name
            }, 'ROUTERMANAGER');
        }
        
        // Update route data with success info
        this.updateRouteData({
            handledAt: new Date().toISOString(),
            handledSuccessfully: true,
            routeName: data.matchedRoute.name
        });
    }
    
    /**
     * Handle route error
     * @param {Object} data - Route error data
     */
    handleRouteError(data) {
        if (window.DebugStore) {
            DebugStore.error('Route handling error', {
                path: data.route.path,
                error: data.error
            }, 'ROUTERMANAGER');
        }
        
        // Update route data with error info
        this.updateRouteData({
            handledAt: new Date().toISOString(),
            handledSuccessfully: false,
            error: data.error
        });
        
        // Show user-friendly error notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: 'Navigation error occurred',
                type: 'error'
            });
        }
    }
    
    /**
     * Handle modal opened
     * @param {Object} data - Modal data
     */
    handleModalOpened(data) {
        // Update URL to reflect modal state for deep linking
        const currentRoute = this.stateService.getCurrentRoute();
        if (currentRoute) {
            const modalRouteMap = {
                'logModal': '/logs',
                'healthModal': '/health',
                'thinkModal': '/think',
                'debugModal': '/debug'
            };
            
            const routePath = modalRouteMap[data.modalId];
            if (routePath && currentRoute.path !== routePath) {
                // Update URL without triggering route handler (modal is already open)
                this.stateService.replace(routePath, { 
                    modalId: data.modalId,
                    modalType: data.modalType,
                    openedFromRoute: currentRoute.path
                });
            }
        }
        
        // Update route data
        this.updateRouteData({
            openModal: data.modalId,
            modalType: data.modalType
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Modal opened, route updated', {
                modalId: data.modalId,
                modalType: data.modalType
            }, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Handle modal closed
     * @param {Object} data - Modal data
     */
    handleModalClosed(data) {
        const currentRoute = this.stateService.getCurrentRoute();
        if (currentRoute) {
            const routeData = this.stateService.getRouteData(currentRoute.path);
            
            // If modal was opened from a different route, go back
            if (routeData.openedFromRoute && routeData.openedFromRoute !== '/') {
                this.navigate(routeData.openedFromRoute);
            } else if (currentRoute.path !== '/') {
                // Otherwise go to home
                this.navigate('/');
            }
        }
        
        // Update route data
        this.updateRouteData({
            openModal: null,
            modalType: null,
            openedFromRoute: null
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Modal closed, route updated', {
                modalId: data.modalId
            }, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Update app state with current route information
     * @param {Object} route - Current route
     */
    updateAppState(route) {
        // Store route information globally for other managers
        if (!window.AppState) {
            window.AppState = {};
        }
        
        window.AppState.currentRoute = route;
        window.AppState.routeHistory = this.stateService.getRouteHistory();
        window.AppState.routeData = this.stateService.getRouteData(route.path);
        
        if (window.DebugStore) {
            DebugStore.debug('App state updated with route info', {
                currentRoute: route.path,
                routeDataKeys: Object.keys(window.AppState.routeData)
            }, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Log navigation event
     * @param {string} eventType - Event type (started, failed, etc.)
     * @param {Object} data - Event data
     */
    logNavigationEvent(eventType, data) {
        if (window.DebugStore) {
            DebugStore.debug(`Navigation ${eventType}`, {
                path: data.path,
                data: data.data,
                options: data.options,
                error: data.error
            }, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Log route change for analytics
     * @param {Object} data - Route change data
     */
    logRouteChange(data) {
        // This could be extended to send analytics to external services
        if (window.DebugStore) {
            DebugStore.info('Route change logged', {
                from: data.from?.path || 'none',
                to: data.to.path,
                source: data.source,
                timestamp: new Date().toISOString()
            }, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Update route data for current route
     * @param {Object} data - Data to merge with current route data
     */
    updateRouteData(data) {
        const currentRoute = this.stateService.getCurrentRoute();
        if (currentRoute) {
            const existingData = this.stateService.getRouteData(currentRoute.path);
            const newData = { ...existingData, ...data };
            this.stateService.setRouteData(currentRoute.path, newData);
        }
    }
    
    /**
     * Public API Methods
     */
    
    /**
     * Navigate to a path
     * @param {string} path - Path to navigate to
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    navigate(path, data = {}, options = {}) {
        this.navigationService.navigate(path, data, options);
    }
    
    /**
     * Navigate to a named route
     * @param {string} routeName - Route name
     * @param {Object} params - Route parameters
     * @param {Object} data - Route data
     * @param {Object} options - Navigation options
     */
    navigateToRoute(routeName, params = {}, data = {}, options = {}) {
        this.navigationService.navigateToRoute(routeName, params, data, options);
    }
    
    /**
     * Go back in history
     */
    goBack() {
        this.navigationService.goBack();
    }
    
    /**
     * Go forward in history
     */
    goForward() {
        this.navigationService.goForward();
    }
    
    /**
     * Replace current route
     * @param {string} path - New path
     * @param {Object} data - Route data
     */
    replace(path, data = {}) {
        this.navigationService.replace(path, data);
    }
    
    /**
     * Get current route
     * @returns {Object|null} - Current route
     */
    getCurrentRoute() {
        return this.stateService.getCurrentRoute();
    }
    
    /**
     * Get current path
     * @returns {string} - Current path
     */
    getCurrentPath() {
        const route = this.getCurrentRoute();
        return route ? route.path : '/';
    }
    
    /**
     * Get route history
     * @returns {Array} - Route history
     */
    getRouteHistory() {
        return this.stateService.getRouteHistory();
    }
    
    /**
     * Get registered routes
     * @returns {Array} - Array of route info
     */
    getRegisteredRoutes() {
        return this.handlerService.getRoutes();
    }
    
    /**
     * Register a custom route
     * @param {string} path - Route path
     * @param {Object} config - Route configuration
     */
    registerRoute(path, config) {
        this.handlerService.register(path, config);
    }
    
    /**
     * Add global middleware
     * @param {Function} middleware - Middleware function
     */
    addMiddleware(middleware) {
        this.handlerService.addMiddleware(middleware);
    }
    
    /**
     * Add route guard
     * @param {string} name - Guard name
     * @param {Function} guard - Guard function
     */
    addGuard(name, guard) {
        this.handlerService.addGuard(name, guard);
    }
    
    /**
     * Check if router is ready
     * @returns {boolean} - True if router is ready
     */
    isReady() {
        return this.isInitialized && 
               this.stateService && 
               this.handlerService && 
               this.navigationService;
    }
    
    /**
     * Get comprehensive router state
     * @returns {Object} - Complete router state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            currentRoute: this.getCurrentRoute(),
            routeHistory: this.getRouteHistory(),
            registeredRoutes: this.getRegisteredRoutes(),
            state: this.stateService.getStats(),
            handler: this.handlerService.getStats(),
            navigation: this.navigationService.getStats(),
            appState: window.AppState || {}
        };
    }
    
    /**
     * Get router statistics
     * @returns {Object} - Router usage statistics
     */
    getStats() {
        return {
            isReady: this.isReady(),
            currentPath: this.getCurrentPath(),
            registeredRoutes: this.handlerService.getStats().routeCount,
            navigationHistory: this.navigationService.getStats().navigationHistory,
            routeHistory: this.stateService.getStats().routeHistorySize,
            isNavigating: this.navigationService.isCurrentlyNavigating(),
            servicesInitialized: {
                state: !!this.stateService,
                handler: !!this.handlerService,
                navigation: !!this.navigationService
            }
        };
    }
    
    /**
     * Reset router state
     */
    reset() {
        if (this.stateService) this.stateService.reset();
        if (this.navigationService) this.navigationService.reset();
        
        // Reset app state
        if (window.AppState) {
            window.AppState.currentRoute = null;
            window.AppState.routeHistory = [];
            window.AppState.routeData = {};
        }
        
        if (window.DebugStore) {
            DebugStore.info('RouterManager reset', {}, 'ROUTERMANAGER');
        }
    }
    
    /**
     * Destroy router manager (cleanup)
     */
    destroy() {
        // Clean up services
        if (this.stateService && this.stateService.destroy) {
            this.stateService.destroy();
        }
        
        if (this.handlerService && this.handlerService.destroy) {
            this.handlerService.destroy();
        }
        
        if (this.navigationService && this.navigationService.destroy) {
            this.navigationService.destroy();
        }
        
        this.isInitialized = false;
        
        if (window.DebugStore) {
            DebugStore.debug('RouterManager destroyed', {}, 'ROUTERMANAGER');
        }
    }
}

// Export for use in other modules
window.RouterManager = RouterManager;