// StatsManager - Handles statistics updates via events

class StatsManager {
    constructor() {
        this.statsElements = {};
        this.currentStats = {
            totalEntries: 0,
            todayEntries: 0,
            analysisCount: 0,
            lastUpdated: null
        };
        
        this.init();
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('StatsManager initialized', {}, 'STATSMANAGER');
        }
    }
    
    /**
     * Initialize stats manager
     */
    init() {
        // Find stats elements in the DOM
        this.findStatsElements();
        
        // Initial stats load
        this.loadInitialStats();
    }
    
    /**
     * Find stats elements in the DOM
     */
    findStatsElements() {
        // Look for common stats element patterns
        this.statsElements = {
            totalEntries: document.querySelector('.total-entries, #totalEntries, [data-stat="totalEntries"]'),
            todayEntries: document.querySelector('.today-entries, #todayEntries, [data-stat="todayEntries"]'),
            analysisCount: document.querySelector('.analysis-count, #analysisCount, [data-stat="analysisCount"]'),
            entryCount: document.querySelector('.entry-count, #entryCount, [data-stat="entryCount"]'),
            statsContainer: document.querySelector('.stats-container, #statsContainer, .app-stats')
        };
        
        // Count found elements
        const foundElements = Object.values(this.statsElements).filter(el => el !== null).length;
        
        if (window.DebugStore) {
            DebugStore.debug('Stats elements found', {
                foundElements: foundElements,
                totalElements: Object.keys(this.statsElements).length,
                elements: Object.fromEntries(
                    Object.entries(this.statsElements).map(([key, el]) => [key, !!el])
                )
            }, 'STATSMANAGER');
        }
    }
    
    /**
     * Load initial statistics
     */
    loadInitialStats() {
        if (window.LogManager) {
            const stats = window.LogManager.getUpdatedStats();
            this.updateStats(stats);
        }
    }
    
    /**
     * Setup event listeners for stats updates
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for stats update events
        EventBus.on('stats:updated', (data) => {
            this.updateStats(data);
        });
        
        // Listen for log events that affect stats
        EventBus.on('logEntry:created', (data) => {
            this.handleLogEntryCreated(data);
        });
        
        EventBus.on('logEntry:deleted', (data) => {
            this.handleLogEntryDeleted(data);
        });
        
        EventBus.on('logEntries:cleared', (data) => {
            this.handleLogEntriesCleared(data);
        });
        
        EventBus.on('logEntries:imported', (data) => {
            this.handleLogEntriesImported(data);
        });
        
        // Listen for analysis events that affect stats
        EventBus.on('analysis:completed', (data) => {
            this.handleAnalysisCompleted(data);
        });
        
        EventBus.on('analysis:failed', (data) => {
            this.handleAnalysisFailed(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('StatsManager event listeners setup', {}, 'STATSMANAGER');
        }
    }
    
    /**
     * Update statistics display
     * @param {Object} stats - Statistics object
     */
    updateStats(stats) {
        const previousStats = { ...this.currentStats };
        this.currentStats = {
            ...stats,
            lastUpdated: new Date().toISOString()
        };
        
        if (window.DebugStore) {
            DebugStore.debug('Updating stats', {
                newStats: this.currentStats,
                changes: this.getStatsChanges(previousStats, this.currentStats)
            }, 'STATSMANAGER');
        }
        
        // Update individual stat elements
        this.updateStatElement('totalEntries', this.currentStats.totalEntries, 'entries');
        this.updateStatElement('todayEntries', this.currentStats.todayEntries, 'today');
        this.updateStatElement('analysisCount', this.currentStats.analysisCount, 'analyzed');
        this.updateStatElement('entryCount', this.currentStats.totalEntries, 'total');
        
        // Update stats container if it exists
        if (this.statsElements.statsContainer) {
            this.updateStatsContainer();
        }
        
        // Emit updated event for other components
        if (window.EventBus) {
            EventBus.emit('stats:displayed', {
                stats: this.currentStats,
                changes: this.getStatsChanges(previousStats, this.currentStats)
            });
        }
    }
    
    /**
     * Update individual stat element
     * @param {string} elementKey - Key in statsElements
     * @param {number} value - New value
     * @param {string} label - Label for the stat
     */
    updateStatElement(elementKey, value, label) {
        const element = this.statsElements[elementKey];
        if (!element) return;
        
        // Store previous value for animation
        const previousValue = parseInt(element.dataset.value || '0');
        element.dataset.value = value;
        
        // Update text content
        if (element.tagName.toLowerCase() === 'span' || element.classList.contains('stat-value')) {
            element.textContent = value.toString();
        } else {
            // For more complex elements, update inner content
            const valueElement = element.querySelector('.stat-value') || element;
            valueElement.textContent = value.toString();
            
            // Update label if needed
            const labelElement = element.querySelector('.stat-label');
            if (labelElement && !labelElement.textContent.trim()) {
                labelElement.textContent = label;
            }
        }
        
        // Add animation class if value changed
        if (previousValue !== value) {
            this.animateStatChange(element, previousValue, value);
        }
    }
    
    /**
     * Animate stat change
     * @param {Element} element - Element to animate
     * @param {number} previousValue - Previous value
     * @param {number} newValue - New value
     */
    animateStatChange(element, previousValue, newValue) {
        // Add pulse animation class
        element.classList.add('stat-updated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('stat-updated');
        }, 600);
        
        // Add color indication for increase/decrease
        if (newValue > previousValue) {
            element.classList.add('stat-increased');
            setTimeout(() => element.classList.remove('stat-increased'), 1000);
        } else if (newValue < previousValue) {
            element.classList.add('stat-decreased');
            setTimeout(() => element.classList.remove('stat-decreased'), 1000);
        }
    }
    
    /**
     * Update stats container with summary
     */
    updateStatsContainer() {
        const container = this.statsElements.statsContainer;
        if (!container) return;
        
        // Create or update summary content
        let summaryElement = container.querySelector('.stats-summary');
        if (!summaryElement) {
            summaryElement = document.createElement('div');
            summaryElement.className = 'stats-summary';
            container.appendChild(summaryElement);
        }
        
        const { totalEntries, todayEntries, analysisCount } = this.currentStats;
        const analysisPercentage = totalEntries > 0 ? Math.round((analysisCount / totalEntries) * 100) : 0;
        
        summaryElement.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${totalEntries}</span>
                <span class="stat-label">Total Entries</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${todayEntries}</span>
                <span class="stat-label">Today</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${analysisPercentage}%</span>
                <span class="stat-label">Analyzed</span>
            </div>
        `;
    }
    
    /**
     * Handle log entry created
     * @param {Object} data - Event data
     */
    handleLogEntryCreated(data) {
        // Stats will be updated via stats:updated event
        if (window.DebugStore) {
            DebugStore.debug('Handling log entry created for stats', {
                entryId: data.entry.id
            }, 'STATSMANAGER');
        }
    }
    
    /**
     * Handle log entry deleted
     * @param {Object} data - Event data
     */
    handleLogEntryDeleted(data) {
        // Refresh stats after deletion
        this.refreshStats();
    }
    
    /**
     * Handle log entries cleared
     * @param {Object} data - Event data
     */
    handleLogEntriesCleared(data) {
        this.updateStats({
            totalEntries: 0,
            todayEntries: 0,
            analysisCount: 0
        });
    }
    
    /**
     * Handle log entries imported
     * @param {Object} data - Event data
     */
    handleLogEntriesImported(data) {
        // Refresh stats after import
        this.refreshStats();
    }
    
    /**
     * Handle analysis completed
     * @param {Object} data - Event data
     */
    handleAnalysisCompleted(data) {
        // Increment analysis count
        this.currentStats.analysisCount++;
        this.updateStats(this.currentStats);
    }
    
    /**
     * Handle analysis failed
     * @param {Object} data - Event data
     */
    handleAnalysisFailed(data) {
        // Analysis count doesn't change on failure
        if (window.DebugStore) {
            DebugStore.debug('Analysis failed, stats unchanged', {
                entryId: data.entryId
            }, 'STATSMANAGER');
        }
    }
    
    /**
     * Refresh stats from LogManager
     */
    refreshStats() {
        if (window.LogManager) {
            const stats = window.LogManager.getUpdatedStats();
            this.updateStats(stats);
        }
    }
    
    /**
     * Get changes between old and new stats
     * @param {Object} oldStats - Previous statistics
     * @param {Object} newStats - New statistics
     * @returns {Object} - Changes object
     */
    getStatsChanges(oldStats, newStats) {
        const changes = {};
        
        for (const key of ['totalEntries', 'todayEntries', 'analysisCount']) {
            const oldValue = oldStats[key] || 0;
            const newValue = newStats[key] || 0;
            
            if (oldValue !== newValue) {
                changes[key] = {
                    from: oldValue,
                    to: newValue,
                    change: newValue - oldValue
                };
            }
        }
        
        return changes;
    }
    
    /**
     * Get current statistics
     * @returns {Object} - Current stats
     */
    getCurrentStats() {
        return { ...this.currentStats };
    }
    
    /**
     * Force stats refresh
     */
    forceRefresh() {
        this.refreshStats();
        
        if (window.DebugStore) {
            DebugStore.debug('Stats force refreshed', {}, 'STATSMANAGER');
        }
    }
    
    /**
     * Add custom stat element
     * @param {string} key - Element key
     * @param {Element} element - DOM element
     */
    addStatElement(key, element) {
        this.statsElements[key] = element;
        
        if (window.DebugStore) {
            DebugStore.debug('Custom stat element added', { key }, 'STATSMANAGER');
        }
    }
    
    /**
     * Remove stat element
     * @param {string} key - Element key
     */
    removeStatElement(key) {
        delete this.statsElements[key];
        
        if (window.DebugStore) {
            DebugStore.debug('Stat element removed', { key }, 'STATSMANAGER');
        }
    }
    
    /**
     * Destroy stats manager (cleanup)
     */
    destroy() {
        if (window.EventBus) {
            EventBus.removeAllListeners('stats:updated');
            EventBus.removeAllListeners('logEntry:created');
            EventBus.removeAllListeners('logEntry:deleted');
            EventBus.removeAllListeners('logEntries:cleared');
            EventBus.removeAllListeners('logEntries:imported');
            EventBus.removeAllListeners('analysis:completed');
            EventBus.removeAllListeners('analysis:failed');
        }
        
        if (window.DebugStore) {
            DebugStore.debug('StatsManager destroyed', {}, 'STATSMANAGER');
        }
    }
}

// Export for use in other modules
window.StatsManager = StatsManager;