// Text Processing Utilities - Handles text formatting, escaping, and manipulation

class TextProcessor {
    /**
     * Escape HTML characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - HTML-escaped text
     */
    static escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Format text for display with basic markdown-like formatting
     * @param {string} text - Text to format
     * @returns {string} - Formatted HTML
     */
    static formatDisplay(text) {
        if (!text) return '';
        
        return this.escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
    
    /**
     * Convert text to markdown format
     * @param {string} text - Text to convert
     * @returns {string} - Markdown formatted text
     */
    static toMarkdown(text) {
        if (!text) return '';
        
        // Escape existing markdown characters
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\*/g, '\\*')
            .replace(/#/g, '\\#')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]');
    }
    
    /**
     * Truncate text to specified length with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    static truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    /**
     * Extract preview text from longer content
     * @param {string} text - Full text
     * @param {number} maxLength - Maximum preview length
     * @returns {string} - Preview text
     */
    static extractPreview(text, maxLength = 150) {
        if (!text) return '';
        
        // Remove extra whitespace and get first sentence or truncate
        const cleaned = text.trim().replace(/\s+/g, ' ');
        
        // Try to end at sentence boundary
        if (cleaned.length <= maxLength) return cleaned;
        
        const truncated = cleaned.substring(0, maxLength);
        const lastSentence = truncated.lastIndexOf('.');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastQuestion = truncated.lastIndexOf('?');
        
        const lastPunct = Math.max(lastSentence, lastExclamation, lastQuestion);
        
        if (lastPunct > maxLength * 0.6) {
            return truncated.substring(0, lastPunct + 1);
        }
        
        return truncated + '...';
    }
    
    /**
     * Clean text for search/comparison
     * @param {string} text - Text to clean
     * @returns {string} - Cleaned text
     */
    static cleanForSearch(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    /**
     * Highlight search terms in text
     * @param {string} text - Original text
     * @param {string} searchTerm - Term to highlight
     * @returns {string} - Text with highlighted terms
     */
    static highlightSearch(text, searchTerm) {
        if (!text || !searchTerm) return this.escapeHtml(text);
        
        const escapedText = this.escapeHtml(text);
        const escapedTerm = this.escapeHtml(searchTerm);
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        return escapedText.replace(regex, '<mark>$1</mark>');
    }
}

// Export for use in other modules
window.TextProcessor = TextProcessor;