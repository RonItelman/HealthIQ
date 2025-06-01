// Main Application Coordinator - Bootstraps and coordinates all modules

const App = {
    // Initialize the entire application
    async init() {
        console.log('Dots starting...');
        
        // Show splash screen immediately
        this.showSplash();
        
        // Initialize modules in correct order
        try {
            // 1. Initialize debug logger first (captures all console output)
            DebugLogger.init();
            
            // Add slight delay to show splash animation
            await this.delay(500);
            
            // 2. Initialize UI (sets up DOM references)
            UI.init();
            
            // 3. Initialize main menu navigation
            MainMenu.init();
            
            await this.delay(300);
            
            // 4. Initialize storage and load data
            LogManager.init();
            
            // 5. Initialize health module
            Health.init();
            
            await this.delay(200);
            
            // 6. Setup all event handlers
            EventHandler.init();
            
            // 7. Initialize Think modal
            ThinkModal.init();
            
            // 8. Initialize PWA features
            PWAManager.init();
            
            await this.delay(300);
            
            console.log('Dots initialized successfully');
            
            // Hide splash screen after initialization
            this.hideSplash();
            
        } catch (error) {
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