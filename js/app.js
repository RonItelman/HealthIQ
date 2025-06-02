// Main Application Coordinator - Bootstraps and coordinates all modules

const App = {
    // Initialize the entire application
    async init() {
        const initTimer = window.DebugStore ? DebugStore.startTimer('appInitialization') : null;
        
        if (window.DebugStore) {
            DebugStore.info('App initialization started', {
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            }, 'APP');
        }
        
        console.log('Dots starting...');
        
        // Show splash screen immediately
        this.showSplash();
        
        // Initialize modules in correct order
        try {
            // 1. Initialize debug logger first (captures all console output)
            if (window.DebugLogger) {
                DebugLogger.init();
                if (window.DebugStore) {
                    DebugStore.success('DebugLogger initialized', {}, 'APP');
                }
            }
            
            // 2. Initialize debug system
            if (window.DebugManager) {
                window.AppDebugManager = new DebugManager();
                window.AppDebugManager.init();
                if (window.DebugStore) {
                    DebugStore.success('DebugManager initialized', {}, 'APP');
                }
            } else if (window.DebugModal) {
                DebugModal.init();
                if (window.DebugStore) {
                    DebugStore.success('DebugModal initialized', {}, 'APP');
                }
            }
            
            // 2.5 Initialize modal management system
            if (window.ModalManager) {
                window.AppModalManager = new ModalManager();
                window.AppModalManager.init();
                if (window.DebugStore) {
                    DebugStore.success('ModalManager initialized', {}, 'APP');
                }
            }
            
            // Add slight delay to show splash animation
            await this.delay(500);
            
            // 3. Initialize UI (sets up DOM references)
            UI.init();
            if (window.DebugStore) {
                DebugStore.success('UI initialized', {}, 'APP');
            }
            
            // 4. Initialize main menu navigation
            if (window.MainMenuManager) {
                window.AppMainMenuManager = new MainMenuManager();
                window.AppMainMenuManager.init();
            } else {
                MainMenu.init(); // Fallback to legacy
            }
            if (window.DebugStore) {
                DebugStore.success('MainMenu initialized', {}, 'APP');
            }
            
            await this.delay(300);
            
            // 5. Initialize event-driven UI managers
            window.ToastManager = new ToastManager();
            window.StatsManager = new StatsManager();
            if (window.DebugStore) {
                DebugStore.success('UI managers initialized', {}, 'APP');
            }
            
            // 6. Initialize storage and load data
            // Create new modular LogManager instance
            window.LogManager = new LogManager();
            window.LogManager.init();
            if (window.DebugStore) {
                DebugStore.success('LogManager initialized', {
                    dataStoreStats: window.LogManager.getDataStoreStats()
                }, 'APP');
            }
            
            // 7. Initialize health module
            if (window.HealthManager) {
                window.AppHealthManager = new HealthManager();
                window.AppHealthManager.init();
            } else {
                Health.init(); // Fallback to legacy
            }
            if (window.DebugStore) {
                DebugStore.success('Health module initialized', {}, 'APP');
            }
            
            await this.delay(200);
            
            // 8. Setup all event handlers
            if (window.EventManager) {
                window.AppEventManager = new EventManager();
                window.AppEventManager.init();
            } else {
                EventHandler.init(); // Fallback to legacy
            }
            if (window.DebugStore) {
                DebugStore.success('EventHandler initialized', {}, 'APP');
            }
            
            // 9. Initialize Think modal
            if (window.ThinkModalManager) {
                window.AppThinkModalManager = new ThinkModalManager();
                window.AppThinkModalManager.init();
            } else {
                ThinkModal.init(); // Fallback to legacy
            }
            if (window.DebugStore) {
                DebugStore.success('ThinkModal initialized', {}, 'APP');
            }
            
            // 10. Initialize PWA features
            PWAManager.init();
            if (window.DebugStore) {
                DebugStore.success('PWAManager initialized', {}, 'APP');
            }
            
            // 11. Initialize client-side routing
            if (window.RouterManager) {
                window.AppRouterManager = new RouterManager();
                window.AppRouterManager.init();
                if (window.DebugStore) {
                    DebugStore.success('RouterManager initialized', {
                        currentRoute: window.AppRouterManager.getCurrentPath(),
                        registeredRoutes: window.AppRouterManager.getStats().registeredRoutes
                    }, 'APP');
                }
            }
            
            await this.delay(300);
            
            // Check system health
            if (window.DebugStore) {
                DebugStore.checkSystemHealth();
            }
            
            const totalTime = initTimer ? initTimer.end() : null;
            
            // Emit app initialization complete event
            if (window.EventBus) {
                EventBus.emit('app:initialized', {
                    version: this.getVersion(),
                    buildDate: new Date().toISOString(),
                    initTime: totalTime,
                    modules: {
                        eventBus: true,
                        toastManager: !!window.ToastManager,
                        statsManager: !!window.StatsManager,
                        logManager: !!window.LogManager,
                        health: !!window.Health,
                        ui: !!window.UI,
                        pwa: !!window.PWAManager,
                        router: !!window.AppRouterManager
                    }
                });
            }
            
            console.log('Dots initialized successfully with event bus architecture');
            
            if (window.DebugStore) {
                DebugStore.success('App initialization completed', {
                    totalTime: totalTime ? `${totalTime}ms` : 'unknown',
                    modules: ['EventBus', 'ToastManager', 'StatsManager', 'LogManager', 'Health', 'EventHandler', 'ThinkModal', 'PWAManager', 'RouterManager'],
                    eventBusEnabled: true
                }, 'APP');
            }
            
            // No longer auto-hide splash - handled by user interaction and routing
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('App initialization failed', {
                    error: error.message,
                    stack: error.stack,
                    totalTime: initTimer ? `${initTimer.end()}ms` : 'unknown'
                }, 'APP');
            }
            
            console.error('Failed to initialize app:', error);
            this.hideSplash();
            UI.showToast('Error initializing app. Please refresh.');
        }
    },
    
    // Show splash screen
    showSplash() {
        // Initialize SplashManager if available, otherwise fallback to legacy
        if (window.SplashManager) {
            window.AppSplashManager = new SplashManager();
            window.AppSplashManager.init();
            window.AppSplashManager.show();
        } else if (window.Splash) {
            Splash.init();
            Splash.show();
        }
    },
    
    // Hide splash screen
    hideSplash() {
        // The new splash manager handles hiding via user interaction and routing
        // No automatic hiding anymore - user must click/tap to continue
        if (window.DebugStore) {
            DebugStore.info('Splash hide requested - now handled by user interaction', {}, 'APP');
        }
    },
    
    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Get app version (for future use)
    getVersion() {
        return '2.0.0'; // Modular architecture version
    },
    
    // Get app state (for debugging)
    getState() {
        return {
            version: this.getVersion(),
            entries: LogManager.getEntries().length,
            todayCount: LogManager.getTodayCount(),
            isOffline: PWAManager.isOffline,
            isInstalled: PWAManager.isInstalled(),
            hasHealthIssues: !!Health.healthIssues.claudeAnalysis,
            currentView: LogManager.currentView
        };
    },
    
    // Reset app (for future use)
    async reset() {
        if (confirm('This will delete all your data. Are you sure?')) {
            // Clear storage
            Storage.clearAllData();
            
            // Clear cache
            await PWAManager.clearCache();
            
            // Reload app
            window.location.reload();
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for debugging
window.App = App;