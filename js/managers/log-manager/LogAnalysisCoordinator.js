// LogAnalysisCoordinator - Handles background analysis of log entries

class LogAnalysisCoordinator {
    constructor() {
        this.analysisQueue = [];
        this.isProcessing = false;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        
        if (window.DebugStore) {
            DebugStore.debug('LogAnalysisCoordinator initialized', {}, 'ANALYSIS_COORD');
        }
    }
    
    /**
     * Schedule analysis for a log entry
     * @param {LogEntry} logEntry - Log entry to analyze
     */
    scheduleAnalysis(logEntry) {
        if (!this.shouldAnalyze(logEntry)) {
            if (window.DebugStore) {
                DebugStore.info('Analysis skipped for log entry', {
                    logId: logEntry.id,
                    reason: this.getSkipReason(logEntry)
                }, 'ANALYSIS_COORD');
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.info('Scheduling analysis for log entry', {
                logId: logEntry.id,
                queueLength: this.analysisQueue.length
            }, 'ANALYSIS_COORD');
        }
        
        // Add to queue
        this.analysisQueue.push({
            logEntry: logEntry,
            attempts: 0,
            scheduledAt: new Date().toISOString()
        });
        
        // Emit scheduled event
        if (window.EventBus) {
            EventBus.emit('analysis:scheduled', {
                entryId: logEntry.id,
                queuePosition: this.analysisQueue.length,
                estimatedWait: this.analysisQueue.length * 2000 // rough estimate
            });
        }
        
        // Process queue if not already processing
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    
    /**
     * Process the analysis queue
     */
    async processQueue() {
        if (this.isProcessing || this.analysisQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        if (window.DebugStore) {
            DebugStore.info('Starting analysis queue processing', {
                queueLength: this.analysisQueue.length
            }, 'ANALYSIS_COORD');
        }
        
        while (this.analysisQueue.length > 0) {
            const item = this.analysisQueue.shift();
            
            try {
                await this.analyzeEntry(item);
            } catch (error) {
                if (window.DebugStore) {
                    DebugStore.error('Analysis queue item failed', {
                        logId: item.logEntry.id,
                        attempts: item.attempts,
                        error: error.message
                    }, 'ANALYSIS_COORD');
                }
                
                // Retry if under max attempts
                if (item.attempts < this.maxRetries) {
                    item.attempts++;
                    
                    if (window.DebugStore) {
                        DebugStore.info('Retrying analysis', {
                            logId: item.logEntry.id,
                            attempt: item.attempts,
                            maxRetries: this.maxRetries
                        }, 'ANALYSIS_COORD');
                    }
                    
                    // Add back to queue with delay
                    setTimeout(() => {
                        this.analysisQueue.push(item);
                        if (!this.isProcessing) {
                            this.processQueue();
                        }
                    }, this.retryDelay * item.attempts);
                } else {
                    // Mark as failed after max retries
                    this.markAnalysisFailed(item.logEntry.id, error);
                }
            }
            
            // Small delay between analyses to prevent overwhelming the API
            await this.delay(500);
        }
        
        this.isProcessing = false;
        
        if (window.DebugStore) {
            DebugStore.info('Analysis queue processing completed', {}, 'ANALYSIS_COORD');
        }
    }
    
    /**
     * Analyze a single log entry
     * @param {Object} queueItem - Queue item with logEntry and metadata
     */
    async analyzeEntry(queueItem) {
        const { logEntry } = queueItem;
        const timer = window.DebugStore ? DebugStore.startTimer('analyzeLogEntry') : null;
        
        if (window.DebugStore) {
            DebugStore.info('Starting analysis for log entry', {
                logId: logEntry.id,
                contentLength: logEntry.content.length,
                hasHealthContext: !!logEntry.healthContext
            }, 'ANALYSIS_COORD');
        }
        
        // Emit analysis started event
        if (window.EventBus) {
            EventBus.emit('analysis:started', {
                entryId: logEntry.id,
                attempt: queueItem.attempts + 1,
                startTime: new Date().toISOString()
            });
        }
        
        // Mark analysis as in progress
        this.markAnalysisInProgress(logEntry.id);
        
        try {
            // Get health analysis service
            const healthAnalysisService = this.getHealthAnalysisService();
            
            // Perform analysis
            const analysisResult = await healthAnalysisService.analyzeLogEntry(logEntry);
            
            if (!analysisResult) {
                throw new Error('No analysis result returned from service');
            }
            
            // Save successful analysis
            this.saveAnalysisResult(logEntry.id, analysisResult);
            
            const processingTime = timer ? timer.end() : null;
            
            // Emit analysis completed event
            if (window.EventBus) {
                EventBus.emit('analysis:completed', {
                    entryId: logEntry.id,
                    analysis: analysisResult,
                    processingTime: processingTime,
                    completedAt: new Date().toISOString()
                });
            }
            
            if (window.DebugStore) {
                DebugStore.success('Analysis completed successfully', {
                    logId: logEntry.id,
                    hasMessage: !!analysisResult.message,
                    tagCount: analysisResult.tags?.length || 0,
                    analysisTime: processingTime ? `${processingTime}ms` : 'unknown'
                }, 'ANALYSIS_COORD');
            }
            
        } catch (error) {
            const processingTime = timer ? timer.end() : null;
            
            // Emit analysis failed event
            if (window.EventBus) {
                EventBus.emit('analysis:failed', {
                    entryId: logEntry.id,
                    error: error,
                    attempt: queueItem.attempts + 1,
                    willRetry: queueItem.attempts < this.maxRetries
                });
            }
            
            if (window.DebugStore) {
                DebugStore.error('Analysis failed', {
                    logId: logEntry.id,
                    error: error.message,
                    analysisTime: processingTime ? `${processingTime}ms` : 'unknown'
                }, 'ANALYSIS_COORD');
            }
            
            throw error; // Re-throw for retry logic
        }
    }
    
    /**
     * Check if analysis should be performed for this entry
     * @param {LogEntry} logEntry - Log entry to check
     * @returns {boolean} - True if should analyze
     */
    shouldAnalyze(logEntry) {
        // Check if health context exists
        if (!window.HealthContext || !window.HealthContext.hasContext()) {
            return false;
        }
        
        // Check if online
        if (window.PWAManager && window.PWAManager.isOffline) {
            return false;
        }
        
        // Check if content is substantial enough
        if (!logEntry.content || logEntry.content.trim().length < 10) {
            return false;
        }
        
        // Check if analysis already exists
        if (window.AnalysisDataStore && window.AnalysisDataStore.getAnalysis(logEntry.id)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get reason why analysis was skipped
     * @param {LogEntry} logEntry - Log entry
     * @returns {string} - Skip reason
     */
    getSkipReason(logEntry) {
        if (!window.HealthContext || !window.HealthContext.hasContext()) {
            return 'No health context';
        }
        
        if (window.PWAManager && window.PWAManager.isOffline) {
            return 'Offline';
        }
        
        if (!logEntry.content || logEntry.content.trim().length < 10) {
            return 'Content too short';
        }
        
        if (window.AnalysisDataStore && window.AnalysisDataStore.getAnalysis(logEntry.id)) {
            return 'Analysis already exists';
        }
        
        return 'Unknown';
    }
    
    /**
     * Mark analysis as in progress
     * @param {string} logId - Log entry ID
     */
    markAnalysisInProgress(logId) {
        if (window.AnalysisDataStore) {
            window.AnalysisDataStore.markAnalysisInProgress(logId);
        }
    }
    
    /**
     * Mark analysis as failed
     * @param {string} logId - Log entry ID
     * @param {Error} error - Error that occurred
     */
    markAnalysisFailed(logId, error) {
        if (window.AnalysisDataStore) {
            window.AnalysisDataStore.markAnalysisFailed(logId, error);
        }
    }
    
    /**
     * Save analysis result
     * @param {string} logId - Log entry ID
     * @param {Object} analysisData - Analysis data from service
     */
    saveAnalysisResult(logId, analysisData) {
        if (window.AnalysisDataStore) {
            // Create proper AnalysisResult object
            const analysisResult = new AnalysisResult(logId, analysisData);
            analysisResult.complete();
            
            window.AnalysisDataStore.saveAnalysis(logId, analysisResult.toJSON());
        }
    }
    
    /**
     * Get health analysis service
     * @returns {Object} - Health analysis service
     */
    getHealthAnalysisService() {
        if (window.Health && window.Health.analyzeLogEntry) {
            return {
                analyzeLogEntry: window.Health.analyzeLogEntry.bind(window.Health)
            };
        }
        
        throw new Error('Health analysis service not available');
    }
    
    /**
     * Notify that analysis is complete (for UI updates)
     * @param {string} logId - Log entry ID
     */
    notifyAnalysisComplete(logId) {
        // Update UI if log modal is open
        if (window.UI && window.UI.elements && window.UI.elements.logModal) {
            if (window.UI.elements.logModal.style.display === 'block') {
                // Trigger UI refresh
                if (window.LogManager && window.LogManager.renderCurrentView) {
                    window.LogManager.renderCurrentView();
                }
            }
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('analysisComplete', {
            detail: { logId: logId }
        }));
    }
    
    /**
     * Get queue status
     * @returns {Object} - Queue status information
     */
    getQueueStatus() {
        return {
            isProcessing: this.isProcessing,
            queueLength: this.analysisQueue.length,
            pendingItems: this.analysisQueue.map(item => ({
                logId: item.logEntry.id,
                attempts: item.attempts,
                scheduledAt: item.scheduledAt
            }))
        };
    }
    
    /**
     * Clear the analysis queue
     */
    clearQueue() {
        this.analysisQueue = [];
        this.isProcessing = false;
        
        if (window.DebugStore) {
            DebugStore.info('Analysis queue cleared', {}, 'ANALYSIS_COORD');
        }
    }
    
    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
window.LogAnalysisCoordinator = LogAnalysisCoordinator;