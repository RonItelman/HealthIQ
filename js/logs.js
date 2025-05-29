// Log Manager Module - Handles all log entry operations

const LogManager = {
    // State
    logEntries: [],
    currentView: 'entries', // 'entries', 'markdown', 'summary'
    
    // Initialize log manager
    init() {
        this.loadEntries();
        this.updateStats();
    },
    
    // Load entries from storage
    loadEntries() {
        this.logEntries = Storage.loadLogEntries();
    },
    
    // Save entries to storage
    saveEntries() {
        Storage.saveLogEntries(this.logEntries);
    },
    
    // Get all entries
    getEntries() {
        return this.logEntries;
    },
    
    // Create new log entry
    async createEntry() {
        const content = UI.elements.logText.value.trim();
        
        if (!content) {
            UI.showToast('Please enter some text to log');
            return;
        }
        
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: content,
            analysis: null
        };
        
        // Add to beginning of array
        this.logEntries.unshift(entry);
        
        // Save immediately
        this.saveEntries();
        
        // Clear input
        UI.elements.logText.value = '';
        
        // Update UI
        this.updateStats();
        
        // Show success
        UI.showToast('Entry logged successfully!');
        
        // Analyze if health issues are set and online
        if (Health.healthIssues.claudeAnalysis && !PWAManager.isOffline) {
            this.analyzeEntryInBackground(entry);
        }
    },
    
    // Analyze entry in background
    async analyzeEntryInBackground(entry) {
        try {
            const analysis = await Health.analyzeLogEntry(entry);
            if (analysis) {
                // Update the entry
                const entryIndex = this.logEntries.findIndex(e => e.id === entry.id);
                if (entryIndex !== -1) {
                    this.logEntries[entryIndex].analysis = analysis;
                    this.saveEntries();
                }
            }
        } catch (error) {
            console.error('Background analysis failed:', error);
        }
    },
    
    // Update statistics
    updateStats() {
        UI.updateStats(this.logEntries);
    },
    
    // Show log modal
    showLogModal() {
        UI.elements.logModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Render based on current view
        this.renderCurrentView();
        
        // Celebrate if entries exist
        if (this.logEntries.length > 0) {
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
        switch (this.currentView) {
            case 'markdown':
                UI.renderMarkdown(this.logEntries);
                break;
            case 'summary':
                UI.renderSummary(this.logEntries);
                break;
            default:
                UI.renderLogEntries(this.logEntries, Health.healthIssues);
        }
    },
    
    // Get today's entries count
    getTodayCount() {
        const today = new Date().toDateString();
        return this.logEntries.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        ).length;
    },
    
    // Delete entry (for future use)
    deleteEntry(id) {
        this.logEntries = this.logEntries.filter(e => e.id !== id);
        this.saveEntries();
        this.updateStats();
    },
    
    // Search entries (for future use)
    searchEntries(searchTerm) {
        return this.logEntries.filter(entry => 
            entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.analysis && entry.analysis.claudeAnalysis.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
};

// Export for use in other modules
window.LogManager = LogManager;