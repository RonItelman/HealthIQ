// DebugAnalyticsService - Handles performance monitoring and debug analytics

class DebugAnalyticsService {
    constructor() {
        this.metrics = {
            performance: {},
            events: {},
            errors: {},
            operations: {},
            storage: {}
        };
        
        this.performanceObserver = null;
        this.isMonitoring = false;
        this.startTime = Date.now();
        this.operationTimers = new Map();
        
        if (window.DebugStore) {
            DebugStore.debug('DebugAnalyticsService initialized', {}, 'DEBUGANALYTICS');
        }
    }
    
    /**
     * Initialize analytics service
     */
    init() {
        this.setupPerformanceMonitoring();
        this.setupEventTracking();
        this.setupErrorTracking();
        
        if (window.DebugStore) {
            DebugStore.debug('DebugAnalyticsService init completed', {}, 'DEBUGANALYTICS');
        }
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Track page load metrics
        this.trackPageLoadMetrics();
        
        // Setup Performance Observer if available
        if (window.PerformanceObserver) {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    this.processPerformanceEntries(list.getEntries());
                });
                
                this.performanceObserver.observe({ 
                    entryTypes: ['measure', 'navigation', 'resource', 'paint']
                });
            } catch (error) {
                console.warn('PerformanceObserver not fully supported:', error);
            }
        }
    }
    
    /**
     * Setup event tracking
     */
    setupEventTracking() {
        if (!window.EventBus) return;
        
        // Track all events for analytics
        EventBus.addMiddleware('analytics', (event) => {
            this.trackEvent(event);
        }, { priority: 80 });
    }
    
    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        // Track global errors
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        
        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                reason: event.reason
            });
        });
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        this.isMonitoring = true;
        this.startTime = Date.now();
        
        // Start monitoring resource usage
        this.monitorResourceUsage();
        
        if (window.DebugStore) {
            DebugStore.info('Performance monitoring started', {}, 'DEBUGANALYTICS');
        }
    }
    
    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
        this.isMonitoring = false;
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        if (window.DebugStore) {
            DebugStore.info('Performance monitoring stopped', {}, 'DEBUGANALYTICS');
        }
    }
    
    /**
     * Track an event
     * @param {Object} event - Event to track
     */
    trackEvent(event) {
        if (!event || !event.type) return;
        
        const eventType = event.type;
        
        // Initialize event metrics if not exists
        if (!this.metrics.events[eventType]) {
            this.metrics.events[eventType] = {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                lastSeen: null
            };
        }
        
        const metric = this.metrics.events[eventType];
        metric.count++;
        metric.lastSeen = new Date().toISOString();
        
        // Track processing time if available
        if (event.processingTime) {
            metric.totalTime += event.processingTime;
            metric.avgTime = metric.totalTime / metric.count;
            metric.minTime = Math.min(metric.minTime, event.processingTime);
            metric.maxTime = Math.max(metric.maxTime, event.processingTime);
        }
        
        // Check for slow events
        if (event.processingTime && event.processingTime > 100) {
            this.trackSlowOperation({
                type: 'event',
                operation: eventType,
                duration: event.processingTime,
                threshold: 100
            });
        }
    }
    
    /**
     * Track an error
     * @param {Object} error - Error data
     */
    trackError(error) {
        const errorType = error.type || 'unknown';
        const timestamp = new Date().toISOString();
        
        // Initialize error metrics if not exists
        if (!this.metrics.errors[errorType]) {
            this.metrics.errors[errorType] = {
                count: 0,
                lastSeen: null,
                messages: {}
            };
        }
        
        const metric = this.metrics.errors[errorType];
        metric.count++;
        metric.lastSeen = timestamp;
        
        // Track unique error messages
        const message = error.message || 'Unknown error';
        if (!metric.messages[message]) {
            metric.messages[message] = {
                count: 0,
                firstSeen: timestamp,
                lastSeen: timestamp
            };
        }
        
        metric.messages[message].count++;
        metric.messages[message].lastSeen = timestamp;
        
        if (window.DebugStore) {
            DebugStore.warn('Error tracked in analytics', {
                type: errorType,
                message: message
            }, 'DEBUGANALYTICS');
        }
    }
    
    /**
     * Track slow operation
     * @param {Object} data - Slow operation data
     */
    trackSlowOperation(data) {
        const opType = data.type || 'unknown';
        
        if (!this.metrics.performance.slowOperations) {
            this.metrics.performance.slowOperations = {};
        }
        
        if (!this.metrics.performance.slowOperations[opType]) {
            this.metrics.performance.slowOperations[opType] = [];
        }
        
        this.metrics.performance.slowOperations[opType].push({
            operation: data.operation,
            duration: data.duration,
            threshold: data.threshold,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 slow operations per type
        if (this.metrics.performance.slowOperations[opType].length > 50) {
            this.metrics.performance.slowOperations[opType] = 
                this.metrics.performance.slowOperations[opType].slice(-50);
        }
    }
    
    /**
     * Start timing an operation
     * @param {string} operationName - Name of the operation
     * @returns {string} - Timer ID
     */
    startTimer(operationName) {
        const timerId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        this.operationTimers.set(timerId, {
            name: operationName,
            startTime: performance.now(),
            startTimestamp: new Date().toISOString()
        });
        
        return timerId;
    }
    
    /**
     * End timing an operation
     * @param {string} timerId - Timer ID from startTimer
     * @returns {number} - Duration in milliseconds
     */
    endTimer(timerId) {
        const timer = this.operationTimers.get(timerId);
        if (!timer) {
            console.warn(`Timer ${timerId} not found`);
            return 0;
        }
        
        const duration = performance.now() - timer.startTime;
        this.operationTimers.delete(timerId);
        
        // Track operation metrics
        this.trackOperation(timer.name, duration);
        
        return duration;
    }
    
    /**
     * Track operation performance
     * @param {string} operationName - Name of operation
     * @param {number} duration - Duration in milliseconds
     */
    trackOperation(operationName, duration) {
        if (!this.metrics.operations[operationName]) {
            this.metrics.operations[operationName] = {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                recentDurations: []
            };
        }
        
        const metric = this.metrics.operations[operationName];
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
        metric.minTime = Math.min(metric.minTime, duration);
        metric.maxTime = Math.max(metric.maxTime, duration);
        
        // Keep recent durations for trend analysis
        metric.recentDurations.push(duration);
        if (metric.recentDurations.length > 20) {
            metric.recentDurations.shift();
        }
        
        // Check for slow operations
        if (duration > 500) { // 500ms threshold
            this.trackSlowOperation({
                type: 'operation',
                operation: operationName,
                duration: duration,
                threshold: 500
            });
        }
    }
    
    /**
     * Track page load metrics
     */
    trackPageLoadMetrics() {
        if (!performance.timing) return;
        
        const timing = performance.timing;
        
        this.metrics.performance.pageLoad = {
            navigationStart: timing.navigationStart,
            domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
            connect: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            domProcessing: timing.domComplete - timing.domLoading,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
        };
    }
    
    /**
     * Process performance entries
     * @param {Array} entries - Performance entries
     */
    processPerformanceEntries(entries) {
        entries.forEach(entry => {
            switch (entry.entryType) {
                case 'navigation':
                    this.processNavigationEntry(entry);
                    break;
                case 'resource':
                    this.processResourceEntry(entry);
                    break;
                case 'paint':
                    this.processPaintEntry(entry);
                    break;
                case 'measure':
                    this.processMeasureEntry(entry);
                    break;
            }
        });
    }
    
    /**
     * Process navigation performance entry
     * @param {Object} entry - Navigation entry
     */
    processNavigationEntry(entry) {
        this.metrics.performance.navigation = {
            type: entry.type,
            redirectCount: entry.redirectCount,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize,
            duration: entry.duration
        };
    }
    
    /**
     * Process resource performance entry
     * @param {Object} entry - Resource entry
     */
    processResourceEntry(entry) {
        if (!this.metrics.performance.resources) {
            this.metrics.performance.resources = {
                total: 0,
                totalSize: 0,
                byType: {}
            };
        }
        
        const resources = this.metrics.performance.resources;
        resources.total++;
        resources.totalSize += entry.transferSize || 0;
        
        // Categorize by resource type
        const type = this.getResourceType(entry.name);
        if (!resources.byType[type]) {
            resources.byType[type] = { count: 0, size: 0 };
        }
        resources.byType[type].count++;
        resources.byType[type].size += entry.transferSize || 0;
    }
    
    /**
     * Process paint performance entry
     * @param {Object} entry - Paint entry
     */
    processPaintEntry(entry) {
        if (!this.metrics.performance.paint) {
            this.metrics.performance.paint = {};
        }
        
        this.metrics.performance.paint[entry.name] = entry.startTime;
    }
    
    /**
     * Process measure performance entry
     * @param {Object} entry - Measure entry
     */
    processMeasureEntry(entry) {
        if (!this.metrics.performance.measures) {
            this.metrics.performance.measures = {};
        }
        
        this.metrics.performance.measures[entry.name] = {
            duration: entry.duration,
            startTime: entry.startTime
        };
    }
    
    /**
     * Get resource type from URL
     * @param {string} url - Resource URL
     * @returns {string} - Resource type
     */
    getResourceType(url) {
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'stylesheet';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
        if (url.includes('/api/') || url.includes('claude')) return 'api';
        return 'other';
    }
    
    /**
     * Monitor resource usage
     */
    monitorResourceUsage() {
        if (!this.isMonitoring) return;
        
        // Update storage metrics
        this.updateStorageMetrics();
        
        // Update memory metrics if available
        if (performance.memory) {
            this.metrics.performance.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                timestamp: new Date().toISOString()
            };
        }
        
        // Schedule next update
        setTimeout(() => this.monitorResourceUsage(), 30000); // Every 30 seconds
    }
    
    /**
     * Update storage metrics
     */
    updateStorageMetrics() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            const byKey = {};
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length + key.length;
                    totalSize += size;
                    itemCount++;
                    byKey[key] = size;
                }
            }
            
            this.metrics.storage = {
                totalSize: totalSize,
                totalKB: Math.round(totalSize / 1024),
                itemCount: itemCount,
                byKey: byKey,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            this.metrics.storage = { error: error.message };
        }
    }
    
    /**
     * Get all metrics
     * @returns {Object} - All collected metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.startTime,
            collectedAt: new Date().toISOString()
        };
    }
    
    /**
     * Get performance summary
     * @returns {Object} - Performance summary
     */
    getPerformanceSummary() {
        const events = this.metrics.events;
        const operations = this.metrics.operations;
        const errors = this.metrics.errors;
        
        return {
            totalEvents: Object.values(events).reduce((sum, metric) => sum + metric.count, 0),
            slowEvents: Object.values(events).filter(metric => metric.avgTime > 100).length,
            totalOperations: Object.values(operations).reduce((sum, metric) => sum + metric.count, 0),
            slowOperations: Object.keys(this.metrics.performance.slowOperations || {}).length,
            totalErrors: Object.values(errors).reduce((sum, metric) => sum + metric.count, 0),
            uptime: Date.now() - this.startTime,
            memoryUsage: this.metrics.performance.memory?.usedJSHeapSize || 0,
            storageUsage: this.metrics.storage?.totalKB || 0
        };
    }
    
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics = {
            performance: {},
            events: {},
            errors: {},
            operations: {},
            storage: {}
        };
        
        this.startTime = Date.now();
        
        if (window.DebugStore) {
            DebugStore.info('Debug analytics metrics cleared', {}, 'DEBUGANALYTICS');
        }
    }
    
    /**
     * Export metrics data
     * @param {string} format - Export format
     * @returns {string} - Exported data
     */
    exportMetrics(format = 'json') {
        const metrics = this.getMetrics();
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(metrics, null, 2);
            case 'csv':
                return this.exportMetricsAsCSV(metrics);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Export metrics as CSV
     * @param {Object} metrics - Metrics data
     * @returns {string} - CSV content
     */
    exportMetricsAsCSV(metrics) {
        const rows = [['Category', 'Metric', 'Value']];
        
        // Add event metrics
        Object.entries(metrics.events).forEach(([event, data]) => {
            rows.push(['Event', `${event}_count`, data.count]);
            rows.push(['Event', `${event}_avgTime`, data.avgTime]);
        });
        
        // Add operation metrics
        Object.entries(metrics.operations).forEach(([op, data]) => {
            rows.push(['Operation', `${op}_count`, data.count]);
            rows.push(['Operation', `${op}_avgTime`, data.avgTime]);
        });
        
        // Add error metrics
        Object.entries(metrics.errors).forEach(([error, data]) => {
            rows.push(['Error', `${error}_count`, data.count]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
    
    /**
     * Destroy analytics service (cleanup)
     */
    destroy() {
        this.stopPerformanceMonitoring();
        this.operationTimers.clear();
        
        if (window.DebugStore) {
            DebugStore.debug('DebugAnalyticsService destroyed', {}, 'DEBUGANALYTICS');
        }
    }
}

// Export for use in other modules
window.DebugAnalyticsService = DebugAnalyticsService;