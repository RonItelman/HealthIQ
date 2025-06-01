// ToastManager - Handles toast notifications via events

class ToastManager {
    constructor() {
        this.toastElement = null;
        this.currentToast = null;
        this.toastQueue = [];
        this.isShowing = false;
        
        this.defaultDuration = window.AppConfig?.getUIConfig('toastDuration') || 3000;
        
        this.init();
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('ToastManager initialized', {
                defaultDuration: this.defaultDuration
            }, 'TOASTMANAGER');
        }
    }
    
    /**
     * Initialize toast manager
     */
    init() {
        this.toastElement = document.getElementById('toast');
        if (!this.toastElement) {
            console.warn('Toast element not found');
        }
    }
    
    /**
     * Setup event listeners for toast events
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for explicit toast show events
        EventBus.on('toast:show', (data) => {
            this.show(data.message, data.type, data.duration);
        });
        
        // Listen for log events to show appropriate toasts
        EventBus.on('logEntry:created', () => {
            this.show('Entry logged successfully!', 'success');
        });
        
        EventBus.on('logEntry:deleted', () => {
            this.show('Entry deleted', 'info');
        });
        
        EventBus.on('logEntry:error', (data) => {
            this.show(`Failed to save entry: ${data.error.message}`, 'error');
        });
        
        // Listen for analysis events
        EventBus.on('analysis:completed', (data) => {
            this.show('Analysis complete!', 'success', 2000);
        });
        
        EventBus.on('analysis:failed', (data) => {
            this.show('Analysis failed', 'error');
        });
        
        // Listen for health context events
        EventBus.on('health:contextUpdated', () => {
            this.show('Health context updated', 'success');
        });
        
        EventBus.on('health:analysisUpdated', () => {
            this.show('Health analysis updated', 'success');
        });
        
        // Listen for system events
        EventBus.on('app:offline', () => {
            this.show('You are now offline', 'warning', 5000);
        });
        
        EventBus.on('app:online', () => {
            this.show('Back online!', 'success');
        });
        
        EventBus.on('app:error', (data) => {
            this.show(`Error: ${data.error.message}`, 'error', 5000);
        });
        
        // Listen for export/import events
        EventBus.on('export:completed', (data) => {
            this.show(`Exported ${data.itemCount} items as ${data.format.toUpperCase()}`, 'success');
        });
        
        EventBus.on('import:completed', (data) => {
            const message = data.errors > 0 ? 
                `Imported ${data.itemCount} items (${data.errors} errors)` :
                `Imported ${data.itemCount} items successfully`;
            this.show(message, data.errors > 0 ? 'warning' : 'success');
        });
        
        if (window.DebugStore) {
            DebugStore.debug('ToastManager event listeners setup', {}, 'TOASTMANAGER');
        }
    }
    
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = null) {
        if (!this.toastElement) {
            console.warn('Toast element not available');
            return;
        }
        
        const toast = {
            id: this.generateId(),
            message: message,
            type: type,
            duration: duration || this.defaultDuration,
            timestamp: new Date().toISOString()
        };
        
        if (window.DebugStore) {
            DebugStore.debug('Showing toast', {
                message: message,
                type: type,
                duration: toast.duration
            }, 'TOASTMANAGER');
        }
        
        // Add to queue if currently showing a toast
        if (this.isShowing) {
            this.toastQueue.push(toast);
            return;
        }
        
        this.displayToast(toast);
    }
    
    /**
     * Display a toast immediately
     * @param {Object} toast - Toast object
     */
    displayToast(toast) {
        this.isShowing = true;
        this.currentToast = toast;
        
        // Set message and type
        this.toastElement.textContent = toast.message;
        this.toastElement.className = `toast toast-${toast.type}`;
        
        // Show toast
        this.toastElement.style.display = 'block';
        
        // Add show class for animation
        setTimeout(() => {
            this.toastElement.classList.add('toast-show');
        }, 10);
        
        // Auto-hide after duration
        setTimeout(() => {
            this.hide();
        }, toast.duration);
        
        // Emit event for tracking
        if (window.EventBus) {
            EventBus.emit('toast:shown', {
                toastId: toast.id,
                message: toast.message,
                type: toast.type,
                duration: toast.duration
            });
        }
    }
    
    /**
     * Hide the current toast
     */
    hide() {
        if (!this.isShowing || !this.toastElement) return;
        
        // Remove show class for animation
        this.toastElement.classList.remove('toast-show');
        
        // Hide after animation
        setTimeout(() => {
            if (this.toastElement) {
                this.toastElement.style.display = 'none';
                this.toastElement.className = 'toast';
            }
            
            this.isShowing = false;
            this.currentToast = null;
            
            // Show next toast in queue
            if (this.toastQueue.length > 0) {
                const nextToast = this.toastQueue.shift();
                setTimeout(() => {
                    this.displayToast(nextToast);
                }, 100); // Small delay between toasts
            }
            
        }, 300); // Match CSS animation duration
    }
    
    /**
     * Show success toast
     * @param {string} message - Success message
     * @param {number} duration - Duration in milliseconds
     */
    success(message, duration = null) {
        this.show(message, 'success', duration);
    }
    
    /**
     * Show error toast
     * @param {string} message - Error message
     * @param {number} duration - Duration in milliseconds
     */
    error(message, duration = null) {
        this.show(message, 'error', duration || 5000); // Errors shown longer
    }
    
    /**
     * Show warning toast
     * @param {string} message - Warning message
     * @param {number} duration - Duration in milliseconds
     */
    warning(message, duration = null) {
        this.show(message, 'warning', duration || 4000); // Warnings shown longer
    }
    
    /**
     * Show info toast
     * @param {string} message - Info message
     * @param {number} duration - Duration in milliseconds
     */
    info(message, duration = null) {
        this.show(message, 'info', duration);
    }
    
    /**
     * Clear all toasts (current and queued)
     */
    clearAll() {
        this.toastQueue = [];
        
        if (this.isShowing) {
            this.hide();
        }
        
        if (window.DebugStore) {
            DebugStore.debug('All toasts cleared', {}, 'TOASTMANAGER');
        }
    }
    
    /**
     * Get current toast status
     * @returns {Object} - Status information
     */
    getStatus() {
        return {
            isShowing: this.isShowing,
            currentToast: this.currentToast,
            queueLength: this.toastQueue.length,
            queuedMessages: this.toastQueue.map(t => t.message)
        };
    }
    
    /**
     * Update default duration
     * @param {number} duration - New default duration
     */
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
        
        if (window.DebugStore) {
            DebugStore.debug('Toast default duration updated', {
                newDuration: duration
            }, 'TOASTMANAGER');
        }
    }
    
    /**
     * Generate unique ID for toasts
     * @returns {string} - Unique ID
     */
    generateId() {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Handle click to dismiss
     */
    setupClickToDismiss() {
        if (this.toastElement) {
            this.toastElement.addEventListener('click', () => {
                if (this.isShowing) {
                    this.hide();
                }
            });
        }
    }
    
    /**
     * Destroy toast manager (cleanup)
     */
    destroy() {
        this.clearAll();
        
        if (window.EventBus) {
            EventBus.removeAllListeners('toast:show');
            EventBus.removeAllListeners('logEntry:created');
            EventBus.removeAllListeners('logEntry:deleted');
            EventBus.removeAllListeners('logEntry:error');
            EventBus.removeAllListeners('analysis:completed');
            EventBus.removeAllListeners('analysis:failed');
            EventBus.removeAllListeners('health:contextUpdated');
            EventBus.removeAllListeners('health:analysisUpdated');
            EventBus.removeAllListeners('app:offline');
            EventBus.removeAllListeners('app:online');
            EventBus.removeAllListeners('app:error');
            EventBus.removeAllListeners('export:completed');
            EventBus.removeAllListeners('import:completed');
        }
        
        if (window.DebugStore) {
            DebugStore.debug('ToastManager destroyed', {}, 'TOASTMANAGER');
        }
    }
}

// Export for use in other modules
window.ToastManager = ToastManager;