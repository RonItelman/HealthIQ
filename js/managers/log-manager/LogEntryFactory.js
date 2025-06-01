// LogEntryFactory - Creates and validates new log entries

class LogEntryFactory {
    constructor() {
        this.healthContext = window.HealthContext;
        
        if (window.DebugStore) {
            DebugStore.debug('LogEntryFactory initialized', {}, 'LOGFACTORY');
        }
    }
    
    /**
     * Create a new log entry from user input
     * @param {string} content - User input content
     * @returns {LogEntry} - Created log entry
     */
    create(content) {
        const timer = window.DebugStore ? DebugStore.startTimer('createLogEntry') : null;
        
        if (window.DebugStore) {
            DebugStore.info('Creating log entry', {
                contentLength: content ? content.length : 0,
                hasHealthContext: this.hasHealthContext()
            }, 'LOGFACTORY');
        }
        
        try {
            // Create base log entry
            const logEntry = new LogEntry(content);
            
            // Add health context if available
            if (this.hasHealthContext()) {
                logEntry.healthContext = this.getHealthContextText();
                
                if (window.DebugStore) {
                    DebugStore.debug('Added health context to log entry', {
                        logId: logEntry.id,
                        contextLength: logEntry.healthContext.length
                    }, 'LOGFACTORY');
                }
            }
            
            // Add metadata
            this.addMetadata(logEntry);
            
            timer?.end();
            
            if (window.DebugStore) {
                DebugStore.success('Log entry created successfully', {
                    logId: logEntry.id,
                    contentLength: logEntry.content.length,
                    hasContext: !!logEntry.healthContext
                }, 'LOGFACTORY');
            }
            
            return logEntry;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to create log entry', {
                    error: error.message,
                    contentPreview: content ? content.substring(0, 50) : 'null'
                }, 'LOGFACTORY');
            }
            throw error;
        }
    }
    
    /**
     * Create log entry from imported data
     * @param {Object} data - Imported log data
     * @returns {LogEntry} - Created log entry
     */
    createFromImport(data) {
        if (window.DebugStore) {
            DebugStore.info('Creating log entry from import', {
                hasId: !!data.id,
                hasContent: !!data.content,
                hasTimestamp: !!data.timestamp
            }, 'LOGFACTORY');
        }
        
        try {
            const logEntry = LogEntry.fromJSON(data);
            
            if (window.DebugStore) {
                DebugStore.success('Log entry created from import', {
                    logId: logEntry.id,
                    originalTimestamp: data.timestamp
                }, 'LOGFACTORY');
            }
            
            return logEntry;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to create log entry from import', {
                    error: error.message,
                    dataKeys: Object.keys(data || {})
                }, 'LOGFACTORY');
            }
            throw error;
        }
    }
    
    /**
     * Create multiple log entries from batch import
     * @param {Array} dataArray - Array of log data objects
     * @returns {Array} - Array of created log entries
     */
    createBatch(dataArray) {
        if (!Array.isArray(dataArray)) {
            throw new Error('Batch data must be an array');
        }
        
        if (window.DebugStore) {
            DebugStore.info('Creating log entries from batch', {
                count: dataArray.length
            }, 'LOGFACTORY');
        }
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < dataArray.length; i++) {
            try {
                const entry = this.createFromImport(dataArray[i]);
                results.push(entry);
            } catch (error) {
                errors.push({ index: i, error: error.message });
                
                if (window.DebugStore) {
                    DebugStore.warn('Failed to create entry in batch', {
                        index: i,
                        error: error.message
                    }, 'LOGFACTORY');
                }
            }
        }
        
        if (window.DebugStore) {
            DebugStore.info('Batch creation completed', {
                successful: results.length,
                errors: errors.length,
                total: dataArray.length
            }, 'LOGFACTORY');
        }
        
        if (errors.length > 0 && results.length === 0) {
            throw new Error(`All entries failed to import. First error: ${errors[0].error}`);
        }
        
        return results;
    }
    
    /**
     * Check if health context is available
     * @returns {boolean} - True if health context exists
     */
    hasHealthContext() {
        return !!(this.healthContext && this.healthContext.hasContext());
    }
    
    /**
     * Get health context text for log entry
     * @returns {string} - Health context description
     */
    getHealthContextText() {
        if (!this.hasHealthContext()) return '';
        
        try {
            return this.healthContext.getDescription() || '';
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.warn('Failed to get health context text', {
                    error: error.message
                }, 'LOGFACTORY');
            }
            return '';
        }
    }
    
    /**
     * Add metadata to log entry
     * @param {LogEntry} logEntry - Log entry to enhance
     */
    addMetadata(logEntry) {
        // Add application state metadata
        logEntry.metadata = {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            isOnline: !window.PWAManager?.isOffline,
            wordCount: logEntry.getWordCount(),
            charCount: logEntry.getCharacterCount()
        };
        
        // Add health context metadata if available
        if (this.hasHealthContext()) {
            logEntry.metadata.hasHealthContext = true;
            logEntry.metadata.healthContextLength = this.getHealthContextText().length;
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Added metadata to log entry', {
                logId: logEntry.id,
                metadataKeys: Object.keys(logEntry.metadata)
            }, 'LOGFACTORY');
        }
    }
    
    /**
     * Validate content before creating entry
     * @param {string} content - Content to validate
     * @returns {Object} - Validation result
     */
    validateContent(content) {
        return ValidationHelper.validateLogContent(content);
    }
    
    /**
     * Get suggested tags based on content
     * @param {string} content - Content to analyze
     * @returns {Array} - Suggested tags
     */
    getSuggestedTags(content) {
        if (!content) return [];
        
        const suggestions = [];
        const lowerContent = content.toLowerCase();
        
        // Health-related keywords
        const healthKeywords = {
            'sleep': ['sleep', 'tired', 'fatigue', 'rest', 'insomnia'],
            'food': ['food', 'eat', 'meal', 'hungry', 'diet'],
            'exercise': ['exercise', 'workout', 'gym', 'run', 'walk'],
            'mood': ['mood', 'happy', 'sad', 'angry', 'anxious', 'stress'],
            'pain': ['pain', 'hurt', 'ache', 'sore', 'headache'],
            'energy': ['energy', 'energetic', 'sluggish', 'motivated'],
            'social': ['friends', 'family', 'social', 'people', 'alone']
        };
        
        for (const [tag, keywords] of Object.entries(healthKeywords)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                suggestions.push(tag);
            }
        }
        
        return suggestions;
    }
    
    /**
     * Create entry with suggested enhancements
     * @param {string} content - User content
     * @returns {LogEntry} - Enhanced log entry
     */
    createEnhanced(content) {
        const logEntry = this.create(content);
        
        // Add suggested tags
        logEntry.suggestedTags = this.getSuggestedTags(content);
        
        // Add analysis readiness flag
        logEntry.readyForAnalysis = this.hasHealthContext() && !window.PWAManager?.isOffline;
        
        if (window.DebugStore) {
            DebugStore.debug('Created enhanced log entry', {
                logId: logEntry.id,
                suggestedTagCount: logEntry.suggestedTags.length,
                readyForAnalysis: logEntry.readyForAnalysis
            }, 'LOGFACTORY');
        }
        
        return logEntry;
    }
}

// Export for use in other modules
window.LogEntryFactory = LogEntryFactory;