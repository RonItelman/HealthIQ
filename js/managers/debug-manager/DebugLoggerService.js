// DebugLoggerService - Handles debug logging operations and storage

class DebugLoggerService {
    constructor() {
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        this.flushInterval = null;
        this.logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        this.eventLogHistory = [];
        this.maxEventHistory = 500;
        
        if (window.DebugStore) {
            DebugStore.debug('DebugLoggerService initialized', {
                maxBufferSize: this.maxBufferSize,
                maxEventHistory: this.maxEventHistory
            }, 'DEBUGLOGGER');
        }
    }
    
    /**
     * Initialize logger service
     */
    init() {
        this.setupPeriodicFlush();
        this.setupEventLogging();
        
        if (window.DebugStore) {
            DebugStore.debug('DebugLoggerService init completed', {}, 'DEBUGLOGGER');
        }
    }
    
    /**
     * Setup periodic flush to persistent storage
     */
    setupPeriodicFlush() {
        // Flush buffer every 10 seconds
        this.flushInterval = setInterval(() => {
            this.flushBuffer();
        }, 10000);
    }
    
    /**
     * Setup event logging integration
     */
    setupEventLogging() {
        if (!window.EventBus) return;
        
        // Listen for application errors
        EventBus.on('app:error', (data) => {
            this.logError('Application Error', {
                component: data.component,
                error: data.error?.message || 'Unknown error',
                severity: data.severity,
                stack: data.error?.stack
            });
        });
        
        // Listen for performance issues
        EventBus.on('performance:slow', (data) => {
            this.logWarning('Slow Performance Detected', {
                operation: data.operation,
                duration: `${data.duration}ms`,
                threshold: `${data.threshold}ms`
            });
        });
        
        // Listen for critical system events
        EventBus.on('system:criticalError', (data) => {
            this.logError('Critical System Error', data);
        });
    }
    
    /**
     * Log an event for debugging
     * @param {Object} event - Event to log
     */
    logEvent(event) {
        if (!event || !event.type) return;
        
        const eventLog = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            type: 'EVENT',
            level: 'DEBUG',
            source: 'EVENTBUS',
            message: `Event: ${event.type}`,
            data: {
                eventType: event.type,
                eventId: event.id,
                eventData: event.data,
                processingTime: event.processingTime
            }
        };
        
        this.addToBuffer(eventLog);
        this.addToEventHistory(event);
    }
    
    /**
     * Log debug information
     * @param {string} message - Debug message
     * @param {Object} data - Additional data
     * @param {string} source - Source component
     */
    logDebug(message, data = {}, source = 'UNKNOWN') {
        this.log('DEBUG', message, data, source);
    }
    
    /**
     * Log informational message
     * @param {string} message - Info message
     * @param {Object} data - Additional data
     * @param {string} source - Source component
     */
    logInfo(message, data = {}, source = 'UNKNOWN') {
        this.log('INFO', message, data, source);
    }
    
    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} data - Additional data
     * @param {string} source - Source component
     */
    logWarning(message, data = {}, source = 'UNKNOWN') {
        this.log('WARN', message, data, source);
    }
    
    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} data - Additional data
     * @param {string} source - Source component
     */
    logError(message, data = {}, source = 'UNKNOWN') {
        this.log('ERROR', message, data, source);
    }
    
    /**
     * Generic log method
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @param {string} source - Source component
     */
    log(level, message, data = {}, source = 'UNKNOWN') {
        if (!this.logLevels.includes(level)) {
            level = 'INFO';
        }
        
        const logEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            type: 'LOG',
            level: level,
            source: source,
            message: message,
            data: data
        };
        
        this.addToBuffer(logEntry);
        
        // Also log to console based on level
        this.logToConsole(logEntry);
    }
    
    /**
     * Add log entry to buffer
     * @param {Object} logEntry - Log entry to add
     */
    addToBuffer(logEntry) {
        this.logBuffer.push(logEntry);
        
        // Trim buffer if it exceeds max size
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
        }
        
        // Auto-flush critical errors immediately
        if (logEntry.level === 'ERROR') {
            this.flushBuffer();
        }
    }
    
    /**
     * Add event to history
     * @param {Object} event - Event to add
     */
    addToEventHistory(event) {
        this.eventLogHistory.push({
            timestamp: new Date().toISOString(),
            eventType: event.type,
            eventId: event.id,
            data: event.data
        });
        
        // Trim history if it exceeds max size
        if (this.eventLogHistory.length > this.maxEventHistory) {
            this.eventLogHistory = this.eventLogHistory.slice(-this.maxEventHistory);
        }
    }
    
    /**
     * Log to browser console
     * @param {Object} logEntry - Log entry
     */
    logToConsole(logEntry) {
        const message = `[${logEntry.source}] ${logEntry.message}`;
        
        switch (logEntry.level) {
            case 'DEBUG':
                console.debug(message, logEntry.data);
                break;
            case 'INFO':
                console.info(message, logEntry.data);
                break;
            case 'WARN':
                console.warn(message, logEntry.data);
                break;
            case 'ERROR':
                console.error(message, logEntry.data);
                break;
            default:
                console.log(message, logEntry.data);
        }
    }
    
    /**
     * Flush buffer to persistent storage
     */
    flushBuffer() {
        if (this.logBuffer.length === 0) return;
        
        try {
            // Add buffer entries to DebugStore
            if (window.DebugStore) {
                this.logBuffer.forEach(entry => {
                    // Add to DebugStore without causing recursion
                    const storeMethod = window.DebugStore[entry.level.toLowerCase()];
                    if (storeMethod && typeof storeMethod === 'function') {
                        // Temporarily disable debug store logging to prevent recursion
                        const originalEnabled = window.DebugStore.enabled;
                        window.DebugStore.enabled = false;
                        
                        try {
                            storeMethod.call(window.DebugStore, entry.message, entry.data, entry.source);
                        } finally {
                            window.DebugStore.enabled = originalEnabled;
                        }
                    }
                });
            }
            
            // Clear buffer after successful flush
            this.logBuffer = [];
            
        } catch (error) {
            console.error('Failed to flush debug log buffer:', error);
        }
    }
    
    /**
     * Get all logs from buffer and storage
     * @returns {Array} - All log entries
     */
    getAllLogs() {
        const storedLogs = window.DebugStore?.getAllLogs() || [];
        
        // Combine stored logs with buffer (buffer contains newest entries)
        const allLogs = [...storedLogs, ...this.logBuffer];
        
        // Sort by timestamp
        return allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    /**
     * Get logs filtered by level
     * @param {string} level - Log level to filter by
     * @returns {Array} - Filtered log entries
     */
    getLogsByLevel(level) {
        return this.getAllLogs().filter(log => log.level === level);
    }
    
    /**
     * Get logs filtered by source
     * @param {string} source - Source to filter by
     * @returns {Array} - Filtered log entries
     */
    getLogsBySource(source) {
        return this.getAllLogs().filter(log => log.source === source);
    }
    
    /**
     * Get logs within date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array} - Filtered log entries
     */
    getLogsByDateRange(startDate, endDate) {
        return this.getAllLogs().filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
    }
    
    /**
     * Search logs by message content
     * @param {string} searchTerm - Term to search for
     * @returns {Array} - Matching log entries
     */
    searchLogs(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.getAllLogs().filter(log => 
            log.message.toLowerCase().includes(term) ||
            log.source.toLowerCase().includes(term) ||
            JSON.stringify(log.data).toLowerCase().includes(term)
        );
    }
    
    /**
     * Get event log history
     * @returns {Array} - Event history
     */
    getEventHistory() {
        return [...this.eventLogHistory];
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logBuffer = [];
        this.eventLogHistory = [];
        
        if (window.DebugStore) {
            DebugStore.debug('Debug logger cleared all logs', {
                clearedAt: new Date().toISOString()
            }, 'DEBUGLOGGER');
        }
    }
    
    /**
     * Get logging statistics
     * @returns {Object} - Logging stats
     */
    getStats() {
        const allLogs = this.getAllLogs();
        const stats = {
            totalLogs: allLogs.length,
            bufferSize: this.logBuffer.length,
            eventHistorySize: this.eventLogHistory.length,
            levelCounts: {},
            sourceCounts: {},
            recentErrorCount: 0
        };
        
        // Count by level and source
        allLogs.forEach(log => {
            stats.levelCounts[log.level] = (stats.levelCounts[log.level] || 0) + 1;
            stats.sourceCounts[log.source] = (stats.sourceCounts[log.source] || 0) + 1;
        });
        
        // Count recent errors (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        stats.recentErrorCount = allLogs.filter(log => 
            log.level === 'ERROR' && new Date(log.timestamp) > oneHourAgo
        ).length;
        
        return stats;
    }
    
    /**
     * Export logs in various formats
     * @param {string} format - Export format ('json', 'csv', 'text')
     * @param {Object} options - Export options
     * @returns {string} - Exported data
     */
    exportLogs(format = 'json', options = {}) {
        const logs = this.getAllLogs();
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify({
                    exportedAt: new Date().toISOString(),
                    totalLogs: logs.length,
                    logs: logs,
                    eventHistory: this.eventLogHistory
                }, null, 2);
                
            case 'csv':
                return this.exportLogsAsCSV(logs);
                
            case 'text':
                return this.exportLogsAsText(logs);
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Export logs as CSV
     * @param {Array} logs - Logs to export
     * @returns {string} - CSV content
     */
    exportLogsAsCSV(logs) {
        const headers = ['Timestamp', 'Level', 'Source', 'Message', 'Data'];
        const rows = [headers];
        
        logs.forEach(log => {
            rows.push([
                log.timestamp,
                log.level,
                log.source,
                log.message,
                JSON.stringify(log.data || {})
            ]);
        });
        
        return rows.map(row => 
            row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }
    
    /**
     * Export logs as text
     * @param {Array} logs - Logs to export
     * @returns {string} - Text content
     */
    exportLogsAsText(logs) {
        const lines = [];
        lines.push(`Debug Log Export - ${new Date().toISOString()}`);
        lines.push('='.repeat(50));
        
        logs.forEach(log => {
            lines.push(`[${log.timestamp}] ${log.level} [${log.source}] ${log.message}`);
            if (log.data && Object.keys(log.data).length > 0) {
                lines.push(`  Data: ${JSON.stringify(log.data)}`);
            }
            lines.push('');
        });
        
        return lines.join('\n');
    }
    
    /**
     * Generate unique ID for log entries
     * @returns {string} - Unique ID
     */
    generateId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Set log level threshold
     * @param {string} level - Minimum log level to record
     */
    setLogLevel(level) {
        if (!this.logLevels.includes(level)) {
            throw new Error(`Invalid log level: ${level}`);
        }
        
        this.currentLogLevel = level;
        
        if (window.DebugStore) {
            DebugStore.info('Debug logger level changed', {
                newLevel: level
            }, 'DEBUGLOGGER');
        }
    }
    
    /**
     * Enable/disable console logging
     * @param {boolean} enabled - Whether to log to console
     */
    setConsoleLogging(enabled) {
        this.consoleLoggingEnabled = enabled;
        
        if (window.DebugStore) {
            DebugStore.info('Console logging toggled', {
                enabled: enabled
            }, 'DEBUGLOGGER');
        }
    }
    
    /**
     * Destroy logger service (cleanup)
     */
    destroy() {
        // Flush any remaining logs
        this.flushBuffer();
        
        // Clear intervals
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        
        if (window.DebugStore) {
            DebugStore.debug('DebugLoggerService destroyed', {}, 'DEBUGLOGGER');
        }
    }
}

// Export for use in other modules
window.DebugLoggerService = DebugLoggerService;