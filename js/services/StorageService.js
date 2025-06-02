// Storage Module for LocalStorage operations

const Storage = {
    // Keys for localStorage
    KEYS: {
        LOG_ENTRIES: 'dots_logs',
        HEALTH_ISSUES: 'dots_health_issues',
        HEALTH_CONTEXT: 'dots_health_context'
    },
    
    // Save log entries
    saveLogEntries(entries) {
        try {
            localStorage.setItem(this.KEYS.LOG_ENTRIES, JSON.stringify(entries));
            return true;
        } catch (e) {
            console.error('Failed to save log entries:', e);
            return false;
        }
    },
    
    // Load log entries
    loadLogEntries() {
        try {
            const data = localStorage.getItem(this.KEYS.LOG_ENTRIES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load log entries:', e);
            return [];
        }
    },
    
    // Save health issues
    saveHealthIssues(healthIssues) {
        try {
            localStorage.setItem(this.KEYS.HEALTH_ISSUES, JSON.stringify(healthIssues));
            return true;
        } catch (e) {
            console.error('Failed to save health issues:', e);
            return false;
        }
    },
    
    // Load health issues
    loadHealthIssues() {
        try {
            const data = localStorage.getItem(this.KEYS.HEALTH_ISSUES);
            return data ? JSON.parse(data) : { description: '', claudeAnalysis: '' };
        } catch (e) {
            console.error('Failed to load health issues:', e);
            return { description: '', claudeAnalysis: '' };
        }
    },
    
    // Save health context (comprehensive health profile)
    saveHealthContext(context) {
        try {
            localStorage.setItem(this.KEYS.HEALTH_CONTEXT, JSON.stringify(context));
            return true;
        } catch (e) {
            console.error('Failed to save health context:', e);
            return false;
        }
    },
    
    // Load health context
    loadHealthContext() {
        try {
            const saved = localStorage.getItem(this.KEYS.HEALTH_CONTEXT);
            return saved ? JSON.parse(saved) : {
                userDescription: '',
                claudeAnalysis: '',
                structuredData: {
                    conditions: [],
                    symptoms: [],
                    triggers: [],
                    trackingQuestions: [],
                    suggestedTags: []
                },
                lastUpdated: null
            };
        } catch (e) {
            console.error('Failed to load health context:', e);
            return {
                userDescription: '',
                claudeAnalysis: '',
                structuredData: {
                    conditions: [],
                    symptoms: [],
                    triggers: [],
                    trackingQuestions: [],
                    suggestedTags: []
                },
                lastUpdated: null
            };
        }
    },
    
    // Export data as JSON
    exportData() {
        const data = {
            logEntries: this.loadLogEntries(),
            healthIssues: this.loadHealthIssues(),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dots-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Import data from JSON
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.logEntries) {
                this.saveLogEntries(data.logEntries);
            }
            
            if (data.healthIssues) {
                this.saveHealthIssues(data.healthIssues);
            }
            
            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            throw new Error('Invalid data format');
        }
    },
    
    // Clear all data
    clearAllData() {
        try {
            localStorage.removeItem(this.KEYS.LOG_ENTRIES);
            localStorage.removeItem(this.KEYS.HEALTH_ISSUES);
            return true;
        } catch (e) {
            console.error('Failed to clear data:', e);
            return false;
        }
    }
};

// Export for use in other modules
window.Storage = Storage;