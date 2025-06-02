// PWAEventService - Handles PWA-specific events (online/offline status, etc.)

class PWAEventService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.onlineHandlers = [];
        this.offlineHandlers = [];
        
        if (window.DebugStore) {
            DebugStore.debug('PWAEventService initialized', {
                initialOnlineStatus: this.isOnline
            }, 'PWAEVENTS');
        }
    }
    
    /**
     * Initialize PWA event service
     */
    init() {
        this.setupNetworkListeners();
        this.setupPWAInstallListeners();
        this.setupVisibilityListeners();
        
        // Initial status check
        this.updateOnlineStatus(navigator.onLine);
        
        if (window.DebugStore) {
            DebugStore.debug('PWAEventService init completed', {
                onlineStatus: this.isOnline
            }, 'PWAEVENTS');
        }
    }
    
    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        // Online event
        const onlineHandler = () => {
            this.handleOnlineEvent();
        };
        window.addEventListener('online', onlineHandler);
        
        // Offline event
        const offlineHandler = () => {
            this.handleOfflineEvent();
        };
        window.addEventListener('offline', offlineHandler);
        
        // Store handlers for cleanup
        this.onlineHandlers.push({ element: window, handler: onlineHandler });
        this.offlineHandlers.push({ element: window, handler: offlineHandler });
        
        if (window.DebugStore) {
            DebugStore.debug('Network event listeners setup', {}, 'PWAEVENTS');
        }
    }
    
    /**
     * Setup PWA installation listeners
     */
    setupPWAInstallListeners() {
        // Before install prompt
        const beforeInstallHandler = (e) => {
            this.handleBeforeInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', beforeInstallHandler);
        
        // App installed
        const appInstalledHandler = () => {
            this.handleAppInstalled();
        };
        window.addEventListener('appinstalled', appInstalledHandler);
        
        if (window.DebugStore) {
            DebugStore.debug('PWA install event listeners setup', {}, 'PWAEVENTS');
        }
    }
    
    /**
     * Setup page visibility listeners
     */
    setupVisibilityListeners() {
        const visibilityHandler = () => {
            this.handleVisibilityChange();
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        
        // Focus/blur events for additional visibility tracking
        const focusHandler = () => {
            this.handleAppFocus();
        };
        const blurHandler = () => {
            this.handleAppBlur();
        };
        
        window.addEventListener('focus', focusHandler);
        window.addEventListener('blur', blurHandler);
        
        if (window.DebugStore) {
            DebugStore.debug('Visibility event listeners setup', {}, 'PWAEVENTS');
        }
    }
    
    /**
     * Handle online event
     */
    handleOnlineEvent() {
        this.updateOnlineStatus(true);
        
        if (window.DebugStore) {
            DebugStore.info('Device came online', {
                timestamp: new Date().toISOString()
            }, 'PWAEVENTS');
        }
        
        // Emit online event
        if (window.EventBus) {
            EventBus.emit('pwa:online', {
                timestamp: new Date().toISOString(),
                wasOffline: !this.isOnline
            });
        }
        
        // Notify PWA manager
        if (window.PWAManager && window.PWAManager.updateOnlineStatus) {
            window.PWAManager.updateOnlineStatus(true);
        }
        
        // Show user notification
        this.showConnectionStatus('back online', 'success');
    }
    
    /**
     * Handle offline event
     */
    handleOfflineEvent() {
        this.updateOnlineStatus(false);
        
        if (window.DebugStore) {
            DebugStore.warn('Device went offline', {
                timestamp: new Date().toISOString()
            }, 'PWAEVENTS');
        }
        
        // Emit offline event
        if (window.EventBus) {
            EventBus.emit('pwa:offline', {
                timestamp: new Date().toISOString(),
                wasOnline: this.isOnline
            });
        }
        
        // Notify PWA manager
        if (window.PWAManager && window.PWAManager.updateOnlineStatus) {
            window.PWAManager.updateOnlineStatus(false);
        }
        
        // Show user notification
        this.showConnectionStatus('offline - some features may be limited', 'warning');
    }
    
    /**
     * Handle before install prompt
     * @param {Event} e - Before install prompt event
     */
    handleBeforeInstallPrompt(e) {
        // Prevent default browser install prompt
        e.preventDefault();
        
        if (window.DebugStore) {
            DebugStore.info('PWA install prompt available', {}, 'PWAEVENTS');
        }
        
        // Store the event for later use
        window.deferredPrompt = e;
        
        // Emit install prompt event
        if (window.EventBus) {
            EventBus.emit('pwa:installPromptAvailable', {
                timestamp: new Date().toISOString()
            });
        }
        
        // Notify PWA manager
        if (window.PWAManager && window.PWAManager.setInstallPrompt) {
            window.PWAManager.setInstallPrompt(e);
        }
    }
    
    /**
     * Handle app installed
     */
    handleAppInstalled() {
        if (window.DebugStore) {
            DebugStore.success('PWA app installed', {
                timestamp: new Date().toISOString()
            }, 'PWAEVENTS');
        }
        
        // Clear stored prompt
        window.deferredPrompt = null;
        
        // Emit app installed event
        if (window.EventBus) {
            EventBus.emit('pwa:appInstalled', {
                timestamp: new Date().toISOString()
            });
        }
        
        // Show success notification
        this.showInstallStatus('App installed successfully!', 'success');
    }
    
    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        const isVisible = !document.hidden;
        
        if (window.DebugStore) {
            DebugStore.debug('App visibility changed', {
                isVisible: isVisible,
                visibilityState: document.visibilityState
            }, 'PWAEVENTS');
        }
        
        // Emit visibility change event
        if (window.EventBus) {
            EventBus.emit('pwa:visibilityChanged', {
                isVisible: isVisible,
                visibilityState: document.visibilityState,
                timestamp: new Date().toISOString()
            });
        }
        
        if (isVisible) {
            this.handleAppVisible();
        } else {
            this.handleAppHidden();
        }
    }
    
    /**
     * Handle app becoming visible
     */
    handleAppVisible() {
        // Check network status when app becomes visible
        this.updateOnlineStatus(navigator.onLine);
        
        if (window.DebugStore) {
            DebugStore.debug('App became visible', {}, 'PWAEVENTS');
        }
        
        // Emit app visible event
        if (window.EventBus) {
            EventBus.emit('pwa:appVisible', {
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Handle app becoming hidden
     */
    handleAppHidden() {
        if (window.DebugStore) {
            DebugStore.debug('App became hidden', {}, 'PWAEVENTS');
        }
        
        // Emit app hidden event
        if (window.EventBus) {
            EventBus.emit('pwa:appHidden', {
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Handle app focus
     */
    handleAppFocus() {
        if (window.DebugStore) {
            DebugStore.debug('App gained focus', {}, 'PWAEVENTS');
        }
        
        // Emit focus event
        if (window.EventBus) {
            EventBus.emit('pwa:appFocused', {
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Handle app blur
     */
    handleAppBlur() {
        if (window.DebugStore) {
            DebugStore.debug('App lost focus', {}, 'PWAEVENTS');
        }
        
        // Emit blur event
        if (window.EventBus) {
            EventBus.emit('pwa:appBlurred', {
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Update online status
     * @param {boolean} isOnline - Whether device is online
     */
    updateOnlineStatus(isOnline) {
        const previousStatus = this.isOnline;
        this.isOnline = isOnline;
        
        // Update UI elements if they exist
        this.updateOnlineIndicators(isOnline);
        
        if (previousStatus !== isOnline) {
            if (window.DebugStore) {
                DebugStore.info('Online status changed', {
                    from: previousStatus,
                    to: isOnline
                }, 'PWAEVENTS');
            }
            
            // Emit status change event
            if (window.EventBus) {
                EventBus.emit('pwa:onlineStatusChanged', {
                    isOnline: isOnline,
                    previousStatus: previousStatus,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    /**
     * Update online indicators in UI
     * @param {boolean} isOnline - Whether device is online
     */
    updateOnlineIndicators(isOnline) {
        // Update any online status indicators
        const indicators = document.querySelectorAll('.online-indicator');
        indicators.forEach(indicator => {
            indicator.classList.toggle('online', isOnline);
            indicator.classList.toggle('offline', !isOnline);
        });
        
        // Update document title if needed
        if (!isOnline && !document.title.includes('(Offline)')) {
            document.title = document.title + ' (Offline)';
        } else if (isOnline && document.title.includes('(Offline)')) {
            document.title = document.title.replace(' (Offline)', '');
        }
    }
    
    /**
     * Show connection status message
     * @param {string} message - Status message
     * @param {string} type - Message type (success, warning, error)
     */
    showConnectionStatus(message, type = 'info') {
        // Emit toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: `Connection ${message}`,
                type: type
            });
        }
    }
    
    /**
     * Show install status message
     * @param {string} message - Status message
     * @param {string} type - Message type
     */
    showInstallStatus(message, type = 'info') {
        // Emit toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: message,
                type: type
            });
        }
    }
    
    /**
     * Get current online status
     * @returns {boolean} - True if online
     */
    getOnlineStatus() {
        return this.isOnline;
    }
    
    /**
     * Check if PWA features are supported
     * @returns {Object} - PWA feature support
     */
    getPWASupport() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            manifest: 'manifest' in document.createElement('link'),
            installPrompt: 'beforeinstallprompt' in window,
            pushNotifications: 'PushManager' in window,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            webShare: 'share' in navigator
        };
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            isOnline: this.isOnline,
            pwaSupport: this.getPWASupport(),
            visibilityState: document.visibilityState,
            hasFocus: document.hasFocus(),
            userAgent: navigator.userAgent.substring(0, 50) + '...'
        };
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        // Remove online/offline listeners
        this.onlineHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('online', handler);
        });
        
        this.offlineHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('offline', handler);
        });
        
        this.onlineHandlers = [];
        this.offlineHandlers = [];
        
        if (window.DebugStore) {
            DebugStore.debug('PWAEventService destroyed', {}, 'PWAEVENTS');
        }
    }
}

// Export for use in other modules
window.PWAEventService = PWAEventService;