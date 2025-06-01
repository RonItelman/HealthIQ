// LogEntry Model - Represents a single log entry with validation and formatting

class LogEntry {
    constructor(content, timestamp = null, id = null) {
        this.id = id || this.generateId();
        this.timestamp = timestamp || new Date().toISOString();
        this.content = this.validateAndSetContent(content);
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
        
        // Metadata
        this.version = '2.0';
        this.source = 'user';
        
        if (window.DebugStore) {
            DebugStore.debug('LogEntry created', {
                id: this.id,
                contentLength: this.content.length,
                timestamp: this.timestamp
            }, 'LOGENTRY');
        }
    }
    
    /**
     * Generate unique ID for log entry
     * @returns {string} - Unique timestamp-based ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Validate and set content
     * @param {string} content - Content to validate
     * @returns {string} - Validated content
     */
    validateAndSetContent(content) {
        const validation = ValidationHelper.validateLogContent(content);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }
        return content.trim();
    }
    
    /**
     * Get preview text for display
     * @param {number} maxLength - Maximum preview length
     * @returns {string} - Preview text
     */
    getPreview(maxLength = 150) {
        return TextProcessor.extractPreview(this.content, maxLength);
    }
    
    /**
     * Get formatted timestamp for display
     * @returns {string} - Formatted timestamp
     */
    getFormattedTimestamp() {
        return DateFormatter.formatLogTimestamp(this.timestamp);
    }
    
    /**
     * Get formatted date for grouping
     * @returns {string} - Formatted date
     */
    getFormattedDate() {
        return DateFormatter.formatDate(this.timestamp);
    }
    
    /**
     * Check if entry was created today
     * @returns {boolean} - True if created today
     */
    isToday() {
        return DateFormatter.isToday(this.timestamp);
    }
    
    /**
     * Update content (creates new version)
     * @param {string} newContent - New content
     */
    updateContent(newContent) {
        this.content = this.validateAndSetContent(newContent);
        this.updatedAt = new Date().toISOString();
        
        if (window.DebugStore) {
            DebugStore.info('LogEntry content updated', {
                id: this.id,
                newContentLength: this.content.length
            }, 'LOGENTRY');
        }
    }
    
    /**
     * Convert to plain object for storage
     * @returns {Object} - Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            version: this.version,
            source: this.source
        };
    }
    
    /**
     * Create LogEntry from stored object
     * @param {Object} data - Stored data
     * @returns {LogEntry} - LogEntry instance
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid log entry data');
        }
        
        const entry = new LogEntry(data.content, data.timestamp, data.id);
        
        // Restore metadata if available
        if (data.createdAt) entry.createdAt = data.createdAt;
        if (data.updatedAt) entry.updatedAt = data.updatedAt;
        if (data.version) entry.version = data.version;
        if (data.source) entry.source = data.source;
        
        return entry;
    }
    
    /**
     * Validate log entry data structure
     * @param {Object} data - Data to validate
     * @returns {Object} - Validation result
     */
    static validate(data) {
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Data must be an object' };
        }
        
        // Check required fields
        if (!data.id) {
            return { isValid: false, error: 'Missing required field: id' };
        }
        
        if (!data.content) {
            return { isValid: false, error: 'Missing required field: content' };
        }
        
        if (!data.timestamp) {
            return { isValid: false, error: 'Missing required field: timestamp' };
        }
        
        // Validate content
        const contentValidation = ValidationHelper.validateLogContent(data.content);
        if (!contentValidation.isValid) {
            return contentValidation;
        }
        
        // Validate timestamp
        const timestamp = new Date(data.timestamp);
        if (isNaN(timestamp.getTime())) {
            return { isValid: false, error: 'Invalid timestamp format' };
        }
        
        return { isValid: true };
    }
    
    /**
     * Create LogEntry with health context
     * @param {string} content - Log content
     * @param {string} healthContext - Health context
     * @returns {LogEntry} - LogEntry with context
     */
    static withHealthContext(content, healthContext) {
        const entry = new LogEntry(content);
        entry.healthContext = healthContext;
        return entry;
    }
    
    /**
     * Get word count for content
     * @returns {number} - Word count
     */
    getWordCount() {
        return this.content.trim().split(/\s+/).length;
    }
    
    /**
     * Get character count for content
     * @returns {number} - Character count
     */
    getCharacterCount() {
        return this.content.length;
    }
    
    /**
     * Check if content contains specific terms
     * @param {string|Array} terms - Terms to search for
     * @returns {boolean} - True if contains terms
     */
    containsTerms(terms) {
        if (!terms) return false;
        
        const searchTerms = Array.isArray(terms) ? terms : [terms];
        const cleanContent = TextProcessor.cleanForSearch(this.content);
        
        return searchTerms.some(term => 
            cleanContent.includes(TextProcessor.cleanForSearch(term))
        );
    }
    
    /**
     * Get content with highlighted search terms
     * @param {string} searchTerm - Term to highlight
     * @returns {string} - Content with highlighted terms
     */
    getHighlightedContent(searchTerm) {
        return TextProcessor.highlightSearch(this.content, searchTerm);
    }
}

// Export for use in other modules
window.LogEntry = LogEntry;