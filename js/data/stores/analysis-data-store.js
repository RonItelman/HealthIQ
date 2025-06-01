// Analysis Data Store - Secure persistence for AI analysis results

class AnalysisDataStore {
    constructor() {
        this.STORAGE_KEY = 'dots_analysis_v1';
        this.analyses = new Map(); // logId -> analysis data
        this.loadFromStorage();
    }

    // Save AI analysis for a log entry
    saveAnalysis(logId, analysisData) {
        if (!logId || !analysisData) {
            console.error('Invalid parameters for saveAnalysis');
            return false;
        }

        const analysis = {
            logId: logId,
            timestamp: new Date().toISOString(),
            status: 'completed',
            
            // Claude's response data
            rawResponse: analysisData.claudeAnalysis || '',
            message: analysisData.parsedResponse?.message || '',
            tags: analysisData.parsedResponse?.tags || [],
            observations: analysisData.parsedResponse?.observations || [],
            questions: analysisData.parsedResponse?.questions || [],
            potentialPathways: analysisData.parsedResponse?.potential_pathways || [],
            
            // Metadata
            model: 'claude-3-sonnet-20240229',
            prompt: analysisData.prompt || '',
            version: 1
        };

        this.analyses.set(logId, analysis);
        this.saveToStorage();
        
        console.log(`Analysis saved for log ID: ${logId}`);
        return true;
    }

    // Mark analysis as in progress
    markAnalysisInProgress(logId) {
        const analysis = {
            logId: logId,
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            rawResponse: '',
            message: '',
            tags: [],
            observations: [],
            questions: [],
            potentialPathways: [],
            model: 'claude-3-sonnet-20240229',
            prompt: '',
            version: 1
        };

        this.analyses.set(logId, analysis);
        this.saveToStorage();
        
        console.log(`Analysis marked in progress for log ID: ${logId}`);
        return true;
    }

    // Mark analysis as failed
    markAnalysisFailed(logId, error) {
        const existing = this.analyses.get(logId) || {};
        
        const analysis = {
            ...existing,
            logId: logId,
            timestamp: new Date().toISOString(),
            status: 'failed',
            error: error?.message || 'Unknown error',
            version: 1
        };

        this.analyses.set(logId, analysis);
        this.saveToStorage();
        
        console.log(`Analysis marked failed for log ID: ${logId}`, error);
        return true;
    }

    // Get analysis for a log entry
    getAnalysis(logId) {
        return this.analyses.get(logId) || null;
    }

    // Get all analyses
    getAllAnalyses() {
        return Array.from(this.analyses.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Get analyses by status
    getAnalysesByStatus(status) {
        return Array.from(this.analyses.values())
            .filter(analysis => analysis.status === status)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Check if analysis exists for log
    hasAnalysis(logId) {
        return this.analyses.has(logId);
    }

    // Check if analysis is in progress
    isAnalysisInProgress(logId) {
        const analysis = this.analyses.get(logId);
        return analysis && analysis.status === 'in_progress';
    }

    // Check if analysis is completed
    isAnalysisCompleted(logId) {
        const analysis = this.analyses.get(logId);
        return analysis && analysis.status === 'completed';
    }

    // Delete analysis
    deleteAnalysis(logId) {
        const deleted = this.analyses.delete(logId);
        if (deleted) {
            this.saveToStorage();
            console.log(`Analysis deleted for log ID: ${logId}`);
        }
        return deleted;
    }

    // Get failed analyses for retry
    getFailedAnalyses() {
        return this.getAnalysesByStatus('failed');
    }

    // Get in-progress analyses (for cleanup)
    getInProgressAnalyses() {
        return this.getAnalysesByStatus('in_progress');
    }

    // Cleanup stale in-progress analyses (older than 5 minutes)
    cleanupStaleAnalyses() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        let cleaned = 0;

        this.analyses.forEach((analysis, logId) => {
            if (analysis.status === 'in_progress' && 
                new Date(analysis.timestamp) < fiveMinutesAgo) {
                this.markAnalysisFailed(logId, { message: 'Analysis timed out' });
                cleaned++;
            }
        });

        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} stale analyses`);
        }

        return cleaned;
    }

    // Get statistics
    getStats() {
        const analyses = Array.from(this.analyses.values());
        const statusCounts = analyses.reduce((acc, analysis) => {
            acc[analysis.status] = (acc[analysis.status] || 0) + 1;
            return acc;
        }, {});

        return {
            totalAnalyses: analyses.length,
            completed: statusCounts.completed || 0,
            inProgress: statusCounts.in_progress || 0,
            failed: statusCounts.failed || 0,
            avgTagsPerAnalysis: analyses.length > 0 ? 
                analyses.reduce((acc, a) => acc + (a.tags?.length || 0), 0) / analyses.length : 0
        };
    }

    // Save to localStorage with error handling
    saveToStorage() {
        try {
            const data = {
                analyses: Array.from(this.analyses.entries()),
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log(`Analyses saved: ${this.analyses.size} entries`);
        } catch (error) {
            console.error('Failed to save analyses to storage:', error);
            // Try to free up space and retry
            this.cleanupOldData();
            try {
                const data = {
                    analyses: Array.from(this.analyses.entries()),
                    lastSaved: new Date().toISOString()
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
                console.log('Analyses saved after cleanup');
            } catch (retryError) {
                console.error('Critical: Unable to save analyses even after cleanup:', retryError);
                throw new Error('Storage failure - analyses not saved');
            }
        }
    }

    // Load from localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                
                // Restore analyses Map
                this.analyses = new Map(parsed.analyses || []);
                
                console.log(`Analyses loaded: ${this.analyses.size} entries`);
                
                // Cleanup any stale in-progress analyses on load
                this.cleanupStaleAnalyses();
            } else {
                console.log('No existing analyses found, starting fresh');
            }
        } catch (error) {
            console.error('Failed to load analyses from storage:', error);
            // Don't throw - start fresh if corrupted
            this.analyses = new Map();
        }
    }

    // Clean up old data if storage is full
    cleanupOldData() {
        try {
            // Remove old versions
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.includes('analysis') && !key.includes('_v1')) {
                    localStorage.removeItem(key);
                    console.log(`Cleaned up old analysis key: ${key}`);
                }
            });
        } catch (error) {
            console.error('Failed to cleanup old analysis data:', error);
        }
    }

    // Export data for backup
    exportData() {
        return {
            analyses: Array.from(this.analyses.entries()),
            exportedAt: new Date().toISOString(),
            version: 1
        };
    }

    // Import data from backup
    importData(data) {
        try {
            this.analyses = new Map(data.analyses || []);
            this.saveToStorage();
            console.log(`Imported ${this.analyses.size} analyses`);
            return true;
        } catch (error) {
            console.error('Failed to import analysis data:', error);
            return false;
        }
    }

    // Clear all data (dangerous!)
    clearAllData() {
        this.analyses.clear();
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('All analysis data cleared');
    }

    // Check data integrity
    checkIntegrity() {
        const issues = [];
        
        // Check for invalid data
        Array.from(this.analyses.values()).forEach(analysis => {
            if (!analysis.logId) {
                issues.push('Analysis missing logId');
            }
            if (!analysis.timestamp || isNaN(new Date(analysis.timestamp))) {
                issues.push(`Invalid timestamp in analysis for log ${analysis.logId}`);
            }
            if (!['completed', 'in_progress', 'failed'].includes(analysis.status)) {
                issues.push(`Invalid status in analysis for log ${analysis.logId}: ${analysis.status}`);
            }
        });

        return {
            isValid: issues.length === 0,
            issues: issues,
            checkedAt: new Date().toISOString()
        };
    }

    // Retry failed analysis
    retryFailedAnalysis(logId) {
        const analysis = this.analyses.get(logId);
        if (analysis && analysis.status === 'failed') {
            this.markAnalysisInProgress(logId);
            return true;
        }
        return false;
    }
}

// Create singleton instance
const analysisDataStore = new AnalysisDataStore();

// Export for use in other modules
window.AnalysisDataStore = analysisDataStore;