// PWA Manager Module - Handles Progressive Web App features

const PWAManager = {
    // State
    deferredPrompt: null,
    isOffline: false,
    
    // Initialize PWA features
    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.checkOnlineStatus();
    },
    
    // Register service worker
    registerServiceWorker() {
        // Skip service worker in development
        if (window.location.hostname === 'localhost') {
            console.log('Service Worker disabled in development');
            // Unregister any existing service worker
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('Service Worker unregistered for development');
                }
            });
            return;
        }
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                UI.showToast('New version available! Refresh to update.');
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    },
    
    // Setup install prompt handling
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Install banner removed - just log availability
            
            // Log that install is available
            console.log('Install prompt available');
        });
        
        // Handle successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            UI.showToast('App installed successfully!');
            
            // Install banner removed
        });
    },
    
    // Install PWA
    install() {
        if (!this.deferredPrompt) {
            console.log('Install prompt not available');
            return;
        }
        
        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        this.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            
            // Install banner removed
        });
    },
    
    // Check online status
    checkOnlineStatus() {
        this.isOffline = !navigator.onLine;
        
        if (this.isOffline) {
            document.body.classList.add('offline');
            UI.showToast('Offline mode - AI features unavailable');
        }
    },
    
    // Update online status
    updateOnlineStatus(isOnline) {
        this.isOffline = !isOnline;
        
        if (isOnline) {
            document.body.classList.remove('offline');
            UI.showToast('Back online!');
        } else {
            document.body.classList.add('offline');
            UI.showToast('Offline mode - AI features unavailable');
        }
    },
    
    // Check if app is installed
    isInstalled() {
        // Check if running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        
        // iOS check
        if (window.navigator.standalone === true) {
            return true;
        }
        
        return false;
    },
    
    // Get cache status (for future use)
    async getCacheStatus() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                const cachePromises = cacheNames.map(async (cacheName) => {
                    const cache = await caches.open(cacheName);
                    const keys = await cache.keys();
                    return {
                        name: cacheName,
                        count: keys.length
                    };
                });
                
                return await Promise.all(cachePromises);
            } catch (error) {
                console.error('Error getting cache status:', error);
                return [];
            }
        }
        return [];
    },
    
    // Clear app cache (for future use)
    async clearCache() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                
                UI.showToast('Cache cleared successfully');
                return true;
            } catch (error) {
                console.error('Error clearing cache:', error);
                UI.showToast('Failed to clear cache');
                return false;
            }
        }
        return false;
    },
    
    // Check for updates
    async checkForUpdates() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
        }
    }
};

// Export for use in other modules
window.PWAManager = PWAManager;