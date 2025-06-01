// LogManager - Main coordinator for all log-related operations

class LogManager {
    constructor() {
        // Initialize component managers
        this.entryFactory = new LogEntryFactory();
        this.analysisCoordinator = new LogAnalysisCoordinator();
        this.viewManager = new LogViewManager();
        
        // Data stores (initialized elsewhere)
        this.logDataStore = window.LogDataStore;
        this.analysisDataStore = window.AnalysisDataStore;
        
        if (window.DebugStore) {
            DebugStore.debug('LogManager initialized', {
                hasLogDataStore: !!this.logDataStore,
                hasAnalysisDataStore: !!this.analysisDataStore
            }, 'LOGMANAGER');
        }
    }
    
    /**
     * Initialize the log manager
     */
    init() {
        if (window.DebugStore) {
            DebugStore.info('LogManager initialization started', {}, 'LOGMANAGER');
        }
        
        // Update initial stats
        this.updateStats();
        
        // Set up event listeners
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.success('LogManager initialized successfully', {
                entryCount: this.getEntryCount(),
                todayCount: this.getTodayCount()
            }, 'LOGMANAGER');
        }
        
        console.log('LogManager initialized with new modular architecture');
    }
    
    /**
     * Set up event bus listeners
     */
    setupEventListeners() {
        if (!window.EventBus) {
            console.warn('EventBus not available, using legacy event handling');
            return;
        }
        
        // Listen for analysis events
        EventBus.on('analysis:completed', (data) => {
            this.handleAnalysisComplete(data.entryId);
        });
        
        EventBus.on('analysis:failed', (data) => {
            this.handleAnalysisFailed(data.entryId, data.error);
        });
        
        // Listen for view change events  
        EventBus.on('view:changed', (data) => {
            this.handleViewChange(data);
        });
        
        // Listen for UI events that affect log display
        EventBus.on('filter:applied', () => {
            this.handleFiltersChanged();
        });
        
        EventBus.on('search:performed', () => {
            this.handleSearchPerformed();
        });
        
        if (window.DebugStore) {
            DebugStore.debug('LogManager event listeners setup', {
                eventBusAvailable: true
            }, 'LOGMANAGER');
        }
    }
    
    /**
     * Create a new log entry
     * @param {string} content - Entry content from user input
     * @returns {Promise<LogEntry>} - Created log entry
     */
    async createEntry(content = null) {
        const timer = window.DebugStore ? DebugStore.startTimer('createLogEntry') : null;
        
        // Get content from UI if not provided
        if (content === null) {
            content = window.UI?.elements?.logText?.value?.trim() || '';
        }
        
        // Emit creating event for validation and preprocessing
        if (window.EventBus) {
            EventBus.emit('logEntry:creating', {
                content: content,
                hasHealthContext: !!(window.HealthContext && window.HealthContext.hasContext()),
                isOnline: !(window.PWAManager && window.PWAManager.isOffline),
                userAgent: navigator.userAgent
            });
        }
        
        if (window.DebugStore) {
            DebugStore.info('Creating new log entry', {
                contentLength: content.length,
                hasHealthContext: !!(window.HealthContext && window.HealthContext.hasContext()),
                isOnline: !(window.PWAManager && window.PWAManager.isOffline)
            }, 'LOGMANAGER');
        }
        
        try {
            // Validate content
            const validation = this.entryFactory.validateContent(content);
            if (!validation.isValid) {
                const errorData = {
                    error: new Error(validation.error),
                    content: content,
                    operation: 'validation'
                };
                
                // Emit error event
                if (window.EventBus) {
                    EventBus.emit('logEntry:error', errorData);
                }
                
                if (window.DebugStore) {
                    DebugStore.warn('Log entry creation failed - validation error', {
                        error: validation.error
                    }, 'LOGMANAGER');
                }
                
                return null;
            }
            
            // Create entry using factory
            const logEntry = this.entryFactory.createEnhanced(content);
            
            // Persist to storage
            const savedEntry = this.logDataStore.createLogEntry(logEntry.toJSON());
            
            if (window.DebugStore) {
                DebugStore.success('Log entry created and saved', {
                    logId: savedEntry.id,
                    timestamp: savedEntry.timestamp,
                    readyForAnalysis: logEntry.readyForAnalysis
                }, 'LOGMANAGER');
            }
            
            // Clear UI input
            if (window.UI?.elements?.logText) {
                window.UI.elements.logText.value = '';
            }
            
            // Get updated stats
            const stats = this.getUpdatedStats();
            
            // Emit success event
            if (window.EventBus) {
                EventBus.emit('logEntry:created', {
                    entry: savedEntry,
                    stats: stats,
                    readyForAnalysis: logEntry.readyForAnalysis
                });
            }
            
            // Schedule analysis if ready
            if (logEntry.readyForAnalysis) {
                this.analysisCoordinator.scheduleAnalysis(savedEntry);
            }
            
            timer?.end();
            return savedEntry;
            
        } catch (error) {
            const errorData = {
                error: error,
                content: content,
                operation: 'creation'
            };
            
            // Emit error event
            if (window.EventBus) {
                EventBus.emit('logEntry:error', errorData);
            }
            
            if (window.DebugStore) {
                DebugStore.error('Failed to create log entry', {
                    error: error.message,
                    contentPreview: content.substring(0, 50),
                    stack: error.stack
                }, 'LOGMANAGER');
            }
            
            console.error('Failed to create log entry:', error);
            throw error;
        }
    }
    
    /**
     * Get all entries for current view
     * @returns {Array} - Entries prepared for display
     */
    getEntries() {
        return this.viewManager.getEntriesForCurrentView();
    }
    
    /**
     * Get entries for specific view
     * @param {string} viewType - View type to get entries for
     * @returns {Array} - Entries for specified view
     */
    getEntriesForView(viewType) {
        return this.viewManager.getEntriesForView(viewType);
    }
    
    /**
     * Get total entry count
     * @returns {number} - Total number of entries
     */
    getEntryCount() {
        if (!this.logDataStore) return 0;
        const stats = this.logDataStore.getStats();
        return stats.totalEntries || 0;
    }
    
    /**
     * Get today's entry count
     * @returns {number} - Number of entries created today
     */
    getTodayCount() {
        const entries = this.getEntries();
        return entries.filter(entry => 
            DateFormatter.isToday(entry.timestamp)
        ).length;
    }
    
    /**
     * Delete an entry
     * @param {string} id - Entry ID to delete
     */
    deleteEntry(id) {
        if (window.DebugStore) {
            DebugStore.info('Deleting log entry', { logId: id }, 'LOGMANAGER');
        }
        
        try {
            // Get entry data before deletion for event
            const entry = this.logDataStore.getLogEntry(id);
            const analysis = this.analysisDataStore.getAnalysis(id);
            
            // Delete from both stores
            this.logDataStore.deleteLogEntry(id);
            this.analysisDataStore.deleteAnalysis(id);
            
            // Emit deleted event
            if (window.EventBus) {
                EventBus.emit('logEntry:deleted', {
                    entryId: id,
                    content: entry?.content,
                    hadAnalysis: !!analysis
                });
            }
            
            if (window.DebugStore) {
                DebugStore.success('Log entry deleted', { logId: id }, 'LOGMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to delete log entry', {
                    logId: id,
                    error: error.message
                }, 'LOGMANAGER');
            }
            throw error;
        }
    }
    
    /**
     * Clear all entries
     */
    clearAllEntries() {
        if (window.DebugStore) {
            DebugStore.info('Clearing all log entries', {}, 'LOGMANAGER');
        }
        
        try {
            // Clear both stores
            this.logDataStore.clearAllData();
            this.analysisDataStore.clearAllData();
            
            // Clear analysis queue
            this.analysisCoordinator.clearQueue();
            
            // Update UI
            this.updateStats();
            this.renderCurrentView();
            
            if (window.DebugStore) {
                DebugStore.success('All log entries cleared', {}, 'LOGMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to clear log entries', {
                    error: error.message
                }, 'LOGMANAGER');
            }
            throw error;
        }
    }
    
    /**
     * Toggle view type
     * @param {string} viewType - View type to toggle
     */
    toggleView(viewType) {
        this.viewManager.toggleView(viewType);
        this.renderCurrentView();
        this.updateViewButton(viewType);
    }
    
    /**
     * Set view type
     * @param {string} viewType - View type to set
     */
    setView(viewType) {
        this.viewManager.setView(viewType);
        this.renderCurrentView();
    }
    
    /**
     * Get current view type
     * @returns {string} - Current view type
     */
    getCurrentView() {
        return this.viewManager.getCurrentView();
    }
    
    /**
     * Set filters for log display
     * @param {Object} filters - Filter options
     */
    setFilters(filters) {
        this.viewManager.setFilters(filters);
        this.renderCurrentView();
    }
    
    /**
     * Clear all filters
     */
    clearFilters() {
        this.viewManager.clearFilters();
        this.renderCurrentView();
    }
    
    /**
     * Search entries
     * @param {string} searchTerm - Term to search for
     * @returns {Array} - Matching entries
     */
    searchEntries(searchTerm) {
        this.setFilters({ searchTerm: searchTerm });
        return this.getEntries();
    }
    
    /**
     * Show log modal
     */
    showLogModal() {
        if (window.DebugStore) {
            DebugStore.debug('Showing log modal', {}, 'LOGMANAGER');
        }
        
        if (!window.UI?.elements?.logModal) {
            console.error('Log modal element not found');
            return;
        }
        
        window.UI.elements.logModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Render current view
        this.renderCurrentView();
        
        // Celebrate if entries exist
        const entries = this.getEntries();
        if (entries.length > 0 && window.UI?.celebrateViewButton) {
            window.UI.celebrateViewButton();
        }
    }
    
    /**
     * Close log modal
     */
    closeLogModal() {
        if (window.DebugStore) {
            DebugStore.debug('Closing log modal', {}, 'LOGMANAGER');
        }
        
        if (window.UI?.elements?.logModal) {
            window.UI.elements.logModal.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Render current view
     */
    renderCurrentView() {
        if (!window.UI?.renderLogEntries) {
            console.error('UI rendering methods not available');
            return;
        }
        
        const entries = this.getEntries();
        const currentView = this.getCurrentView();
        
        if (window.DebugStore) {
            DebugStore.debug('Rendering current view', {
                viewType: currentView,
                entryCount: entries.length
            }, 'LOGMANAGER');
        }
        
        switch (currentView) {
            case 'markdown':
                window.UI.renderMarkdown(entries);
                break;
            case 'summary':
                window.UI.renderSummary(entries);
                break;
            default:
                window.UI.renderLogEntries(entries);
        }
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        if (window.UI?.updateStats) {
            const entries = this.getEntries();
            window.UI.updateStats(entries);
        }
    }
    
    /**
     * Update view button appearance
     * @param {string} viewType - View type that was toggled
     */
    updateViewButton(viewType) {
        const currentView = this.getCurrentView();
        
        if (viewType === 'markdown') {
            this.animateViewButton('viewMarkdownBtn', 'list', 'description', '≡', 'Σ', currentView === 'markdown');
        } else if (viewType === 'summary') {
            this.animateViewButton('summaryBtn', 'list', 'analytics', '≡', '☯', currentView === 'summary');
        }
    }
    
    /**
     * Animate view button change
     * @param {string} btnId - Button ID
     * @param {string} activeIcon - Icon when active
     * @param {string} inactiveIcon - Icon when inactive
     * @param {string} activeText - Text when active
     * @param {string} inactiveText - Text when inactive
     * @param {boolean} isActive - Whether view is currently active
     */
    animateViewButton(btnId, activeIcon, inactiveIcon, activeText, inactiveText, isActive) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        
        // Show checkmark first
        btn.innerHTML = '<span class="material-symbols-outlined">check</span><span class="icon-text">✓</span>';
        
        // Update to final state after delay
        setTimeout(() => {
            if (isActive) {
                btn.innerHTML = `<span class="material-symbols-outlined">${activeIcon}</span><span class="icon-text">${activeText}</span>`;
            } else {
                btn.innerHTML = `<span class="material-symbols-outlined">${inactiveIcon}</span><span class="icon-text">${inactiveText}</span>`;
            }
        }, 2000);
    }
    
    /**
     * Get updated stats for events
     * @returns {Object} - Updated statistics
     */
    getUpdatedStats() {
        return {
            totalEntries: this.getEntryCount(),
            todayEntries: this.getTodayCount(),
            analysisCount: this.getAnalysisCount()
        };
    }
    
    /**
     * Get analysis count
     * @returns {number} - Number of entries with analysis
     */
    getAnalysisCount() {
        const entries = this.getEntries();
        return entries.filter(entry => entry.hasAnalysis).length;
    }
    
    /**
     * Handle analysis completion
     * @param {string} logId - ID of log that was analyzed
     */
    handleAnalysisComplete(logId) {
        if (window.DebugStore) {
            DebugStore.debug('Handling analysis completion', { logId }, 'LOGMANAGER');
        }
        
        // Update view if modal is open
        if (window.UI?.elements?.logModal?.style.display === 'block') {
            // Emit UI refresh event instead of direct call
            if (window.EventBus) {
                EventBus.emit('ui:refresh', {
                    component: 'logModal',
                    reason: 'analysisComplete'
                });
            }
        }
        
        // Emit stats update event
        if (window.EventBus) {
            EventBus.emit('stats:updated', this.getUpdatedStats());
        }
    }
    
    /**
     * Handle analysis failure
     * @param {string} logId - ID of log that failed analysis
     * @param {Error} error - Analysis error
     */
    handleAnalysisFailed(logId, error) {
        if (window.DebugStore) {
            DebugStore.debug('Handling analysis failure', { logId, error: error.message }, 'LOGMANAGER');
        }
        
        // Update view if modal is open
        if (window.UI?.elements?.logModal?.style.display === 'block') {
            if (window.EventBus) {
                EventBus.emit('ui:refresh', {
                    component: 'logModal',
                    reason: 'analysisFailed'
                });
            }
        }
    }
    
    /**
     * Handle view change
     * @param {Object} detail - View change details
     */
    handleViewChange(detail) {
        if (window.DebugStore) {
            DebugStore.debug('Handling view change', detail, 'LOGMANAGER');
        }
        
        // Update view buttons and UI state
        this.updateViewButtonsForChange(detail.currentView);
    }
    
    /**
     * Handle filters changed
     */
    handleFiltersChanged() {
        if (window.DebugStore) {
            DebugStore.debug('Handling filters changed', {}, 'LOGMANAGER');
        }
        
        // Emit UI refresh for filtered view
        if (window.EventBus) {
            EventBus.emit('ui:refresh', {
                component: 'logEntries',
                reason: 'filtersChanged'
            });
        }
    }
    
    /**
     * Handle search performed
     */
    handleSearchPerformed() {
        if (window.DebugStore) {
            DebugStore.debug('Handling search performed', {}, 'LOGMANAGER');
        }
        
        // Emit UI refresh for search results
        if (window.EventBus) {
            EventBus.emit('ui:refresh', {
                component: 'logEntries', 
                reason: 'searchPerformed'
            });
        }
    }
    
    /**
     * Update view buttons for view change
     * @param {string} currentView - Current view type
     */
    updateViewButtonsForChange(currentView) {
        // This will be handled by UI event listeners instead of direct manipulation
        if (window.DebugStore) {
            DebugStore.debug('View buttons update needed', { currentView }, 'LOGMANAGER');
        }
    }
    
    /**
     * Export all data
     * @returns {Object} - Exported data
     */
    exportAllData() {
        return {
            rawLogs: this.logDataStore.exportData(),
            analyses: this.analysisDataStore.exportData(),
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };
    }
    
    /**
     * Import all data
     * @param {Object} data - Data to import
     * @returns {boolean} - Success status
     */
    importAllData(data) {
        try {
            if (data.rawLogs) {
                this.logDataStore.importData(data.rawLogs);
            }
            if (data.analyses) {
                this.analysisDataStore.importData(data.analyses);
            }
            
            this.updateStats();
            this.renderCurrentView();
            
            if (window.DebugStore) {
                DebugStore.success('Data import completed', {
                    hasRawLogs: !!data.rawLogs,
                    hasAnalyses: !!data.analyses
                }, 'LOGMANAGER');
            }
            
            return true;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Data import failed', {
                    error: error.message
                }, 'LOGMANAGER');
            }
            
            console.error('Failed to import data:', error);
            return false;
        }
    }
    
    /**
     * Get data store statistics
     * @returns {Object} - Statistics from both stores
     */
    getDataStoreStats() {
        return {
            rawLogs: this.logDataStore?.getStats() || {},
            analyses: this.analysisDataStore?.getStats() || {},
            analysisQueue: this.analysisCoordinator?.getQueueStatus() || {},
            viewManager: this.viewManager?.getState() || {}
        };
    }
    
    /**
     * Get manager state for debugging
     * @returns {Object} - Current manager state
     */
    getState() {
        return {
            entryCount: this.getEntryCount(),
            todayCount: this.getTodayCount(),
            currentView: this.getCurrentView(),
            hasActiveFilters: this.viewManager.hasActiveFilters(),
            activeFilters: this.viewManager.getActiveFilters(),
            dataStoreStats: this.getDataStoreStats()
        };
    }
}

// Export for use in other modules
window.LogManager = LogManager;