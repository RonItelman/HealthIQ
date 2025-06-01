// Log Manager Module - Handles all log entry operations with secure data stores

const LogManager = {
    // State
    currentView: 'entries', // 'entries', 'markdown', 'summary'
    
    // Initialize log manager
    init() {
        // New data stores are already loaded via their constructors
        this.updateStats();
        console.log('LogManager initialized with new data stores');
    },
    
    // Get all entries (combined raw logs with analysis)
    getEntries() {
        const rawLogs = LogDataStore.getAllLogEntries();
        
        // Combine with analysis data
        return rawLogs.map(log => {
            const analysis = AnalysisDataStore.getAnalysis(log.id);
            
            return {
                // Raw log data
                id: log.id,
                timestamp: log.timestamp,
                content: log.content,
                
                // Analysis data (if available)
                hasAnalysis: !!analysis,
                analysisStatus: analysis?.status || 'none',
                claudeAnalysis: analysis?.message || '',
                tags: analysis?.tags || [],
                observations: analysis?.observations || [],
                questions: analysis?.questions || [],
                potentialPathways: analysis?.potentialPathways || [],
                
                // Combined for backward compatibility
                analysis: analysis ? {
                    claudeAnalysis: analysis.message,
                    tags: analysis.tags
                } : null
            };
        });
    },
    
    // Create new log entry - SECURE IMMEDIATE PERSISTENCE
    async createEntry() {
        const timer = window.DebugStore ? DebugStore.startTimer('createLogEntry') : null;
        const content = UI.elements.logText.value.trim();
        
        if (window.DebugStore) {
            DebugStore.info('User attempting to create log entry', {
                contentLength: content.length,
                hasHealthContext: !!(window.HealthContext && window.HealthContext.hasContext()),
                isOnline: !PWAManager.isOffline
            }, 'LOGMANAGER');
        }
        
        if (!content) {
            if (window.DebugStore) {
                DebugStore.warn('Log entry creation failed - empty content', {}, 'LOGMANAGER');
            }
            UI.showToast('Please enter some text to log');
            return;
        }
        
        try {
            if (window.DebugStore) {
                DebugStore.info('Creating log entry via LogDataStore', {
                    content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                    contentLength: content.length
                }, 'LOGMANAGER');
            }
            
            // IMMEDIATE persistence to raw log store
            const logEntry = LogDataStore.createLogEntry(content);
            
            if (window.DebugStore) {
                DebugStore.success('Log entry created successfully', {
                    logId: logEntry.id,
                    timestamp: logEntry.timestamp,
                    dataStoreStats: LogDataStore.getStats()
                }, 'LOGMANAGER');
            }
            
            // Clear input immediately after successful save
            UI.elements.logText.value = '';
            
            // Update UI
            this.updateStats();
            
            // Show success
            UI.showToast('Entry logged successfully!');
            
            // Start analysis in background if health context exists
            if (window.HealthContext && window.HealthContext.hasContext() && !PWAManager.isOffline) {
                if (window.DebugStore) {
                    DebugStore.info('Starting background analysis', {
                        logId: logEntry.id,
                        hasHealthContext: true,
                        isOnline: true
                    }, 'LOGMANAGER');
                }
                this.analyzeEntryInBackground(logEntry);
            } else {
                if (window.DebugStore) {
                    DebugStore.info('Skipping analysis', {
                        logId: logEntry.id,
                        hasHealthContext: !!(window.HealthContext && window.HealthContext.hasContext()),
                        isOnline: !PWAManager.isOffline,
                        reason: !window.HealthContext ? 'No HealthContext' : 
                               !window.HealthContext.hasContext() ? 'No health context set' :
                               PWAManager.isOffline ? 'Offline' : 'Unknown'
                    }, 'LOGMANAGER');
                }
            }
            
            timer?.end();
            return logEntry;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to create log entry', {
                    error: error.message,
                    content: content.substring(0, 50),
                    stack: error.stack
                }, 'LOGMANAGER');
            }
            
            console.error('Failed to create log entry:', error);
            UI.showToast('Failed to save entry. Please try again.');
            throw error;
        }
    },
    
    // Analyze entry in background with separate data stores
    async analyzeEntryInBackground(entry) {
        const timer = window.DebugStore ? DebugStore.startTimer('analyzeEntryInBackground') : null;
        
        if (window.DebugStore) {
            DebugStore.info('Starting background analysis for log entry', {
                logId: entry.id,
                contentLength: entry.content.length,
                timestamp: entry.timestamp,
                hasHealthContext: !!(window.HealthContext && window.HealthContext.hasContext()),
                isModalOpen: UI.elements.logModal.style.display === 'block'
            }, 'LOGMANAGER');
        }
        
        try {
            console.log('Starting background analysis for entry:', entry);
            
            // Mark analysis as in progress
            if (window.DebugStore) {
                DebugStore.info('Marking analysis as in progress', {
                    logId: entry.id
                }, 'LOGMANAGER');
            }
            
            AnalysisDataStore.markAnalysisInProgress(entry.id);
            
            // Update UI if modal is open to show analysis started
            if (UI.elements.logModal.style.display === 'block') {
                if (window.DebugStore) {
                    DebugStore.debug('Updating UI to show analysis started', {
                        logId: entry.id
                    }, 'LOGMANAGER');
                }
                this.renderCurrentView();
            }
            
            if (window.DebugStore) {
                DebugStore.info('Calling Health.analyzeLogEntry', {
                    logId: entry.id,
                    healthModuleAvailable: !!window.Health
                }, 'LOGMANAGER');
            }
            
            const analysisTimer = window.DebugStore ? DebugStore.startTimer('healthAnalyzeLogEntry') : null;
            const analysis = await Health.analyzeLogEntry(entry);
            analysisTimer?.end();
            
            console.log('Analysis result:', analysis);
            
            if (window.DebugStore) {
                DebugStore.info('Analysis completed', {
                    logId: entry.id,
                    hasResult: !!analysis,
                    analysisKeys: analysis ? Object.keys(analysis) : null,
                    analysisTime: analysisTimer ? `${analysisTimer.end()}ms` : 'unknown'
                }, 'LOGMANAGER');
            }
            
            if (analysis) {
                // Save analysis to separate store
                if (window.DebugStore) {
                    DebugStore.info('Creating prompt and saving analysis', {
                        logId: entry.id,
                        analysisHasMessage: !!analysis.message,
                        analysisHasTags: !!(analysis.tags && analysis.tags.length > 0)
                    }, 'LOGMANAGER');
                }
                
                const prompt = API.createLogEntryPrompt(entry);
                const analysisData = {
                    ...analysis,
                    prompt: prompt
                };
                
                AnalysisDataStore.saveAnalysis(entry.id, analysisData);
                console.log('Analysis saved to AnalysisDataStore');
                
                if (window.DebugStore) {
                    DebugStore.success('Analysis saved successfully', {
                        logId: entry.id,
                        analysisStoreStats: AnalysisDataStore.getStats()
                    }, 'LOGMANAGER');
                }
                
                // Update UI if modal is open
                if (UI.elements.logModal.style.display === 'block') {
                    if (window.DebugStore) {
                        DebugStore.debug('Updating UI to show completed analysis', {
                            logId: entry.id
                        }, 'LOGMANAGER');
                    }
                    this.renderCurrentView();
                }
            } else {
                console.log('No analysis returned from Health.analyzeLogEntry');
                
                if (window.DebugStore) {
                    DebugStore.warn('No analysis returned from Health module', {
                        logId: entry.id,
                        healthModuleAvailable: !!window.Health,
                        analyzeLogEntryExists: !!(window.Health && window.Health.analyzeLogEntry)
                    }, 'LOGMANAGER');
                }
                
                AnalysisDataStore.markAnalysisFailed(entry.id, { message: 'No analysis returned' });
            }
            
            timer?.end();
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Background analysis failed', {
                    logId: entry.id,
                    error: error.message,
                    stack: error.stack,
                    analysisTime: timer ? `${timer.end()}ms` : 'unknown'
                }, 'LOGMANAGER');
            }
            
            console.error('Background analysis failed:', error);
            AnalysisDataStore.markAnalysisFailed(entry.id, error);
            
            // Update UI if modal is open to show failure
            if (UI.elements.logModal.style.display === 'block') {
                if (window.DebugStore) {
                    DebugStore.debug('Updating UI to show analysis failure', {
                        logId: entry.id
                    }, 'LOGMANAGER');
                }
                this.renderCurrentView();
            }
        }
    },
    
    // Update statistics
    updateStats() {
        const entries = this.getEntries(); // Get combined entries
        UI.updateStats(entries);
    },
    
    // Show log modal
    showLogModal() {
        UI.elements.logModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Render based on current view
        this.renderCurrentView();
        
        // Celebrate if entries exist
        const entries = this.getEntries();
        if (entries.length > 0) {
            UI.celebrateViewButton();
        }
    },
    
    // Close log modal
    closeLogModal() {
        UI.elements.logModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    },
    
    // Toggle between views
    toggleView(viewType) {
        if (this.currentView === viewType) {
            this.currentView = 'entries';
        } else {
            this.currentView = viewType;
        }
        
        this.renderCurrentView();
        
        // Update button icon based on view type
        if (viewType === 'markdown') {
            this.updateViewButton('viewMarkdownBtn', 'list', 'description', '≡', 'Σ');
        } else if (viewType === 'summary') {
            this.updateViewButton('summaryBtn', 'list', 'analytics', '≡', '☯');
        }
    },
    
    // Update view button appearance
    updateViewButton(btnId, activeIcon, inactiveIcon, activeText, inactiveText) {
        const btn = document.getElementById(btnId);
        btn.innerHTML = '<span class="material-symbols-outlined">check</span><span class="icon-text">✓</span>';
        
        setTimeout(() => {
            if (this.currentView === btnId.replace('Btn', '').replace('viewMarkdown', 'markdown')) {
                btn.innerHTML = `<span class="material-symbols-outlined">${activeIcon}</span><span class="icon-text">${activeText}</span>`;
            } else {
                btn.innerHTML = `<span class="material-symbols-outlined">${inactiveIcon}</span><span class="icon-text">${inactiveText}</span>`;
            }
        }, 2000);
    },
    
    // Render current view
    renderCurrentView() {
        const entries = this.getEntries(); // Get combined entries
        
        switch (this.currentView) {
            case 'markdown':
                UI.renderMarkdown(entries);
                break;
            case 'summary':
                UI.renderSummary(entries);
                break;
            default:
                UI.renderLogEntries(entries);
        }
    },
    
    // Get today's entries count
    getTodayCount() {
        const today = new Date().toDateString();
        const entries = this.getEntries();
        return entries.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        ).length;
    },
    
    // Delete entry (both raw log and analysis)
    deleteEntry(id) {
        LogDataStore.deleteLogEntry(id);
        AnalysisDataStore.deleteAnalysis(id);
        this.updateStats();
        this.renderCurrentView();
    },
    
    // Search entries (for future use)
    searchEntries(searchTerm) {
        const entries = this.getEntries();
        return entries.filter(entry => 
            entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.claudeAnalysis && entry.claudeAnalysis.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    },
    
    // Clear all log entries (both stores)
    clearAllEntries() {
        LogDataStore.clearAllData();
        AnalysisDataStore.clearAllData();
        this.updateStats();
        this.renderCurrentView();
    },
    
    // Get data store statistics
    getDataStoreStats() {
        return {
            rawLogs: LogDataStore.getStats(),
            analyses: AnalysisDataStore.getStats()
        };
    },
    
    // Export all data for backup
    exportAllData() {
        return {
            rawLogs: LogDataStore.exportData(),
            analyses: AnalysisDataStore.exportData(),
            exportedAt: new Date().toISOString()
        };
    },
    
    // Import all data from backup
    importAllData(data) {
        try {
            if (data.rawLogs) {
                LogDataStore.importData(data.rawLogs);
            }
            if (data.analyses) {
                AnalysisDataStore.importData(data.analyses);
            }
            this.updateStats();
            this.renderCurrentView();
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
};

// Export for use in other modules
window.LogManager = LogManager;