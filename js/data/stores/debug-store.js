// Debug Store - Persistent structured logging for troubleshooting

class DebugStore {
    constructor() {
        this.STORAGE_KEY = 'dots_debug_logs_v1';
        this.MAX_LOGS = 500; // Keep last 500 debug entries
        this.logs = [];
        this.sessionId = this.generateSessionId();
        this.loadFromStorage();
        this.startSession();
    }

    // Generate unique session ID
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Start new debug session
    startSession() {
        this.log('SESSION', 'New debug session started', {
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
    }

    // Main logging method
    log(level, message, data = {}, source = 'APP') {
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            level: level.toUpperCase(),
            source: source,
            message: message,
            data: this.sanitizeData(data),
            stack: level === 'ERROR' ? this.getCallStack() : null
        };

        this.logs.unshift(entry);
        
        // Trim logs if too many
        if (this.logs.length > this.MAX_LOGS) {
            this.logs = this.logs.slice(0, this.MAX_LOGS);
        }

        // Save immediately for persistence
        this.saveToStorage();

        // Also log to console for development
        const consoleMethod = this.getConsoleMethod(level);
        consoleMethod(`[${source}] ${message}`, data);

        return entry;
    }

    // Convenience methods for different log levels
    info(message, data = {}, source = 'APP') {
        return this.log('INFO', message, data, source);
    }

    warn(message, data = {}, source = 'APP') {
        return this.log('WARN', message, data, source);
    }

    error(message, data = {}, source = 'APP') {
        return this.log('ERROR', message, data, source);
    }

    debug(message, data = {}, source = 'APP') {
        return this.log('DEBUG', message, data, source);
    }

    success(message, data = {}, source = 'APP') {
        return this.log('SUCCESS', message, data, source);
    }

    // Track data store operations
    trackDataStore(operation, store, data = {}) {
        return this.log('DATA', `${store}: ${operation}`, data, 'DATASTORE');
    }

    // Track API calls
    trackAPI(method, url, data = {}) {
        return this.log('API', `${method} ${url}`, data, 'API');
    }

    // Track UI operations
    trackUI(action, element, data = {}) {
        return this.log('UI', `${action}: ${element}`, data, 'UI');
    }

    // Track timing/performance
    startTimer(name) {
        const startTime = performance.now();
        return {
            name: name,
            startTime: startTime,
            end: () => {
                const duration = performance.now() - startTime;
                this.log('PERF', `Timer: ${name}`, { 
                    duration: `${duration.toFixed(2)}ms`,
                    startTime: startTime 
                }, 'TIMER');
                return duration;
            }
        };
    }

    // Get appropriate console method
    getConsoleMethod(level) {
        switch (level.toUpperCase()) {
            case 'ERROR': return console.error;
            case 'WARN': return console.warn;
            case 'INFO': return console.info;
            case 'SUCCESS': return console.log;
            default: return console.log;
        }
    }

    // Get call stack for errors
    getCallStack() {
        try {
            throw new Error();
        } catch (e) {
            return e.stack?.split('\n').slice(3, 8).join('\n') || 'Stack not available';
        }
    }

    // Sanitize data for JSON storage
    sanitizeData(data) {
        try {
            // Handle circular references and functions
            return JSON.parse(JSON.stringify(data, (key, value) => {
                if (typeof value === 'function') {
                    return '[Function]';
                }
                if (value instanceof Error) {
                    return {
                        name: value.name,
                        message: value.message,
                        stack: value.stack
                    };
                }
                return value;
            }));
        } catch (error) {
            return { error: 'Failed to sanitize data', original: String(data) };
        }
    }

    // Get logs with optional filtering
    getLogs(filter = {}) {
        let filteredLogs = [...this.logs];

        if (filter.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filter.level.toUpperCase());
        }

        if (filter.source) {
            filteredLogs = filteredLogs.filter(log => log.source === filter.source.toUpperCase());
        }

        if (filter.message) {
            const searchTerm = filter.message.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(searchTerm)
            );
        }

        if (filter.sessionId) {
            filteredLogs = filteredLogs.filter(log => log.sessionId === filter.sessionId);
        }

        if (filter.limit) {
            filteredLogs = filteredLogs.slice(0, filter.limit);
        }

        return filteredLogs;
    }

    // Get recent errors
    getRecentErrors(limit = 10) {
        return this.getLogs({ level: 'ERROR', limit });
    }

    // Get current session logs
    getCurrentSessionLogs() {
        return this.getLogs({ sessionId: this.sessionId });
    }

    // Get logs by time range
    getLogsByTimeRange(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        return this.logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return logTime >= start && logTime <= end;
        });
    }

    // Get log statistics
    getStats() {
        const logs = this.logs;
        const levelCounts = logs.reduce((acc, log) => {
            acc[log.level] = (acc[log.level] || 0) + 1;
            return acc;
        }, {});

        const sourceCounts = logs.reduce((acc, log) => {
            acc[log.source] = (acc[log.source] || 0) + 1;
            return acc;
        }, {});

        return {
            totalLogs: logs.length,
            currentSession: this.sessionId,
            levelCounts,
            sourceCounts,
            oldestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
            newestLog: logs.length > 0 ? logs[0].timestamp : null
        };
    }

    // Save to localStorage
    saveToStorage() {
        try {
            const data = {
                logs: this.logs,
                sessionId: this.sessionId,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save debug logs:', error);
            // Try to free up space
            this.logs = this.logs.slice(0, Math.floor(this.MAX_LOGS / 2));
            try {
                const data = {
                    logs: this.logs,
                    sessionId: this.sessionId,
                    lastSaved: new Date().toISOString()
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            } catch (retryError) {
                console.error('Critical: Cannot save debug logs even after cleanup');
            }
        }
    }

    // Load from localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.logs = parsed.logs || [];
                // Don't restore sessionId - each page load gets new session
            }
        } catch (error) {
            console.error('Failed to load debug logs:', error);
            this.logs = [];
        }
    }

    // Export logs for analysis
    exportLogs(format = 'json') {
        const data = {
            exportedAt: new Date().toISOString(),
            sessionId: this.sessionId,
            stats: this.getStats(),
            logs: this.logs
        };

        if (format === 'csv') {
            return this.convertToCSV(data.logs);
        }

        return JSON.stringify(data, null, 2);
    }

    // Convert logs to CSV format
    convertToCSV(logs) {
        const headers = ['timestamp', 'level', 'source', 'message', 'data'];
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.level,
                log.source,
                `"${log.message.replace(/"/g, '""')}"`,
                `"${JSON.stringify(log.data).replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    // Clear all logs
    clearLogs() {
        this.logs = [];
        this.saveToStorage();
        this.log('SESSION', 'Debug logs cleared');
    }

    // Check system health
    checkSystemHealth() {
        const health = {
            timestamp: new Date().toISOString(),
            localStorage: {
                available: typeof Storage !== 'undefined',
                usage: this.getLocalStorageUsage()
            },
            dataStores: {
                logDataStore: window.LogDataStore ? 'Available' : 'Missing',
                analysisDataStore: window.AnalysisDataStore ? 'Available' : 'Missing'
            },
            network: navigator.onLine ? 'Online' : 'Offline',
            performance: performance.now()
        };

        this.log('HEALTH', 'System health check', health, 'SYSTEM');
        return health;
    }

    // Get localStorage usage
    getLocalStorageUsage() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            return {
                totalBytes: totalSize,
                totalKB: (totalSize / 1024).toFixed(2),
                keyCount: Object.keys(localStorage).length
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Create singleton instance
const debugStore = new DebugStore();

// Export for use in other modules
window.DebugStore = debugStore;