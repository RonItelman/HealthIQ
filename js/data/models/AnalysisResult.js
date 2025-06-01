// AnalysisResult Model - Represents AI analysis results with validation and formatting

class AnalysisResult {
    constructor(logId, analysisData) {
        this.logId = logId;
        this.id = this.generateId();
        this.timestamp = new Date().toISOString();
        this.status = 'completed';
        
        // Validate and set analysis data
        this.validateAndSetData(analysisData);
        
        // Metadata
        this.version = '2.0';
        this.source = 'claude-api';
        this.processingTime = null;
        
        if (window.DebugStore) {
            DebugStore.debug('AnalysisResult created', {
                id: this.id,
                logId: this.logId,
                hasMessage: !!this.message,
                tagCount: this.tags?.length || 0
            }, 'ANALYSIS');
        }
    }
    
    /**
     * Generate unique ID for analysis result
     * @returns {string} - Unique ID
     */
    generateId() {
        return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Validate and set analysis data
     * @param {Object} data - Analysis data from API
     */
    validateAndSetData(data) {
        const validation = ValidationHelper.validateAnalysisResult(data);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }
        
        // Required fields
        this.message = data.message || '';
        
        // Optional arrays
        this.tags = Array.isArray(data.tags) ? data.tags : [];
        this.observations = Array.isArray(data.observations) ? data.observations : [];
        this.questions = Array.isArray(data.questions) ? data.questions : [];
        this.potentialPathways = Array.isArray(data.potentialPathways) ? data.potentialPathways : [];
        
        // Optional metadata
        this.confidence = data.confidence || null;
        this.prompt = data.prompt || null;
        this.modelUsed = data.model || 'claude-3-sonnet';
    }
    
    /**
     * Get formatted analysis message for display
     * @returns {string} - Formatted message
     */
    getFormattedMessage() {
        return TextProcessor.formatDisplay(this.message);
    }
    
    /**
     * Get formatted timestamp
     * @returns {string} - Formatted timestamp
     */
    getFormattedTimestamp() {
        return DateFormatter.formatLogTimestamp(this.timestamp);
    }
    
    /**
     * Get preview of analysis message
     * @param {number} maxLength - Maximum preview length
     * @returns {string} - Preview text
     */
    getPreview(maxLength = 100) {
        return TextProcessor.extractPreview(this.message, maxLength);
    }
    
    /**
     * Check if analysis has meaningful content
     * @returns {boolean} - True if has content
     */
    hasContent() {
        return !!(this.message?.trim() || 
                 this.tags?.length > 0 || 
                 this.observations?.length > 0 ||
                 this.questions?.length > 0 ||
                 this.potentialPathways?.length > 0);
    }
    
    /**
     * Get analysis complexity score
     * @returns {number} - Complexity score (0-10)
     */
    getComplexityScore() {
        let score = 0;
        
        // Base score from message length
        if (this.message) {
            score += Math.min(this.message.length / 100, 3);
        }
        
        // Additional score from structured data
        score += (this.tags?.length || 0) * 0.5;
        score += (this.observations?.length || 0) * 1;
        score += (this.questions?.length || 0) * 1;
        score += (this.potentialPathways?.length || 0) * 1.5;
        
        return Math.min(Math.round(score), 10);
    }
    
    /**
     * Get all tags as formatted string
     * @returns {string} - Comma-separated tags
     */
    getTagsString() {
        return this.tags?.join(', ') || '';
    }
    
    /**
     * Check if analysis contains specific terms
     * @param {string|Array} terms - Terms to search for
     * @returns {boolean} - True if contains terms
     */
    containsTerms(terms) {
        if (!terms) return false;
        
        const searchTerms = Array.isArray(terms) ? terms : [terms];
        const searchableText = [
            this.message,
            this.getTagsString(),
            this.observations?.join(' '),
            this.questions?.join(' '),
            this.potentialPathways?.join(' ')
        ].join(' ');
        
        const cleanText = TextProcessor.cleanForSearch(searchableText);
        
        return searchTerms.some(term => 
            cleanText.includes(TextProcessor.cleanForSearch(term))
        );
    }
    
    /**
     * Mark analysis as failed
     * @param {Error|Object} error - Error that occurred
     */
    markAsFailed(error) {
        this.status = 'failed';
        this.error = error?.message || 'Analysis failed';
        this.errorDetails = error?.stack || null;
        this.updatedAt = new Date().toISOString();
        
        if (window.DebugStore) {
            DebugStore.error('AnalysisResult marked as failed', {
                id: this.id,
                logId: this.logId,
                error: this.error
            }, 'ANALYSIS');
        }
    }
    
    /**
     * Mark analysis as in progress
     */
    markAsInProgress() {
        this.status = 'in_progress';
        this.startedAt = new Date().toISOString();
        
        if (window.DebugStore) {
            DebugStore.info('AnalysisResult marked as in progress', {
                id: this.id,
                logId: this.logId
            }, 'ANALYSIS');
        }
    }
    
    /**
     * Complete analysis with timing
     * @param {number} processingTimeMs - Processing time in milliseconds
     */
    complete(processingTimeMs = null) {
        this.status = 'completed';
        this.completedAt = new Date().toISOString();
        this.processingTime = processingTimeMs;
        
        if (window.DebugStore) {
            DebugStore.success('AnalysisResult completed', {
                id: this.id,
                logId: this.logId,
                processingTime: processingTimeMs ? `${processingTimeMs}ms` : 'unknown'
            }, 'ANALYSIS');
        }
    }
    
    /**
     * Convert to plain object for storage
     * @returns {Object} - Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            logId: this.logId,
            timestamp: this.timestamp,
            status: this.status,
            message: this.message,
            tags: this.tags,
            observations: this.observations,
            questions: this.questions,
            potentialPathways: this.potentialPathways,
            confidence: this.confidence,
            prompt: this.prompt,
            modelUsed: this.modelUsed,
            version: this.version,
            source: this.source,
            processingTime: this.processingTime,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            error: this.error,
            errorDetails: this.errorDetails
        };
    }
    
    /**
     * Create AnalysisResult from stored object
     * @param {string} logId - Associated log ID
     * @param {Object} data - Stored data
     * @returns {AnalysisResult} - AnalysisResult instance
     */
    static fromJSON(logId, data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid analysis result data');
        }
        
        const analysis = new AnalysisResult(logId, {
            message: data.message,
            tags: data.tags,
            observations: data.observations,
            questions: data.questions,
            potentialPathways: data.potentialPathways,
            confidence: data.confidence,
            prompt: data.prompt,
            model: data.modelUsed
        });
        
        // Restore metadata
        if (data.id) analysis.id = data.id;
        if (data.timestamp) analysis.timestamp = data.timestamp;
        if (data.status) analysis.status = data.status;
        if (data.version) analysis.version = data.version;
        if (data.source) analysis.source = data.source;
        if (data.processingTime) analysis.processingTime = data.processingTime;
        if (data.startedAt) analysis.startedAt = data.startedAt;
        if (data.completedAt) analysis.completedAt = data.completedAt;
        if (data.error) analysis.error = data.error;
        if (data.errorDetails) analysis.errorDetails = data.errorDetails;
        
        return analysis;
    }
    
    /**
     * Create failed analysis result
     * @param {string} logId - Associated log ID
     * @param {Error|Object} error - Error that occurred
     * @returns {AnalysisResult} - Failed analysis result
     */
    static createFailed(logId, error) {
        const analysis = new AnalysisResult(logId, { message: '' });
        analysis.markAsFailed(error);
        return analysis;
    }
    
    /**
     * Create in-progress analysis result
     * @param {string} logId - Associated log ID
     * @returns {AnalysisResult} - In-progress analysis result
     */
    static createInProgress(logId) {
        const analysis = new AnalysisResult(logId, { message: '' });
        analysis.markAsInProgress();
        return analysis;
    }
}

// Export for use in other modules
window.AnalysisResult = AnalysisResult;