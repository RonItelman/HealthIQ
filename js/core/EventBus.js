// EventBus - Central event coordination system for decoupled architecture

class EventBus {
    constructor() {
        this.listeners = new Map(); // eventType -> Set of listeners
        this.eventHistory = [];
        this.middleware = [];
        this.contracts = new Map(); // eventType -> contract definition
        this.stats = {
            totalEvents: 0,
            eventsByType: new Map(),
            errors: 0,
            startTime: Date.now()
        };
        
        // Configuration
        this.config = {
            debugMode: window.AppConfig?.getDebugConfig('enableEventLogging') ?? true,
            maxHistorySize: 1000,
            enableValidation: true,
            enablePerformanceTracking: true,
            logLevel: 'INFO' // ERROR, WARN, INFO, DEBUG
        };
        
        if (window.DebugStore) {
            DebugStore.info('EventBus initialized', {
                debugMode: this.config.debugMode,
                maxHistorySize: this.config.maxHistorySize
            }, 'EVENTBUS');
        }
        
        // Set up global error handling for async listeners
        this.setupErrorHandling();
    }
    
    /**
     * Emit an event to all registered listeners
     * @param {string} eventType - Type of event to emit
     * @param {Object} data - Event data payload
     * @param {Object} options - Emit options
     * @returns {string} - Event ID
     */
    emit(eventType, data = {}, options = {}) {
        const startTime = performance.now();
        const event = this.createEvent(eventType, data, options);
        
        try {
            // Validate event if contract exists
            if (this.config.enableValidation) {
                this.validateEvent(event);
            }
            
            // Run middleware
            this.runMiddleware(event);
            
            // Store in history
            this.addToHistory(event);
            
            // Update statistics
            this.updateStats(event);
            
            // Debug logging
            if (this.config.debugMode && this.shouldLog('DEBUG')) {
                DebugStore.debug('Event emitted', {
                    type: eventType,
                    dataKeys: Object.keys(data),
                    listenerCount: this.getListenerCount(eventType),
                    eventId: event.id
                }, 'EVENTBUS');
            }
            
            // Notify all listeners
            const notificationResults = this.notifyListeners(event);
            
            // Performance tracking
            if (this.config.enablePerformanceTracking) {
                const duration = performance.now() - startTime;
                if (duration > 10) { // Log slow events
                    DebugStore.warn('Slow event processing', {
                        type: eventType,
                        duration: `${duration.toFixed(2)}ms`,
                        listenerCount: notificationResults.length
                    }, 'EVENTBUS');
                }
            }
            
            return event.id;
            
        } catch (error) {
            this.handleEmitError(error, event);
            throw error;
        }
    }
    
    /**
     * Register an event listener
     * @param {string} eventType - Event type to listen for
     * @param {Function} callback - Callback function
     * @param {Object} options - Listener options
     * @returns {Function} - Unsubscribe function
     */
    on(eventType, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Event listener callback must be a function');
        }
        
        const listener = {
            id: this.generateId('listener'),
            callback: callback,
            options: {
                once: options.once || false,
                priority: options.priority || 0,
                context: options.context || null,
                async: options.async || false,
                errorHandler: options.errorHandler || null
            },
            registeredAt: new Date().toISOString(),
            callCount: 0,
            lastCalled: null
        };
        
        // Initialize listener set for this event type
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        
        this.listeners.get(eventType).add(listener);
        
        if (this.config.debugMode && this.shouldLog('DEBUG')) {
            DebugStore.debug('Event listener registered', {
                eventType: eventType,
                listenerId: listener.id,
                options: listener.options,
                totalListeners: this.listeners.get(eventType).size
            }, 'EVENTBUS');
        }
        
        // Return unsubscribe function
        return () => this.off(eventType, listener);
    }
    
    /**
     * Unregister an event listener
     * @param {string} eventType - Event type
     * @param {Function|Object} callbackOrListener - Callback function or listener object
     */
    off(eventType, callbackOrListener) {
        const listeners = this.listeners.get(eventType);
        if (!listeners) return;
        
        let removed = false;
        
        if (typeof callbackOrListener === 'function') {
            // Find by callback function
            for (const listener of listeners) {
                if (listener.callback === callbackOrListener) {
                    listeners.delete(listener);
                    removed = true;
                    break;
                }
            }
        } else if (callbackOrListener && callbackOrListener.id) {
            // Remove by listener object
            listeners.delete(callbackOrListener);
            removed = true;
        }
        
        if (removed && this.config.debugMode) {
            DebugStore.debug('Event listener unregistered', {
                eventType: eventType,
                remainingListeners: listeners.size
            }, 'EVENTBUS');
        }
        
        // Clean up empty listener sets
        if (listeners.size === 0) {
            this.listeners.delete(eventType);
        }
    }
    
    /**
     * Register a one-time event listener
     * @param {string} eventType - Event type to listen for
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    once(eventType, callback) {
        return this.on(eventType, callback, { once: true });
    }
    
    /**
     * Remove all listeners for an event type
     * @param {string} eventType - Event type to clear
     */
    removeAllListeners(eventType) {
        if (eventType) {
            this.listeners.delete(eventType);
            if (this.config.debugMode) {
                DebugStore.info('All listeners removed', { eventType }, 'EVENTBUS');
            }
        } else {
            // Remove all listeners for all events
            this.listeners.clear();
            if (this.config.debugMode) {
                DebugStore.info('All event listeners cleared', {}, 'EVENTBUS');
            }
        }
    }
    
    /**
     * Define a contract for an event type
     * @param {string} eventType - Event type
     * @param {Object} contract - Contract definition
     */
    defineContract(eventType, contract) {
        this.contracts.set(eventType, {
            ...contract,
            definedAt: new Date().toISOString()
        });
        
        if (this.config.debugMode) {
            DebugStore.info('Event contract defined', {
                eventType: eventType,
                requiredFields: Object.keys(contract).filter(key => contract[key].required)
            }, 'EVENTBUS');
        }
    }
    
    /**
     * Add middleware to the event processing pipeline
     * @param {string} name - Middleware name
     * @param {Function} handler - Middleware handler
     * @param {Object} options - Middleware options
     */
    addMiddleware(name, handler, options = {}) {
        const middleware = {
            name: name,
            handler: handler,
            priority: options.priority || 0,
            enabled: options.enabled !== false,
            addedAt: new Date().toISOString()
        };
        
        this.middleware.push(middleware);
        
        // Sort by priority (higher priority runs first)
        this.middleware.sort((a, b) => b.priority - a.priority);
        
        if (this.config.debugMode) {
            DebugStore.info('Event middleware added', {
                name: name,
                priority: middleware.priority,
                totalMiddleware: this.middleware.length
            }, 'EVENTBUS');
        }
    }
    
    /**
     * Remove middleware
     * @param {string} name - Middleware name to remove
     */
    removeMiddleware(name) {
        const initialLength = this.middleware.length;
        this.middleware = this.middleware.filter(m => m.name !== name);
        
        if (this.middleware.length < initialLength && this.config.debugMode) {
            DebugStore.info('Event middleware removed', { name }, 'EVENTBUS');
        }
    }
    
    /**
     * Wait for an event to be emitted
     * @param {string} eventType - Event type to wait for
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} - Promise that resolves with event data
     */
    waitFor(eventType, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                unsubscribe();
                reject(new Error(`Timeout waiting for event: ${eventType}`));
            }, timeout);
            
            const unsubscribe = this.once(eventType, (data) => {
                clearTimeout(timeoutId);
                resolve(data);
            });
        });
    }
    
    /**
     * Get event bus statistics
     * @returns {Object} - Statistics object
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        const eventsPerSecond = this.stats.totalEvents / (uptime / 1000);
        
        return {
            totalEvents: this.stats.totalEvents,
            eventsByType: Object.fromEntries(this.stats.eventsByType),
            errors: this.stats.errors,
            uptime: uptime,
            eventsPerSecond: eventsPerSecond.toFixed(2),
            listenerCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
            eventTypes: Array.from(this.listeners.keys()),
            historySize: this.eventHistory.length,
            middlewareCount: this.middleware.length
        };
    }
    
    /**
     * Get event history
     * @param {Object} filters - Filter options
     * @returns {Array} - Filtered event history
     */
    getHistory(filters = {}) {
        let history = [...this.eventHistory];
        
        if (filters.eventType) {
            history = history.filter(event => event.type === filters.eventType);
        }
        
        if (filters.since) {
            const sinceTime = new Date(filters.since).getTime();
            history = history.filter(event => new Date(event.timestamp).getTime() >= sinceTime);
        }
        
        if (filters.limit) {
            history = history.slice(-filters.limit);
        }
        
        return history;
    }
    
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
        if (this.config.debugMode) {
            DebugStore.info('Event history cleared', {}, 'EVENTBUS');
        }
    }
    
    // Private methods
    
    /**
     * Create an event object
     * @private
     */
    createEvent(eventType, data, options) {
        return {
            id: this.generateId('event'),
            type: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            source: options.source || 'unknown',
            priority: options.priority || 0,
            async: options.async || false
        };
    }
    
    /**
     * Validate event against contract
     * @private
     */
    validateEvent(event) {
        const contract = this.contracts.get(event.type);
        if (!contract) return; // No contract defined
        
        for (const [field, spec] of Object.entries(contract)) {
            if (spec.required && !(field in event.data)) {
                throw new Error(`Event ${event.type} missing required field: ${field}`);
            }
            
            if (field in event.data && spec.type) {
                const actualType = typeof event.data[field];
                if (actualType !== spec.type) {
                    throw new Error(`Event ${event.type} field ${field} expected ${spec.type}, got ${actualType}`);
                }
            }
        }
    }
    
    /**
     * Run middleware pipeline
     * @private
     */
    runMiddleware(event) {
        for (const middleware of this.middleware) {
            if (middleware.enabled) {
                try {
                    middleware.handler(event);
                } catch (error) {
                    DebugStore.error('Middleware error', {
                        middleware: middleware.name,
                        error: error.message,
                        eventType: event.type
                    }, 'EVENTBUS');
                }
            }
        }
    }
    
    /**
     * Notify all listeners for an event
     * @private
     */
    notifyListeners(event) {
        const listeners = this.listeners.get(event.type);
        if (!listeners || listeners.size === 0) return [];
        
        const results = [];
        const listenersToRemove = [];
        
        // Convert to array and sort by priority
        const sortedListeners = Array.from(listeners).sort((a, b) => b.options.priority - a.options.priority);
        
        for (const listener of sortedListeners) {
            try {
                // Update listener stats
                listener.callCount++;
                listener.lastCalled = new Date().toISOString();
                
                // Call the listener
                const result = this.callListener(listener, event);
                results.push(result);
                
                // Remove one-time listeners
                if (listener.options.once) {
                    listenersToRemove.push(listener);
                }
                
            } catch (error) {
                this.handleListenerError(error, listener, event);
            }
        }
        
        // Remove one-time listeners
        for (const listener of listenersToRemove) {
            listeners.delete(listener);
        }
        
        return results;
    }
    
    /**
     * Call individual listener
     * @private
     */
    callListener(listener, event) {
        if (listener.options.async) {
            // Async listener - don't wait for completion
            Promise.resolve().then(() => {
                return listener.callback.call(listener.options.context, event.data, event);
            }).catch(error => {
                this.handleListenerError(error, listener, event);
            });
            return null;
        } else {
            // Sync listener
            return listener.callback.call(listener.options.context, event.data, event);
        }
    }
    
    /**
     * Handle listener errors
     * @private
     */
    handleListenerError(error, listener, event) {
        this.stats.errors++;
        
        if (listener.options.errorHandler) {
            try {
                listener.options.errorHandler(error, event);
            } catch (handlerError) {
                DebugStore.error('Error handler failed', {
                    originalError: error.message,
                    handlerError: handlerError.message,
                    eventType: event.type
                }, 'EVENTBUS');
            }
        } else {
            DebugStore.error('Event listener error', {
                error: error.message,
                eventType: event.type,
                listenerId: listener.id,
                stack: error.stack
            }, 'EVENTBUS');
        }
    }
    
    /**
     * Handle emit errors
     * @private
     */
    handleEmitError(error, event) {
        this.stats.errors++;
        DebugStore.error('Event emit error', {
            error: error.message,
            eventType: event.type,
            eventId: event.id
        }, 'EVENTBUS');
    }
    
    /**
     * Add event to history
     * @private
     */
    addToHistory(event) {
        this.eventHistory.push(event);
        
        // Trim history if too large
        if (this.eventHistory.length > this.config.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.config.maxHistorySize);
        }
    }
    
    /**
     * Update statistics
     * @private
     */
    updateStats(event) {
        this.stats.totalEvents++;
        
        const typeCount = this.stats.eventsByType.get(event.type) || 0;
        this.stats.eventsByType.set(event.type, typeCount + 1);
    }
    
    /**
     * Get listener count for event type
     * @private
     */
    getListenerCount(eventType) {
        const listeners = this.listeners.get(eventType);
        return listeners ? listeners.size : 0;
    }
    
    /**
     * Generate unique ID
     * @private
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Setup global error handling
     * @private
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections from async listeners
        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', (event) => {
                if (event.reason && event.reason.eventBusRelated) {
                    DebugStore.error('Unhandled event bus promise rejection', {
                        reason: event.reason.message
                    }, 'EVENTBUS');
                }
            });
        }
    }
    
    /**
     * Check if should log based on level
     * @private
     */
    shouldLog(level) {
        const levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
        const currentLevel = levels[this.config.logLevel] || 2;
        const messageLevel = levels[level] || 2;
        return messageLevel <= currentLevel;
    }
}

// Create global EventBus instance
window.EventBus = new EventBus();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}