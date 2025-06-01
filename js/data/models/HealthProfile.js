// HealthProfile Model - Represents user's health context and profile information

class HealthProfile {
    constructor(description = '', analysis = null) {
        this.id = this.generateId();
        this.timestamp = new Date().toISOString();
        this.description = this.validateAndSetDescription(description);
        this.analysis = analysis;
        
        // Profile metadata
        this.version = '2.0';
        this.lastUpdated = this.timestamp;
        this.analysisCount = 0;
        this.contextQueries = [];
        
        if (window.DebugStore) {
            DebugStore.debug('HealthProfile created', {
                id: this.id,
                descriptionLength: this.description.length,
                hasAnalysis: !!this.analysis
            }, 'HEALTHPROFILE');
        }
    }
    
    /**
     * Generate unique ID for health profile
     * @returns {string} - Unique ID
     */
    generateId() {
        return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Validate and set description
     * @param {string} description - Health description
     * @returns {string} - Validated description
     */
    validateAndSetDescription(description) {
        if (!description) return '';
        
        const validation = ValidationHelper.validateHealthDescription(description);
        if (!validation.isValid && description.trim().length > 0) {
            throw new Error(validation.error);
        }
        
        return description.trim();
    }
    
    /**
     * Check if profile has meaningful context
     * @returns {boolean} - True if has context
     */
    hasContext() {
        return !!(this.description?.trim() || this.analysis?.trim());
    }
    
    /**
     * Get formatted description for display
     * @returns {string} - Formatted description
     */
    getFormattedDescription() {
        return TextProcessor.formatDisplay(this.description);
    }
    
    /**
     * Get formatted analysis for display
     * @returns {string} - Formatted analysis
     */
    getFormattedAnalysis() {
        return TextProcessor.formatDisplay(this.analysis || '');
    }
    
    /**
     * Get preview of description
     * @param {number} maxLength - Maximum preview length
     * @returns {string} - Preview text
     */
    getDescriptionPreview(maxLength = 100) {
        return TextProcessor.extractPreview(this.description, maxLength);
    }
    
    /**
     * Get preview of analysis
     * @param {number} maxLength - Maximum preview length
     * @returns {string} - Preview text
     */
    getAnalysisPreview(maxLength = 150) {
        return TextProcessor.extractPreview(this.analysis || '', maxLength);
    }
    
    /**
     * Update description and mark as updated
     * @param {string} newDescription - New description
     */
    updateDescription(newDescription) {
        this.description = this.validateAndSetDescription(newDescription);
        this.lastUpdated = new Date().toISOString();
        
        if (window.DebugStore) {
            DebugStore.info('HealthProfile description updated', {
                id: this.id,
                newDescriptionLength: this.description.length
            }, 'HEALTHPROFILE');
        }
    }
    
    /**
     * Update analysis and mark as updated
     * @param {string} newAnalysis - New analysis from AI
     */
    updateAnalysis(newAnalysis) {
        this.analysis = newAnalysis || '';
        this.lastUpdated = new Date().toISOString();
        this.analysisCount++;
        
        if (window.DebugStore) {
            DebugStore.info('HealthProfile analysis updated', {
                id: this.id,
                analysisLength: this.analysis.length,
                analysisCount: this.analysisCount
            }, 'HEALTHPROFILE');
        }
    }
    
    /**
     * Update both description and analysis
     * @param {string} description - New description
     * @param {string} analysis - New analysis
     */
    updateFromAnalysis(description, analysis) {
        this.updateDescription(description);
        this.updateAnalysis(analysis);
    }
    
    /**
     * Add a context query (for tracking what questions were asked)
     * @param {string} query - Query that was made
     */
    addContextQuery(query) {
        if (!query) return;
        
        this.contextQueries.push({
            query: query.trim(),
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 queries
        if (this.contextQueries.length > 10) {
            this.contextQueries = this.contextQueries.slice(-10);
        }
        
        this.lastUpdated = new Date().toISOString();
    }
    
    /**
     * Get recent context queries
     * @param {number} limit - Maximum number of queries to return
     * @returns {Array} - Recent queries
     */
    getRecentQueries(limit = 5) {
        return this.contextQueries.slice(-limit).reverse();
    }
    
    /**
     * Check if profile contains specific terms
     * @param {string|Array} terms - Terms to search for
     * @returns {boolean} - True if contains terms
     */
    containsTerms(terms) {
        if (!terms) return false;
        
        const searchTerms = Array.isArray(terms) ? terms : [terms];
        const searchableText = [this.description, this.analysis].join(' ');
        const cleanText = TextProcessor.cleanForSearch(searchableText);
        
        return searchTerms.some(term => 
            cleanText.includes(TextProcessor.cleanForSearch(term))
        );
    }
    
    /**
     * Get word count for description
     * @returns {number} - Word count
     */
    getDescriptionWordCount() {
        return this.description ? this.description.trim().split(/\s+/).length : 0;
    }
    
    /**
     * Get word count for analysis
     * @returns {number} - Word count
     */
    getAnalysisWordCount() {
        return this.analysis ? this.analysis.trim().split(/\s+/).length : 0;
    }
    
    /**
     * Get profile completeness score (0-100)
     * @returns {number} - Completeness score
     */
    getCompletenessScore() {
        let score = 0;
        
        // Description completeness (0-50 points)
        if (this.description) {
            const wordCount = this.getDescriptionWordCount();
            score += Math.min(wordCount * 2, 50); // 2 points per word, max 50
        }
        
        // Analysis completeness (0-30 points)
        if (this.analysis) {
            const wordCount = this.getAnalysisWordCount();
            score += Math.min(wordCount * 1, 30); // 1 point per word, max 30
        }
        
        // Usage completeness (0-20 points)
        score += Math.min(this.analysisCount * 5, 20); // 5 points per analysis, max 20
        
        return Math.min(score, 100);
    }
    
    /**
     * Clear all profile data
     */
    clear() {
        this.description = '';
        this.analysis = '';
        this.contextQueries = [];
        this.lastUpdated = new Date().toISOString();
        
        if (window.DebugStore) {
            DebugStore.info('HealthProfile cleared', {
                id: this.id
            }, 'HEALTHPROFILE');
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
            description: this.description,
            analysis: this.analysis,
            version: this.version,
            lastUpdated: this.lastUpdated,
            analysisCount: this.analysisCount,
            contextQueries: this.contextQueries
        };
    }
    
    /**
     * Create HealthProfile from stored object
     * @param {Object} data - Stored data
     * @returns {HealthProfile} - HealthProfile instance
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            return new HealthProfile(); // Return empty profile for invalid data
        }
        
        const profile = new HealthProfile(data.description || '', data.analysis || '');
        
        // Restore metadata
        if (data.id) profile.id = data.id;
        if (data.timestamp) profile.timestamp = data.timestamp;
        if (data.version) profile.version = data.version;
        if (data.lastUpdated) profile.lastUpdated = data.lastUpdated;
        if (data.analysisCount) profile.analysisCount = data.analysisCount;
        if (data.contextQueries) profile.contextQueries = data.contextQueries;
        
        return profile;
    }
    
    /**
     * Validate health profile data structure
     * @param {Object} data - Data to validate
     * @returns {Object} - Validation result
     */
    static validate(data) {
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Data must be an object' };
        }
        
        // Description is optional but if present, must be valid
        if (data.description) {
            const validation = ValidationHelper.validateHealthDescription(data.description);
            if (!validation.isValid) {
                return validation;
            }
        }
        
        return { isValid: true };
    }
    
    /**
     * Get formatted last updated time
     * @returns {string} - Formatted time
     */
    getFormattedLastUpdated() {
        return DateFormatter.formatLogTimestamp(this.lastUpdated);
    }
}

// Export for use in other modules
window.HealthProfile = HealthProfile;