// DebugManager - Main coordinator for all debugging and development tools

class DebugManager {
    constructor() {
        // Initialize service components
        this.modalManager = new DebugModalManager();
        this.loggerService = new DebugLoggerService();
        this.analyticsService = new DebugAnalyticsService();
        
        // Debug state
        this.isEnabled = window.AppConfig?.getDebugConfig('enableDebugFeatures') ?? true;
        this.logLevel = window.AppConfig?.getDebugConfig('logLevel') ?? 'INFO';
        
        if (window.DebugStore) {
            DebugStore.debug('DebugManager initialized', {
                isEnabled: this.isEnabled,
                logLevel: this.logLevel
            }, 'DEBUGMANAGER');
        }
    }
    
    /**
     * Initialize debug manager
     */
    init() {
        if (window.DebugStore) {
            DebugStore.info('DebugManager initialization started', {}, 'DEBUGMANAGER');
        }
        
        // Initialize services
        this.modalManager.init();
        this.loggerService.init();
        this.analyticsService.init();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up global debug utilities
        this.setupGlobalDebugUtils();
        
        // Start performance monitoring if enabled
        if (this.isEnabled) {
            this.analyticsService.startPerformanceMonitoring();
        }
        
        if (window.DebugStore) {
            DebugStore.success('DebugManager initialized successfully', {
                modalAvailable: !!this.modalManager,
                loggerAvailable: !!this.loggerService,
                analyticsAvailable: !!this.analyticsService
            }, 'DEBUGMANAGER');
        }
        
        console.log('DebugManager initialized with comprehensive debugging tools');
    }
    
    /**
     * Set up event bus listeners
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for all events for debugging
        if (this.isEnabled) {
            this.setupEventDebugging();
        }
        
        // Listen for debug-specific events
        EventBus.on('debug:showModal', () => {
            this.showDebugModal();
        });
        
        EventBus.on('debug:exportLogs', (data) => {
            this.exportDebugLogs(data.format);
        });
        
        EventBus.on('debug:clearLogs', () => {
            this.clearDebugLogs();
        });
        
        // Listen for performance events
        EventBus.on('performance:slow', (data) => {
            this.handleSlowPerformance(data);
        });
        
        // Listen for app errors
        EventBus.on('app:error', (data) => {
            this.handleAppError(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('DebugManager event listeners setup', {}, 'DEBUGMANAGER');
        }
    }
    
    /**
     * Set up event debugging to monitor all events
     */
    setupEventDebugging() {
        if (!window.EventBus) return;
        
        // Add middleware to log all events
        EventBus.addMiddleware('debugLogger', (event) => {
            if (this.shouldLogEvent(event)) {
                this.loggerService.logEvent(event);
            }
        }, { priority: 100 });
        
        // Track event statistics
        EventBus.addMiddleware('debugAnalytics', (event) => {
            this.analyticsService.trackEvent(event);
        }, { priority: 90 });
    }
    
    /**
     * Check if event should be logged for debugging
     * @param {Object} event - Event to check
     * @returns {boolean} - True if should log
     */
    shouldLogEvent(event) {
        // Skip debug events to avoid recursion
        if (event.type.startsWith('debug:')) return false;
        
        // Log based on debug level
        const criticalEvents = ['app:error', 'logEntry:error', 'analysis:failed'];
        const importantEvents = ['logEntry:created', 'analysis:completed', 'health:contextUpdated'];
        
        switch (this.logLevel) {
            case 'ERROR':
                return criticalEvents.includes(event.type);
            case 'WARN':
                return criticalEvents.includes(event.type) || event.type.includes('error') || event.type.includes('failed');
            case 'INFO':
                return criticalEvents.includes(event.type) || importantEvents.includes(event.type);
            case 'DEBUG':
                return true; // Log all events
            default:
                return importantEvents.includes(event.type);
        }
    }
    
    /**
     * Set up global debug utilities
     */
    setupGlobalDebugUtils() {
        // Add global debug helpers to window
        window.DebugUtils = {
            // Get app state
            getAppState: () => {
                return {
                    logManager: window.LogManager?.getState(),
                    healthManager: window.HealthManager?.getState(),
                    eventBus: window.EventBus?.getStats(),
                    debugManager: this.getState()
                };
            },
            
            // Export all debug data
            exportAll: () => {
                return this.exportAllDebugData();
            },
            
            // Clear all debug data
            clearAll: () => {
                this.clearAllDebugData();
            },
            
            // Test event system
            testEvents: () => {
                this.testEventSystem();
            },
            
            // Get performance metrics
            getPerformance: () => {
                return this.analyticsService.getMetrics();
            }
        };
        
        // Add debug shortcuts for development
        if (this.isEnabled) {
            window.addEventListener('keydown', (e) => {
                // Ctrl+Shift+D to open debug modal
                if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                    e.preventDefault();
                    this.showDebugModal();
                }
                
                // Ctrl+Shift+E to export debug data
                if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                    e.preventDefault();
                    this.exportDebugLogs('json');
                }
            });
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Global debug utilities setup', {
                shortcutsEnabled: this.isEnabled
            }, 'DEBUGMANAGER');
        }
    }
    
    /**
     * Show debug modal
     */
    showDebugModal() {
        this.modalManager.showModal();
        
        // Emit modal opened event
        if (window.EventBus) {
            EventBus.emit('modal:opened', {
                modalType: 'debug',
                modalId: 'debugModal'
            });
        }
    }
    
    /**
     * Close debug modal
     */
    closeDebugModal() {
        this.modalManager.closeModal();
        
        // Emit modal closed event
        if (window.EventBus) {
            EventBus.emit('modal:closed', {
                modalType: 'debug',
                modalId: 'debugModal'
            });
        }
    }
    
    /**
     * Export debug logs
     * @param {string} format - Export format ('json', 'text', 'csv')
     */
    async exportDebugLogs(format = 'json') {
        try {
            const debugData = this.gatherDebugData();
            
            switch (format.toLowerCase()) {
                case 'json':
                    await ExportHelper.downloadJSON(debugData, 'debug-logs');
                    break;
                case 'text':
                    await this.exportAsText(debugData);
                    break;
                case 'csv':
                    await this.exportAsCSV(debugData);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
            // Emit export event
            if (window.EventBus) {
                EventBus.emit('export:completed', {
                    format: format,
                    itemCount: debugData.logs?.length || 0,
                    size: JSON.stringify(debugData).length
                });
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Debug logs export failed', {
                    format: format,
                    error: error.message
                }, 'DEBUGMANAGER');
            }
            throw error;
        }
    }
    
    /**
     * Clear debug logs
     */
    clearDebugLogs() {
        // Clear debug store
        if (window.DebugStore) {
            window.DebugStore.clearLogs();
        }
        
        // Clear logger service
        this.loggerService.clearLogs();
        
        // Clear analytics
        this.analyticsService.clearMetrics();
        
        // Clear event bus history
        if (window.EventBus) {
            window.EventBus.clearHistory();
        }
        
        // Refresh modal display
        this.modalManager.refreshDisplay();
        
        if (window.DebugStore) {
            DebugStore.info('All debug logs cleared', {}, 'DEBUGMANAGER');
        }
    }
    
    /**
     * Handle slow performance events
     * @param {Object} data - Performance data
     */
    handleSlowPerformance(data) {
        if (window.DebugStore) {
            DebugStore.warn('Slow performance detected', {
                operation: data.operation,
                duration: data.duration,
                threshold: data.threshold
            }, 'DEBUGMANAGER');
        }
        
        // Track in analytics
        this.analyticsService.trackSlowOperation(data);
        
        // Show warning in debug modal if open
        this.modalManager.showPerformanceWarning(data);
    }
    
    /**
     * Handle application errors
     * @param {Object} data - Error data
     */
    handleAppError(data) {
        if (window.DebugStore) {
            DebugStore.error('Application error handled', {
                component: data.component,
                severity: data.severity,
                error: data.error.message
            }, 'DEBUGMANAGER');
        }
        
        // Track error in analytics
        this.analyticsService.trackError(data);
        
        // Auto-show debug modal for critical errors if enabled
        if (data.severity === 'critical' && this.isEnabled) {
            setTimeout(() => this.showDebugModal(), 1000);
        }
    }
    
    /**
     * Gather all debug data
     * @returns {Object} - Complete debug data
     */
    gatherDebugData() {
        return {
            timestamp: new Date().toISOString(),
            version: window.AppConfig?.getVersion() || '2.0.0',
            debugLogs: window.DebugStore?.getAllLogs() || [],
            eventHistory: window.EventBus?.getHistory() || [],
            performanceMetrics: this.analyticsService.getMetrics(),
            appState: {
                logManager: window.LogManager?.getState(),
                healthManager: window.HealthManager?.getState(),
                eventBus: window.EventBus?.getStats(),
                debugManager: this.getState()
            },
            systemInfo: this.getSystemInfo(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }
    
    /**
     * Export all debug data
     * @returns {Object} - All debug data
     */
    exportAllDebugData() {
        const data = this.gatherDebugData();
        
        if (window.DebugStore) {
            DebugStore.info('All debug data exported', {
                logCount: data.debugLogs.length,
                eventCount: data.eventHistory.length
            }, 'DEBUGMANAGER');
        }
        
        return data;
    }
    
    /**
     * Clear all debug data
     */
    clearAllDebugData() {
        this.clearDebugLogs();
        
        if (window.DebugStore) {
            DebugStore.info('All debug data cleared', {}, 'DEBUGMANAGER');
        }
    }
    
    /**
     * Test event system
     */
    testEventSystem() {
        if (!window.EventBus) {
            console.error('EventBus not available for testing');
            return;
        }
        
        console.log('Testing event system...');
        
        // Test basic emit/listen
        const testListener = (data) => {
            console.log('Test event received:', data);
        };
        
        EventBus.on('debug:test', testListener);
        EventBus.emit('debug:test', { message: 'Test successful', timestamp: new Date().toISOString() });
        EventBus.off('debug:test', testListener);
        
        // Test event validation
        try {
            EventBus.emit('logEntry:created', { invalid: 'data' });
        } catch (error) {
            console.log('Event validation working:', error.message);
        }
        
        console.log('Event system test completed');
    }
    
    /**
     * Get system information
     * @returns {Object} - System info
     */
    getSystemInfo() {
        return {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight
            },
            localStorage: {
                available: typeof Storage !== 'undefined',
                used: this.getLocalStorageUsage()
            },
            timing: performance.timing ? {
                loadStart: performance.timing.loadEventStart - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            } : null
        };
    }
    
    /**
     * Get localStorage usage
     * @returns {Object} - Storage usage info
     */
    getLocalStorageUsage() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return {
                totalBytes: total,
                totalKB: Math.round(total / 1024),
                itemCount: localStorage.length
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    /**
     * Export debug data as text
     * @param {Object} debugData - Debug data to export
     */
    async exportAsText(debugData) {
        const lines = [];
        lines.push(`Debug Export - ${debugData.timestamp}`);
        lines.push(`Version: ${debugData.version}`);
        lines.push('='.repeat(50));
        
        // Add debug logs
        lines.push('\nDEBUG LOGS:');
        for (const log of debugData.debugLogs) {
            lines.push(`[${log.timestamp}] ${log.level} [${log.source}] ${log.message}`);
        }
        
        // Add event history
        lines.push('\nEVENT HISTORY:');
        for (const event of debugData.eventHistory) {
            lines.push(`[${event.timestamp}] ${event.type} - ${JSON.stringify(event.data)}`);
        }
        
        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const filename = `debug-export-${DateFormatter.formatExportFilename()}.txt`;
        
        ExportHelper.downloadBlob(blob, filename);
    }
    
    /**
     * Export debug data as CSV
     * @param {Object} debugData - Debug data to export
     */
    async exportAsCSV(debugData) {
        const rows = [];
        rows.push(['Type', 'Timestamp', 'Level/Event', 'Source', 'Message', 'Data']);
        
        // Add debug logs
        for (const log of debugData.debugLogs) {
            rows.push([
                'LOG',
                log.timestamp,
                log.level,
                log.source,
                log.message,
                JSON.stringify(log.data || {})
            ]);
        }
        
        // Add events
        for (const event of debugData.eventHistory) {
            rows.push([
                'EVENT',
                event.timestamp,
                event.type,
                event.source || '',
                '',
                JSON.stringify(event.data || {})
            ]);
        }
        
        const csvContent = rows.map(row => 
            row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const filename = `debug-export-${DateFormatter.formatExportFilename()}.csv`;
        
        ExportHelper.downloadBlob(blob, filename);
    }
    
    /**
     * Get debug manager state
     * @returns {Object} - Current state
     */
    getState() {
        return {
            isEnabled: this.isEnabled,
            logLevel: this.logLevel,
            modalOpen: this.modalManager?.isOpen || false,
            logCount: window.DebugStore?.getAllLogs()?.length || 0,
            eventCount: window.EventBus?.getHistory()?.length || 0,
            performanceMetrics: this.analyticsService?.getMetrics() || {}
        };
    }
    
    /**
     * Enable/disable debug features
     * @param {boolean} enabled - Whether to enable debugging
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            this.analyticsService.startPerformanceMonitoring();
        } else {
            this.analyticsService.stopPerformanceMonitoring();
        }
        
        if (window.DebugStore) {
            DebugStore.info('Debug manager enabled status changed', {
                enabled: enabled
            }, 'DEBUGMANAGER');
        }
    }
    
    /**
     * Set debug log level
     * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
     */
    setLogLevel(level) {
        const validLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
        if (!validLevels.includes(level)) {
            throw new Error(`Invalid log level: ${level}`);
        }
        
        this.logLevel = level;
        
        if (window.DebugStore) {
            DebugStore.info('Debug log level changed', {
                newLevel: level
            }, 'DEBUGMANAGER');
        }
    }
}

// Export for use in other modules
window.DebugManager = DebugManager;