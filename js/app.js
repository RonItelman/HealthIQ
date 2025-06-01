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
            
            // 2. Initialize debug modal
            if (window.DebugModal) {
                DebugModal.init();
                if (window.DebugStore) {
                    DebugStore.success('DebugModal initialized', {}, 'APP');
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
            MainMenu.init();
            if (window.DebugStore) {
                DebugStore.success('MainMenu initialized', {}, 'APP');
            }
            
            await this.delay(300);
            
            // 5. Initialize storage and load data
            // Create new modular LogManager instance
            window.LogManager = new LogManager();
            window.LogManager.init();
            if (window.DebugStore) {
                DebugStore.success('LogManager initialized', {
                    dataStoreStats: window.LogManager.getDataStoreStats()
                }, 'APP');
            }
            
            // 6. Initialize health module
            Health.init();
            if (window.DebugStore) {
                DebugStore.success('Health module initialized', {}, 'APP');
            }
            
            await this.delay(200);
            
            // 7. Setup all event handlers
            EventHandler.init();
            if (window.DebugStore) {
                DebugStore.success('EventHandler initialized', {}, 'APP');
            }
            
            // 8. Initialize Think modal
            ThinkModal.init();
            if (window.DebugStore) {
                DebugStore.success('ThinkModal initialized', {}, 'APP');
            }
            
            // 9. Initialize PWA features
            PWAManager.init();
            if (window.DebugStore) {
                DebugStore.success('PWAManager initialized', {}, 'APP');
            }
            
            await this.delay(300);
            
            // Check system health
            if (window.DebugStore) {
                DebugStore.checkSystemHealth();
            }
            
            console.log('Dots initialized successfully');
            
            if (window.DebugStore) {
                DebugStore.success('App initialization completed', {
                    totalTime: initTimer ? `${initTimer.end()}ms` : 'unknown',
                    modules: ['DebugLogger', 'DebugModal', 'UI', 'MainMenu', 'LogManager', 'Health', 'EventHandler', 'ThinkModal', 'PWAManager']
                }, 'APP');
            }
            
            // Hide splash screen after initialization
            this.hideSplash();
            
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
        if (window.Splash) {
            Splash.init();
            Splash.show();
        }
    },
    
    // Hide splash screen
    hideSplash() {
        if (window.Splash) {
            setTimeout(() => {
                Splash.hide();
            }, 800); // Show for a bit longer to appreciate the animation
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