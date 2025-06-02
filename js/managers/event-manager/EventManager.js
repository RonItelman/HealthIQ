// EventManager - Main coordinator for all event handling services

class EventManager {
    constructor() {
        // Initialize service components
        this.buttonService = new ButtonEventService();
        this.keyboardService = new KeyboardEventService();
        this.clipboardService = new ClipboardService();
        this.pwaService = new PWAEventService();
        
        if (window.DebugStore) {
            DebugStore.debug('EventManager initialized', {}, 'EVENTMANAGER');
        }
    }
    
    /**
     * Initialize event manager
     */
    init() {
        if (window.DebugStore) {
            DebugStore.info('EventManager initialization started', {}, 'EVENTMANAGER');
        }
        
        // Initialize all services
        this.buttonService.init();
        this.keyboardService.init();
        this.clipboardService.init();
        this.pwaService.init();
        
        // Setup cross-service coordination
        this.setupServiceCoordination();
        
        if (window.DebugStore) {
            DebugStore.success('EventManager initialized successfully', {
                buttonServiceReady: !!this.buttonService,
                keyboardServiceReady: !!this.keyboardService,
                clipboardServiceReady: !!this.clipboardService,
                pwaServiceReady: !!this.pwaService
            }, 'EVENTMANAGER');
        }
        
        console.log('EventManager initialized with all event handling services');
    }
    
    /**
     * Setup coordination between services
     */
    setupServiceCoordination() {
        if (!window.EventBus) return;
        
        // Listen for clear logs requests from button service
        EventBus.on('logEntry:clearAllRequested', (data) => {
            this.handleClearLogsRequest(data);
        });
        
        // Listen for Think view requests
        EventBus.on('think:showRequested', (data) => {
            this.handleThinkViewRequest(data);
        });
        
        // Coordinate between keyboard and UI services
        EventBus.on('keyboard:escapePressed', () => {
            // Additional escape key coordination if needed
            this.handleGlobalEscape();
        });
        
        if (window.DebugStore) {
            DebugStore.debug('EventManager service coordination setup', {}, 'EVENTMANAGER');
        }
    }
    
    /**
     * Handle clear logs request with confirmation
     * @param {Object} data - Request data
     */
    handleClearLogsRequest(data) {
        if (window.DebugStore) {
            DebugStore.info('Clear logs request received', {
                source: data.source
            }, 'EVENTMANAGER');
        }
        
        try {
            const entries = this.getLogEntries();
            const totalEntries = entries ? entries.length : 0;
            
            if (totalEntries === 0) {
                this.showToast('No logs to clear', 'info');
                return;
            }
            
            const confirmMessage = `Are you sure you want to permanently delete all ${totalEntries} log entries? This action cannot be undone.`;
            
            if (confirm(confirmMessage)) {
                // Clear logs via LogManager
                if (window.LogManager && window.LogManager.clearAllEntries) {
                    window.LogManager.clearAllEntries();
                    this.showToast('All logs cleared successfully', 'success');
                    
                    // Animate clear button
                    this.buttonService.animateButton('clearLogsBtn', 'check', 'delete_sweep');
                    
                    // Emit logs cleared event
                    if (window.EventBus) {
                        EventBus.emit('logEntry:allCleared', {
                            count: totalEntries,
                            source: data.source
                        });
                    }
                } else {
                    this.showToast('Clear logs functionality not available', 'error');
                }
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Clear logs request failed', {
                    error: error.message,
                    source: data.source
                }, 'EVENTMANAGER');
            }
            this.showToast('Failed to clear logs', 'error');
        }
    }
    
    /**
     * Handle Think view request
     * @param {Object} data - Request data
     */
    async handleThinkViewRequest(data) {
        if (window.DebugStore) {
            DebugStore.info('Think view request received', {
                source: data.source
            }, 'EVENTMANAGER');
        }
        
        try {
            // Get all log entries
            const entries = this.getLogEntries();
            
            if (!entries || entries.length === 0) {
                this.showToast('No log entries to analyze', 'warning');
                return;
            }
            
            // Use ThinkModalManager if available
            if (window.ThinkModalManager) {
                await this.showThinkViewNew(entries);
            } else if (window.ThinkModal) {
                await this.showThinkViewLegacy(entries);
            } else {
                this.showToast('Think analysis not available', 'error');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Think view request failed', {
                    error: error.message,
                    source: data.source
                }, 'EVENTMANAGER');
            }
            this.showToast('Think analysis failed', 'error');
        }
    }
    
    /**
     * Show Think view using new ThinkModalManager
     * @param {Array} entries - Log entries
     */
    async showThinkViewNew(entries) {
        // This would integrate with the new ThinkModalManager
        // For now, fall back to legacy implementation
        await this.showThinkViewLegacy(entries);
    }
    
    /**
     * Show Think view using legacy ThinkModal
     * @param {Array} entries - Log entries
     */
    async showThinkViewLegacy(entries) {
        try {
            // Categorize entries if needed
            if (window.HealthCategorizer && window.HealthCategorizer.needsRecategorization) {
                if (window.HealthCategorizer.needsRecategorization(entries)) {
                    window.HealthCategorizer.categorizeEntries(entries);
                }
            }
            
            // Get categorized data for analysis
            let categorizedData;
            if (window.HealthCategorizer && window.HealthCategorizer.exportForAnalysis) {
                categorizedData = window.HealthCategorizer.exportForAnalysis();
            } else {
                // Fallback: create simple categorized data structure
                categorizedData = {
                    totalEntries: entries.length,
                    totalCategories: 1,
                    categories: [{
                        entries: entries.map(entry => ({
                            timestamp: entry.timestamp,
                            userEntry: entry.userLogEntry || entry.content,
                            claudeAnalysis: entry.claudeLogMessage || entry.analysis?.response
                        }))
                    }]
                };
            }
            
            // Show loading state in Think modal
            if (window.ThinkModal && window.ThinkModal.showLoading) {
                window.ThinkModal.showLoading();
            }
            
            // Get Claude's analysis
            const analysis = await this.getThinkAnalysis(categorizedData);
            
            // Display the analysis
            if (window.ThinkModal && window.ThinkModal.showAnalysis) {
                window.ThinkModal.showAnalysis(analysis, categorizedData);
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Legacy Think view failed', {
                    error: error.message
                }, 'EVENTMANAGER');
            }
            
            if (window.ThinkModal && window.ThinkModal.showError) {
                window.ThinkModal.showError('Failed to analyze data. Please try again.');
            }
            throw error;
        }
    }
    
    /**
     * Get Claude's analysis of categorized data
     * @param {Object} categorizedData - Categorized log data
     * @returns {Promise<string>} - Analysis result
     */
    async getThinkAnalysis(categorizedData) {
        const prompt = `Analyze this categorized health log data and provide insights, patterns, and recommendations.

Data Overview:
- Total entries: ${categorizedData.totalEntries}
- Total health context categories: ${categorizedData.totalCategories}
- Date range: ${this.getDateRange(categorizedData)}

Categorized Data:
${JSON.stringify(categorizedData, null, 2)}

Please provide:
1. Key patterns and insights across different health contexts
2. Correlations between different conditions/symptoms
3. Progression or changes over time
4. Specific recommendations based on the data
5. Important questions for the user to consider

Focus on actionable insights and patterns that could help the user better understand and manage their health.`;
        
        // Use API service to call Claude
        if (window.API && window.API.callClaude) {
            return await window.API.callClaude(prompt);
        } else {
            throw new Error('Claude API not available');
        }
    }
    
    /**
     * Get date range from categorized data
     * @param {Object} categorizedData - Categorized data
     * @returns {string} - Date range string
     */
    getDateRange(categorizedData) {
        if (!categorizedData.categories || categorizedData.categories.length === 0) {
            return 'No date range available';
        }
        
        try {
            const firstCategory = categorizedData.categories[0];
            const lastCategory = categorizedData.categories[categorizedData.categories.length - 1];
            
            const startDate = firstCategory.dateRange?.from || firstCategory.entries?.[0]?.timestamp;
            const endDate = lastCategory.dateRange?.to || lastCategory.entries?.[lastCategory.entries.length - 1]?.timestamp;
            
            if (startDate && endDate) {
                return `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.warn('Failed to extract date range', {
                    error: error.message
                }, 'EVENTMANAGER');
            }
        }
        
        return 'Date range unavailable';
    }
    
    /**
     * Handle global escape key
     */
    handleGlobalEscape() {
        if (window.DebugStore) {
            DebugStore.debug('Global escape key handled', {}, 'EVENTMANAGER');
        }
        
        // Additional coordination logic if needed
        // Most escape handling is done in individual services
    }
    
    /**
     * Get log entries from LogManager
     * @returns {Array} - Log entries
     */
    getLogEntries() {
        if (window.LogManager && window.LogManager.getEntries) {
            return window.LogManager.getEntries();
        }
        
        console.warn('LogManager not available for getting entries');
        return [];
    }
    
    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type
     */
    showToast(message, type = 'info') {
        // Emit toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: message,
                type: type
            });
        }
        
        // Fallback to legacy UI
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(message);
        }
    }
    
    /**
     * Get comprehensive event manager state
     * @returns {Object} - Complete state
     */
    getState() {
        return {
            button: this.buttonService.getStats(),
            keyboard: this.keyboardService.getStats(),
            clipboard: this.clipboardService.getStats(),
            pwa: this.pwaService.getStats(),
            manager: {
                initialized: true,
                servicesReady: {
                    button: !!this.buttonService,
                    keyboard: !!this.keyboardService,
                    clipboard: !!this.clipboardService,
                    pwa: !!this.pwaService
                }
            }
        };
    }
    
    /**
     * Check if event manager is ready
     * @returns {boolean} - True if all services are ready
     */
    isReady() {
        return !!(this.buttonService && 
                 this.keyboardService && 
                 this.clipboardService && 
                 this.pwaService);
    }
    
    /**
     * Get event statistics
     * @returns {Object} - Event usage statistics
     */
    getStats() {
        return {
            servicesInitialized: {
                button: !!this.buttonService,
                keyboard: !!this.keyboardService,
                clipboard: !!this.clipboardService,
                pwa: !!this.pwaService
            },
            isOnline: this.pwaService ? this.pwaService.getOnlineStatus() : navigator.onLine,
            registeredButtons: this.buttonService ? this.buttonService.getRegisteredButtons().length : 0,
            registeredShortcuts: this.keyboardService ? this.keyboardService.getStats().totalShortcuts : 0,
            clipboardHistory: this.clipboardService ? this.clipboardService.getStats().historySize : 0
        };
    }
    
    /**
     * Destroy event manager (cleanup)
     */
    destroy() {
        // Clean up all services
        if (this.buttonService && this.buttonService.destroy) {
            this.buttonService.destroy();
        }
        
        if (this.keyboardService && this.keyboardService.destroy) {
            this.keyboardService.destroy();
        }
        
        if (this.clipboardService && this.clipboardService.destroy) {
            this.clipboardService.destroy();
        }
        
        if (this.pwaService && this.pwaService.destroy) {
            this.pwaService.destroy();
        }
        
        if (window.DebugStore) {
            DebugStore.debug('EventManager destroyed', {}, 'EVENTMANAGER');
        }
    }
}

// Export for use in other modules
window.EventManager = EventManager;