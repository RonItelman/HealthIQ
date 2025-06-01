// Main Application Coordinator - Bootstraps and coordinates all modules

const App = {
    // Initialize the entire application
    init() {
        console.log('Dots starting...');
        
        // Initialize modules in correct order
        try {
            // 1. Initialize debug logger first (captures all console output)
            DebugLogger.init();
            
            // 2. Initialize UI (sets up DOM references)
            UI.init();
            
            // 3. Initialize main menu navigation
            MainMenu.init();
            
            // 4. Initialize storage and load data
            LogManager.init();
            
            // 5. Initialize health module
            Health.init();
            
            // 6. Setup all event handlers
            EventHandler.init();
            
            // 7. Initialize Think modal
            ThinkModal.init();
            
            // 8. Initialize PWA features
            PWAManager.init();
            
            // 9. Hide loading screen
            UI.hideLoadingScreen();
            
            console.log('Dots initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            UI.showToast('Error initializing app. Please refresh.');
        }
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