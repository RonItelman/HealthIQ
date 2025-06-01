// Validation Utilities - Handles input validation and data verification

class ValidationHelper {
    /**
     * Validate log entry content
     * @param {string} content - Content to validate
     * @returns {Object} - Validation result {isValid: boolean, error?: string}
     */
    static validateLogContent(content) {
        if (!content || typeof content !== 'string') {
            return { isValid: false, error: 'Content is required' };
        }
        
        const trimmed = content.trim();
        if (trimmed.length === 0) {
            return { isValid: false, error: 'Content cannot be empty' };
        }
        
        if (trimmed.length > 10000) {
            return { isValid: false, error: 'Content too long (max 10,000 characters)' };
        }
        
        return { isValid: true };
    }
    
    /**
     * Validate health context description
     * @param {string} description - Health description to validate
     * @returns {Object} - Validation result
     */
    static validateHealthDescription(description) {
        if (!description || typeof description !== 'string') {
            return { isValid: false, error: 'Health description is required' };
        }
        
        const trimmed = description.trim();
        if (trimmed.length < 10) {
            return { isValid: false, error: 'Health description too short (min 10 characters)' };
        }
        
        if (trimmed.length > 5000) {
            return { isValid: false, error: 'Health description too long (max 5,000 characters)' };
        }
        
        return { isValid: true };
    }
    
    /**
     * Validate email format (for future use)
     * @param {string} email - Email to validate
     * @returns {Object} - Validation result
     */
    static validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { isValid: false, error: 'Email is required' };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, error: 'Invalid email format' };
        }
        
        return { isValid: true };
    }
    
    /**
     * Validate JSON data structure
     * @param {string} jsonString - JSON string to validate
     * @returns {Object} - Validation result with parsed data
     */
    static validateJSON(jsonString) {
        if (!jsonString || typeof jsonString !== 'string') {
            return { isValid: false, error: 'JSON string is required' };
        }
        
        try {
            const parsed = JSON.parse(jsonString);
            return { isValid: true, data: parsed };
        } catch (error) {
            return { isValid: false, error: `Invalid JSON: ${error.message}` };
        }
    }
    
    /**
     * Validate log entry ID format
     * @param {string} id - ID to validate
     * @returns {boolean} - True if valid ID format
     */
    static isValidLogId(id) {
        if (!id || typeof id !== 'string') return false;
        
        // Should be timestamp-based or UUID format
        const timestampRegex = /^\d{13,}$/; // 13+ digits for timestamp
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        return timestampRegex.test(id) || uuidRegex.test(id);
    }
    
    /**
     * Validate API response structure
     * @param {Object} response - API response to validate
     * @returns {Object} - Validation result
     */
    static validateAPIResponse(response) {
        if (!response || typeof response !== 'object') {
            return { isValid: false, error: 'Response must be an object' };
        }
        
        // Check for common error patterns
        if (response.error) {
            return { isValid: false, error: response.error };
        }
        
        if (response.status === 'error') {
            return { isValid: false, error: response.message || 'API error' };
        }
        
        return { isValid: true };
    }
    
    /**
     * Validate analysis result structure
     * @param {Object} analysis - Analysis object to validate
     * @returns {Object} - Validation result
     */
    static validateAnalysisResult(analysis) {
        if (!analysis || typeof analysis !== 'object') {
            return { isValid: false, error: 'Analysis must be an object' };
        }
        
        // Required fields for analysis
        const requiredFields = ['message'];
        for (const field of requiredFields) {
            if (!analysis[field]) {
                return { isValid: false, error: `Missing required field: ${field}` };
            }
        }
        
        // Validate optional arrays
        const arrayFields = ['tags', 'observations', 'questions', 'potentialPathways'];
        for (const field of arrayFields) {
            if (analysis[field] && !Array.isArray(analysis[field])) {
                return { isValid: false, error: `${field} must be an array` };
            }
        }
        
        return { isValid: true };
    }
    
    /**
     * Validate file size for imports
     * @param {File} file - File to validate
     * @param {number} maxSizeBytes - Maximum file size in bytes
     * @returns {Object} - Validation result
     */
    static validateFileSize(file, maxSizeBytes = 5 * 1024 * 1024) { // 5MB default
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }
        
        if (file.size > maxSizeBytes) {
            const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
            return { isValid: false, error: `File too large (max ${maxSizeMB}MB)` };
        }
        
        return { isValid: true };
    }
    
    /**
     * Sanitize input for security
     * @param {string} input - Input to sanitize
     * @returns {string} - Sanitized input
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }
    
    /**
     * Check if value is empty or null
     * @param {any} value - Value to check
     * @returns {boolean} - True if empty
     */
    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
}

// Export for use in other modules
window.ValidationHelper = ValidationHelper;