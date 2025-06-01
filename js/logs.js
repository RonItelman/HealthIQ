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
        const content = UI.elements.logText.value.trim();
        
        if (!content) {
            UI.showToast('Please enter some text to log');
            return;
        }
        
        try {
            // IMMEDIATE persistence to raw log store
            const logEntry = LogDataStore.createLogEntry(content);
            
            // Clear input immediately after successful save
            UI.elements.logText.value = '';
            
            // Update UI
            this.updateStats();
            
            // Show success
            UI.showToast('Entry logged successfully!');
            
            // Start analysis in background if health context exists
            if (window.HealthContext && window.HealthContext.hasContext() && !PWAManager.isOffline) {
                this.analyzeEntryInBackground(logEntry);
            }
            
            return logEntry;
            
        } catch (error) {
            console.error('Failed to create log entry:', error);
            UI.showToast('Failed to save entry. Please try again.');
            throw error;
        }
    },
    
    // Analyze entry in background with separate data stores
    async analyzeEntryInBackground(entry) {
        try {
            console.log('Starting background analysis for entry:', entry);
            
            // Mark analysis as in progress
            AnalysisDataStore.markAnalysisInProgress(entry.id);
            
            // Update UI if modal is open to show analysis started
            if (UI.elements.logModal.style.display === 'block') {
                this.renderCurrentView();
            }
            
            const analysis = await Health.analyzeLogEntry(entry);
            console.log('Analysis result:', analysis);
            
            if (analysis) {
                // Save analysis to separate store
                const prompt = API.createLogEntryPrompt(entry);
                const analysisData = {
                    ...analysis,
                    prompt: prompt
                };
                
                AnalysisDataStore.saveAnalysis(entry.id, analysisData);
                console.log('Analysis saved to AnalysisDataStore');
                
                // Update UI if modal is open
                if (UI.elements.logModal.style.display === 'block') {
                    this.renderCurrentView();
                }
            } else {
                console.log('No analysis returned from Health.analyzeLogEntry');
                AnalysisDataStore.markAnalysisFailed(entry.id, { message: 'No analysis returned' });
            }
        } catch (error) {
            console.error('Background analysis failed:', error);
            AnalysisDataStore.markAnalysisFailed(entry.id, error);
            
            // Update UI if modal is open to show failure
            if (UI.elements.logModal.style.display === 'block') {
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