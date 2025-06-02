// RouteHandlerService - Handles route definitions and route matching

class RouteHandlerService {
    constructor() {
        this.routes = new Map();
        this.middlewares = [];
        this.guards = new Map();
        this.defaultRoute = '/';
        this.notFoundRoute = '/404';
        
        if (window.DebugStore) {
            DebugStore.debug('RouteHandlerService initialized', {}, 'ROUTEHANDLER');
        }
    }
    
    /**
     * Initialize route handler service
     */
    init() {
        this.registerDefaultRoutes();
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('RouteHandlerService init completed', {
                routeCount: this.routes.size,
                middlewareCount: this.middlewares.length
            }, 'ROUTEHANDLER');
        }
    }
    
    /**
     * Register default application routes
     */
    registerDefaultRoutes() {
        // Splash screen route (initial route)
        this.register('/splash', {
            name: 'splash',
            title: 'Dots - Loading',
            handler: (route) => this.handleSplashRoute(route),
            meta: { 
                description: 'Splash screen with app initialization',
                requiresAuth: false,
                isInitialRoute: true
            }
        });
        
        // Root redirect to main
        this.register('/', {
            name: 'root',
            title: 'Dots - Health Tracking',
            handler: (route) => this.handleRootRedirect(route),
            meta: { 
                description: 'Root redirect to main dashboard',
                requiresAuth: false,
                redirect: '/main'
            }
        });
        
        // Main dashboard route (renamed from home)
        this.register('/main', {
            name: 'main',
            title: 'Dots - Health Tracking',
            handler: (route) => this.handleMainRoute(route),
            meta: { 
                description: 'Main dashboard for health tracking',
                requiresAuth: false 
            }
        });
        
        // Logs route
        this.register('/logs', {
            name: 'logs',
            title: 'View Logs - Dots',
            handler: (route) => this.handleLogsRoute(route),
            meta: { 
                description: 'View and manage health log entries',
                modal: 'logModal'
            }
        });
        
        // Health profile route
        this.register('/health', {
            name: 'health',
            title: 'Health Profile - Dots',
            handler: (route) => this.handleHealthRoute(route),
            meta: { 
                description: 'Manage health profile and context',
                modal: 'healthModal'
            }
        });
        
        // Think analysis route
        this.register('/think', {
            name: 'think',
            title: 'Health Analysis - Dots',
            handler: (route) => this.handleThinkRoute(route),
            meta: { 
                description: 'AI-powered health pattern analysis',
                modal: 'thinkModal'
            }
        });
        
        // Debug console route
        this.register('/debug', {
            name: 'debug',
            title: 'Debug Console - Dots',
            handler: (route) => this.handleDebugRoute(route),
            meta: { 
                description: 'Application debug information',
                modal: 'debugModal',
                requiresDebug: true
            }
        });
        
        // Settings route (future)
        this.register('/settings', {
            name: 'settings',
            title: 'Settings - Dots',
            handler: (route) => this.handleSettingsRoute(route),
            meta: { 
                description: 'Application settings and preferences',
                modal: 'settingsModal'
            }
        });
        
        // 404 Not Found route
        this.register('/404', {
            name: 'notFound',
            title: '404 - Page Not Found',
            handler: (route) => this.handleNotFoundRoute(route),
            meta: { 
                description: 'Page not found'
            }
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Default routes registered', {
                routeCount: this.routes.size,
                routes: Array.from(this.routes.keys())
            }, 'ROUTEHANDLER');
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for route changes
        EventBus.on('route:changed', (data) => {
            this.handleRouteChange(data);
        });
        
        // Listen for navigation requests
        EventBus.on('route:navigate', (data) => {
            this.handleNavigationRequest(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('RouteHandlerService event listeners setup', {}, 'ROUTEHANDLER');
        }
    }
    
    /**
     * Register a route
     * @param {string} path - Route path (supports patterns)
     * @param {Object} config - Route configuration
     */
    register(path, config) {
        if (!path || !config || !config.handler) {
            throw new Error('Route path, config, and handler are required');
        }
        
        const route = {
            path: path,
            name: config.name || path,
            title: config.title || 'Dots',
            handler: config.handler,
            meta: config.meta || {},
            pattern: this.createRoutePattern(path),
            middleware: config.middleware || [],
            guards: config.guards || []
        };
        
        this.routes.set(path, route);
        
        if (window.DebugStore) {
            DebugStore.debug('Route registered', {
                path: path,
                name: route.name,
                hasHandler: !!route.handler,
                hasMiddleware: route.middleware.length > 0
            }, 'ROUTEHANDLER');
        }
    }
    
    /**
     * Handle route change
     * @param {Object} data - Route change data
     */
    async handleRouteChange(data) {
        const route = data.to;
        
        if (window.DebugStore) {
            DebugStore.info('Handling route change', {
                from: data.from?.path,
                to: route.path,
                source: data.source
            }, 'ROUTEHANDLER');
        }
        
        try {
            // Find matching route handler
            const matchedRoute = this.matchRoute(route.path);
            
            if (!matchedRoute) {
                // Route not found, redirect to 404
                if (route.path !== this.notFoundRoute) {
                    if (window.EventBus) {
                        EventBus.emit('route:navigate', {
                            path: this.notFoundRoute,
                            replace: true
                        });
                    }
                }
                return;
            }
            
            // Run guards
            const guardsPassed = await this.runGuards(matchedRoute, route);
            if (!guardsPassed) {
                if (window.DebugStore) {
                    DebugStore.warn('Route guards failed', {
                        path: route.path,
                        routeName: matchedRoute.name
                    }, 'ROUTEHANDLER');
                }
                return;
            }
            
            // Run middleware
            await this.runMiddleware(matchedRoute, route);
            
            // Update document title
            this.updateDocumentTitle(matchedRoute.title);
            
            // Execute route handler
            await matchedRoute.handler(route, matchedRoute);
            
            // Emit route handled event
            if (window.EventBus) {
                EventBus.emit('route:handled', {
                    route: route,
                    matchedRoute: matchedRoute
                });
            }
            
            if (window.DebugStore) {
                DebugStore.success('Route handled successfully', {
                    path: route.path,
                    routeName: matchedRoute.name
                }, 'ROUTEHANDLER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Route handling failed', {
                    path: route.path,
                    error: error.message
                }, 'ROUTEHANDLER');
            }
            
            // Emit route error
            if (window.EventBus) {
                EventBus.emit('route:error', {
                    route: route,
                    error: error.message
                });
            }
        }
    }
    
    /**
     * Handle navigation request
     * @param {Object} data - Navigation request data
     */
    handleNavigationRequest(data) {
        if (window.DebugStore) {
            DebugStore.debug('Navigation request received', {
                path: data.path,
                replace: data.replace
            }, 'ROUTEHANDLER');
        }
        
        // This will be handled by RouterManager
        // Just log for debugging purposes
    }
    
    /**
     * Match route path to registered routes
     * @param {string} path - Path to match
     * @returns {Object|null} - Matched route or null
     */
    matchRoute(path) {
        // First, try exact match
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }
        
        // Then try pattern matching
        for (const [routePath, route] of this.routes) {
            if (route.pattern && route.pattern.test(path)) {
                return route;
            }
        }
        
        if (window.DebugStore) {
            DebugStore.debug('No route match found', {
                path: path,
                availableRoutes: Array.from(this.routes.keys())
            }, 'ROUTEHANDLER');
        }
        
        return null;
    }
    
    /**
     * Create route pattern for matching
     * @param {string} path - Route path
     * @returns {RegExp|null} - Route pattern or null for exact match
     */
    createRoutePattern(path) {
        // For now, use exact matching
        // Can be extended later for dynamic routes like /user/:id
        if (path.includes(':') || path.includes('*')) {
            // Convert path to regex pattern
            const pattern = path
                .replace(/:[^/]+/g, '([^/]+)')  // :param -> capture group
                .replace(/\*/g, '.*');           // * -> match anything
            
            return new RegExp(`^${pattern}$`);
        }
        
        return null; // Use exact matching
    }
    
    /**
     * Run route guards
     * @param {Object} matchedRoute - Matched route
     * @param {Object} route - Current route
     * @returns {Promise<boolean>} - True if guards pass
     */
    async runGuards(matchedRoute, route) {
        // Check debug requirement
        if (matchedRoute.meta.requiresDebug && !this.isDebugEnabled()) {
            if (window.DebugStore) {
                DebugStore.warn('Debug route access denied', {
                    path: route.path,
                    debugEnabled: this.isDebugEnabled()
                }, 'ROUTEHANDLER');
            }
            return false;
        }
        
        // Run custom guards
        for (const guardName of matchedRoute.guards) {
            const guard = this.guards.get(guardName);
            if (guard) {
                const result = await guard(route, matchedRoute);
                if (!result) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Run route middleware
     * @param {Object} matchedRoute - Matched route
     * @param {Object} route - Current route
     */
    async runMiddleware(matchedRoute, route) {
        // Run global middleware
        for (const middleware of this.middlewares) {
            await middleware(route, matchedRoute);
        }
        
        // Run route-specific middleware
        for (const middleware of matchedRoute.middleware) {
            await middleware(route, matchedRoute);
        }
    }
    
    /**
     * Route Handlers
     */
    
    async handleSplashRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling splash route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Show splash screen
        if (window.SplashManager) {
            window.SplashManager.show();
        } else if (window.Splash) {
            window.Splash.init();
            window.Splash.show();
        }
        
        // Emit splash navigation
        if (window.EventBus) {
            EventBus.emit('app:splashActivated', {
                route: route
            });
        }
    }
    
    async handleRootRedirect(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling root redirect', { route: route }, 'ROUTEHANDLER');
        }
        
        // Redirect to main route
        if (window.EventBus) {
            EventBus.emit('route:navigate', {
                path: '/main',
                replace: true,
                source: 'rootRedirect'
            });
        }
    }
    
    async handleMainRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling main route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Close any open modals
        if (window.ModalManager && window.ModalManager.closeAllModals) {
            window.ModalManager.closeAllModals();
        }
        
        // Hide splash if still visible
        if (window.SplashManager && window.SplashManager.isVisible()) {
            window.SplashManager.hide();
        }
        
        // Emit main navigation
        if (window.EventBus) {
            EventBus.emit('app:mainActivated', {
                route: route
            });
        }
    }
    
    async handleHomeRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling home route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Close any open modals
        if (window.ModalManager && window.ModalManager.closeAllModals) {
            window.ModalManager.closeAllModals();
        }
        
        // Emit home navigation
        if (window.EventBus) {
            EventBus.emit('app:homeActivated', {
                route: route
            });
        }
    }
    
    async handleLogsRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling logs route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Show logs modal
        if (window.ModalManager && window.ModalManager.showLogModal) {
            const entries = window.LogManager ? window.LogManager.getEntries() : [];
            window.ModalManager.showLogModal(entries);
        } else if (window.LogManager && window.LogManager.showLogModal) {
            window.LogManager.showLogModal();
        }
        
        // Emit logs navigation
        if (window.EventBus) {
            EventBus.emit('app:logsActivated', {
                route: route
            });
        }
    }
    
    async handleHealthRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling health route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Show health modal
        if (window.ModalManager && window.ModalManager.showHealthModal) {
            const profile = window.HealthManager ? window.HealthManager.getCurrentProfile() : null;
            window.ModalManager.showHealthModal(profile);
        } else if (window.HealthManager && window.HealthManager.showHealthModal) {
            window.HealthManager.showHealthModal();
        }
        
        // Emit health navigation
        if (window.EventBus) {
            EventBus.emit('app:healthActivated', {
                route: route
            });
        }
    }
    
    async handleThinkRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling think route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Show think modal with loading state first
        if (window.ModalManager && window.ModalManager.showThinkModal) {
            window.ModalManager.showThinkModal();
        }
        
        // Request think analysis
        if (window.EventBus) {
            EventBus.emit('think:showRequested', {
                source: 'route',
                route: route
            });
        }
        
        // Emit think navigation
        if (window.EventBus) {
            EventBus.emit('app:thinkActivated', {
                route: route
            });
        }
    }
    
    async handleDebugRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling debug route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Show debug modal
        if (window.ModalManager && window.ModalManager.showDebugModal) {
            const logs = window.DebugStore ? window.DebugStore.getAllLogs() : [];
            window.ModalManager.showDebugModal(logs);
        } else if (window.DebugManager && window.DebugManager.showDebugModal) {
            window.DebugManager.showDebugModal();
        }
        
        // Emit debug navigation
        if (window.EventBus) {
            EventBus.emit('app:debugActivated', {
                route: route
            });
        }
    }
    
    async handleSettingsRoute(route) {
        if (window.DebugStore) {
            DebugStore.info('Handling settings route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Settings not implemented yet, redirect to home
        if (window.EventBus) {
            EventBus.emit('route:navigate', {
                path: '/',
                replace: true
            });
        }
        
        // Show toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: 'Settings page coming soon!',
                type: 'info'
            });
        }
    }
    
    async handleNotFoundRoute(route) {
        if (window.DebugStore) {
            DebugStore.warn('Handling 404 route', { route: route }, 'ROUTEHANDLER');
        }
        
        // Close any open modals
        if (window.ModalManager && window.ModalManager.closeAllModals) {
            window.ModalManager.closeAllModals();
        }
        
        // Show toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: `Page not found: ${route.path}`,
                type: 'error'
            });
        }
        
        // Redirect to home after a brief delay
        setTimeout(() => {
            if (window.EventBus) {
                EventBus.emit('route:navigate', {
                    path: '/',
                    replace: true
                });
            }
        }, 2000);
    }
    
    /**
     * Update document title
     * @param {string} title - New title
     */
    updateDocumentTitle(title) {
        if (title) {
            document.title = title;
            
            if (window.DebugStore) {
                DebugStore.debug('Document title updated', {
                    title: title
                }, 'ROUTEHANDLER');
            }
        }
    }
    
    /**
     * Check if debug is enabled
     * @returns {boolean} - True if debug is enabled
     */
    isDebugEnabled() {
        return !!(window.DebugStore || window.DebugManager);
    }
    
    /**
     * Add global middleware
     * @param {Function} middleware - Middleware function
     */
    addMiddleware(middleware) {
        this.middlewares.push(middleware);
        
        if (window.DebugStore) {
            DebugStore.debug('Global middleware added', {
                middlewareCount: this.middlewares.length
            }, 'ROUTEHANDLER');
        }
    }
    
    /**
     * Add route guard
     * @param {string} name - Guard name
     * @param {Function} guard - Guard function
     */
    addGuard(name, guard) {
        this.guards.set(name, guard);
        
        if (window.DebugStore) {
            DebugStore.debug('Route guard added', {
                name: name,
                guardCount: this.guards.size
            }, 'ROUTEHANDLER');
        }
    }
    
    /**
     * Get registered routes
     * @returns {Array} - Array of route info
     */
    getRoutes() {
        return Array.from(this.routes.values()).map(route => ({
            path: route.path,
            name: route.name,
            title: route.title,
            meta: route.meta
        }));
    }
    
    /**
     * Get route by name
     * @param {string} name - Route name
     * @returns {Object|null} - Route or null
     */
    getRouteByName(name) {
        for (const route of this.routes.values()) {
            if (route.name === name) {
                return route;
            }
        }
        return null;
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            routeCount: this.routes.size,
            middlewareCount: this.middlewares.length,
            guardCount: this.guards.size,
            registeredRoutes: Array.from(this.routes.keys()),
            defaultRoute: this.defaultRoute,
            notFoundRoute: this.notFoundRoute
        };
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        this.routes.clear();
        this.middlewares = [];
        this.guards.clear();
        
        if (window.DebugStore) {
            DebugStore.debug('RouteHandlerService destroyed', {}, 'ROUTEHANDLER');
        }
    }
}

// Export for use in other modules
window.RouteHandlerService = RouteHandlerService;