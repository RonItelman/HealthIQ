// DebugModalManager - Manages debug modal UI interactions and display

class DebugModalManager {
    constructor() {
        this.modalElement = null;
        this.elements = {};
        this.isOpen = false;
        this.currentTab = 'logs';
        this.refreshInterval = null;
        
        if (window.DebugStore) {
            DebugStore.debug('DebugModalManager initialized', {}, 'DEBUGMODAL');
        }
    }
    
    /**
     * Initialize modal manager
     */
    init() {
        this.findElements();
        this.setupEventListeners();
        this.setupAutoRefresh();
        
        if (window.DebugStore) {
            DebugStore.debug('DebugModalManager init completed', {
                elementsFound: Object.keys(this.elements).length
            }, 'DEBUGMODAL');
        }
    }
    
    /**
     * Find modal elements in DOM
     */
    findElements() {
        this.modalElement = document.getElementById('debugModal');
        
        this.elements = {
            modal: this.modalElement,
            closeBtn: document.getElementById('debugCloseBtn'),
            tabButtons: document.querySelectorAll('[data-tab]'),
            tabContents: document.querySelectorAll('[data-tab-content]'),
            logsContainer: document.getElementById('debugLogsContainer'),
            eventsContainer: document.getElementById('debugEventsContainer'),
            analyticsContainer: document.getElementById('debugAnalyticsContainer'),
            clearLogsBtn: document.getElementById('clearDebugLogsBtn'),
            exportLogsBtn: document.getElementById('exportDebugLogsBtn'),
            refreshBtn: document.getElementById('refreshDebugBtn'),
            filterSelect: document.getElementById('debugLogFilter'),
            searchInput: document.getElementById('debugSearchInput')
        };
        
        // Verify required elements exist
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element && key !== 'tabButtons' && key !== 'tabContents')
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.warn('DebugModalManager: Missing elements:', missingElements);
        }
    }
    
    /**
     * Setup event listeners for modal interactions
     */
    setupEventListeners() {
        if (!this.elements.modal) return;
        
        // Close button
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // Tab switching
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Action buttons
        if (this.elements.clearLogsBtn) {
            this.elements.clearLogsBtn.addEventListener('click', () => {
                this.clearLogs();
            });
        }
        
        if (this.elements.exportLogsBtn) {
            this.elements.exportLogsBtn.addEventListener('click', () => {
                this.exportLogs();
            });
        }
        
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => {
                this.refreshDisplay();
            });
        }
        
        // Filter and search
        if (this.elements.filterSelect) {
            this.elements.filterSelect.addEventListener('change', () => {
                this.refreshDisplay();
            });
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => {
                this.debounceRefresh();
            });
        }
        
        // Click outside modal to close
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeModal();
            }
        });
        
        if (window.DebugStore) {
            DebugStore.debug('DebugModalManager event listeners setup', {}, 'DEBUGMODAL');
        }
    }
    
    /**
     * Setup auto refresh for live updates
     */
    setupAutoRefresh() {
        // Refresh every 5 seconds when modal is open
        this.refreshInterval = setInterval(() => {
            if (this.isOpen) {
                this.refreshDisplay();
            }
        }, 5000);
    }
    
    /**
     * Show debug modal
     */
    showModal() {
        if (!this.elements.modal) {
            console.error('Debug modal element not found');
            return;
        }
        
        this.isOpen = true;
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Switch to default tab and refresh
        this.switchTab(this.currentTab);
        this.refreshDisplay();
        
        if (window.DebugStore) {
            DebugStore.debug('Debug modal shown', {
                currentTab: this.currentTab
            }, 'DEBUGMODAL');
        }
    }
    
    /**
     * Close debug modal
     */
    closeModal() {
        if (!this.elements.modal) return;
        
        this.isOpen = false;
        this.elements.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (window.DebugStore) {
            DebugStore.debug('Debug modal closed', {}, 'DEBUGMODAL');
        }
    }
    
    /**
     * Switch active tab
     * @param {string} tabName - Tab to switch to
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        this.elements.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });
        
        // Update tab content
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tabName);
        });
        
        // Refresh content for current tab
        this.refreshTabContent(tabName);
        
        if (window.DebugStore) {
            DebugStore.debug('Debug modal tab switched', {
                tab: tabName
            }, 'DEBUGMODAL');
        }
    }
    
    /**
     * Refresh display for current tab
     */
    refreshDisplay() {
        if (!this.isOpen) return;
        
        this.refreshTabContent(this.currentTab);
    }
    
    /**
     * Refresh content for specific tab
     * @param {string} tabName - Tab to refresh
     */
    refreshTabContent(tabName) {
        switch (tabName) {
            case 'logs':
                this.refreshLogsTab();
                break;
            case 'events':
                this.refreshEventsTab();
                break;
            case 'analytics':
                this.refreshAnalyticsTab();
                break;
        }
    }
    
    /**
     * Refresh logs tab content
     */
    refreshLogsTab() {
        if (!this.elements.logsContainer) return;
        
        const filter = this.elements.filterSelect?.value || 'all';
        const search = this.elements.searchInput?.value?.toLowerCase() || '';
        
        let logs = window.DebugStore?.getAllLogs() || [];
        
        // Apply filters
        if (filter !== 'all') {
            logs = logs.filter(log => log.level === filter);
        }
        
        if (search) {
            logs = logs.filter(log => 
                log.message.toLowerCase().includes(search) ||
                log.source.toLowerCase().includes(search)
            );
        }
        
        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limit to last 100 entries for performance
        logs = logs.slice(0, 100);
        
        this.elements.logsContainer.innerHTML = this.renderLogs(logs);
    }
    
    /**
     * Refresh events tab content
     */
    refreshEventsTab() {
        if (!this.elements.eventsContainer) return;
        
        const events = window.EventBus?.getHistory() || [];
        const recentEvents = events.slice(-50); // Last 50 events
        
        this.elements.eventsContainer.innerHTML = this.renderEvents(recentEvents);
    }
    
    /**
     * Refresh analytics tab content
     */
    refreshAnalyticsTab() {
        if (!this.elements.analyticsContainer) return;
        
        const analytics = this.gatherAnalytics();
        
        this.elements.analyticsContainer.innerHTML = this.renderAnalytics(analytics);
    }
    
    /**
     * Render logs as HTML
     * @param {Array} logs - Log entries to render
     * @returns {string} - HTML content
     */
    renderLogs(logs) {
        if (logs.length === 0) {
            return '<div class="debug-empty">No logs found</div>';
        }
        
        return logs.map(log => {
            const levelClass = log.level.toLowerCase();
            const time = DateFormatter.formatTime(log.timestamp);
            const data = log.data && Object.keys(log.data).length > 0 
                ? `<div class="log-data">${JSON.stringify(log.data, null, 2)}</div>`
                : '';
            
            return `
                <div class="debug-log-entry ${levelClass}">
                    <div class="log-header">
                        <span class="log-time">${time}</span>
                        <span class="log-level">${log.level}</span>
                        <span class="log-source">${log.source}</span>
                    </div>
                    <div class="log-message">${TextProcessor.escapeHtml(log.message)}</div>
                    ${data}
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render events as HTML
     * @param {Array} events - Event entries to render
     * @returns {string} - HTML content
     */
    renderEvents(events) {
        if (events.length === 0) {
            return '<div class="debug-empty">No events found</div>';
        }
        
        return events.map(event => {
            const time = DateFormatter.formatTime(event.timestamp);
            const dataStr = JSON.stringify(event.data || {}, null, 2);
            
            return `
                <div class="debug-event-entry">
                    <div class="event-header">
                        <span class="event-time">${time}</span>
                        <span class="event-type">${event.type}</span>
                        <span class="event-id">${event.id}</span>
                    </div>
                    <div class="event-data">
                        <pre>${TextProcessor.escapeHtml(dataStr)}</pre>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render analytics as HTML
     * @param {Object} analytics - Analytics data
     * @returns {string} - HTML content
     */
    renderAnalytics(analytics) {
        return `
            <div class="analytics-section">
                <h4>System Status</h4>
                <div class="analytics-grid">
                    <div class="metric">
                        <span class="metric-label">Total Logs</span>
                        <span class="metric-value">${analytics.totalLogs}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Total Events</span>
                        <span class="metric-value">${analytics.totalEvents}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Error Count</span>
                        <span class="metric-value ${analytics.errorCount > 0 ? 'error' : ''}">${analytics.errorCount}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Storage Used</span>
                        <span class="metric-value">${analytics.storageUsed}</span>
                    </div>
                </div>
            </div>
            
            <div class="analytics-section">
                <h4>Performance Metrics</h4>
                <div class="performance-data">
                    ${this.renderPerformanceMetrics(analytics.performance)}
                </div>
            </div>
            
            <div class="analytics-section">
                <h4>Event Statistics</h4>
                <div class="event-stats">
                    ${this.renderEventStats(analytics.eventStats)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render performance metrics
     * @param {Object} performance - Performance data
     * @returns {string} - HTML content
     */
    renderPerformanceMetrics(performance) {
        return Object.entries(performance).map(([key, value]) => {
            return `
                <div class="performance-metric">
                    <span class="perf-label">${key}</span>
                    <span class="perf-value">${value}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render event statistics
     * @param {Object} eventStats - Event statistics
     * @returns {string} - HTML content
     */
    renderEventStats(eventStats) {
        return Object.entries(eventStats).map(([event, count]) => {
            return `
                <div class="event-stat">
                    <span class="event-name">${event}</span>
                    <span class="event-count">${count}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Gather analytics data
     * @returns {Object} - Analytics data
     */
    gatherAnalytics() {
        const logs = window.DebugStore?.getAllLogs() || [];
        const events = window.EventBus?.getHistory() || [];
        
        // Count errors
        const errorCount = logs.filter(log => log.level === 'ERROR').length;
        
        // Calculate storage usage
        const storageUsed = this.calculateStorageUsage();
        
        // Performance metrics
        const performance = {
            'Page Load Time': `${Math.round(performance.timing ? 
                (performance.timing.loadEventEnd - performance.timing.navigationStart) / 1000 : 0)}s`,
            'Memory Usage': this.getMemoryUsage(),
            'Local Storage': storageUsed
        };
        
        // Event statistics
        const eventStats = {};
        events.forEach(event => {
            eventStats[event.type] = (eventStats[event.type] || 0) + 1;
        });
        
        return {
            totalLogs: logs.length,
            totalEvents: events.length,
            errorCount: errorCount,
            storageUsed: storageUsed,
            performance: performance,
            eventStats: eventStats
        };
    }
    
    /**
     * Calculate storage usage
     * @returns {string} - Storage usage string
     */
    calculateStorageUsage() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return `${Math.round(total / 1024)}KB`;
        } catch (error) {
            return 'Unknown';
        }
    }
    
    /**
     * Get memory usage information
     * @returns {string} - Memory usage string
     */
    getMemoryUsage() {
        if (performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
            return `${used}MB / ${total}MB`;
        }
        return 'Not available';
    }
    
    /**
     * Clear debug logs
     */
    clearLogs() {
        if (window.EventBus) {
            EventBus.emit('debug:clearLogs');
        }
        this.refreshDisplay();
    }
    
    /**
     * Export debug logs
     */
    exportLogs() {
        if (window.EventBus) {
            EventBus.emit('debug:exportLogs', { format: 'json' });
        }
    }
    
    /**
     * Debounced refresh for search input
     */
    debounceRefresh() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.refreshDisplay();
        }, 300);
    }
    
    /**
     * Show performance warning
     * @param {Object} data - Performance warning data
     */
    showPerformanceWarning(data) {
        if (!this.isOpen || this.currentTab !== 'analytics') return;
        
        // Add warning to analytics display
        const warningHtml = `
            <div class="performance-warning">
                <span class="material-symbols-outlined">warning</span>
                <span>Slow operation detected: ${data.operation} (${data.duration}ms)</span>
            </div>
        `;
        
        if (this.elements.analyticsContainer) {
            this.elements.analyticsContainer.insertAdjacentHTML('afterbegin', warningHtml);
        }
    }
    
    /**
     * Get current modal state
     * @returns {Object} - Modal state
     */
    getState() {
        return {
            isOpen: this.isOpen,
            currentTab: this.currentTab,
            logCount: window.DebugStore?.getAllLogs()?.length || 0,
            eventCount: window.EventBus?.getHistory()?.length || 0
        };
    }
    
    /**
     * Destroy modal manager (cleanup)
     */
    destroy() {
        if (this.isOpen) {
            this.closeModal();
        }
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        if (window.DebugStore) {
            DebugStore.debug('DebugModalManager destroyed', {}, 'DEBUGMODAL');
        }
    }
}

// Export for use in other modules
window.DebugModalManager = DebugModalManager;