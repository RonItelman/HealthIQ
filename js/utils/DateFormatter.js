// Date Formatting Utilities - Handles all date/time formatting consistently

class DateFormatter {
    /**
     * Format timestamp for display in log entries
     * @param {string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted date string
     */
    static formatLogTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // Less than 1 minute ago
        if (diffMinutes < 1) {
            return 'Just now';
        }
        
        // Less than 1 hour ago
        if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
        
        // Less than 24 hours ago
        if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        }
        
        // Less than 7 days ago
        if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }
        
        // More than a week ago - show actual date
        return this.formatDate(date);
    }
    
    /**
     * Format date for debug logs and system messages
     * @param {string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted debug timestamp
     */
    static formatDebugTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        
        return `${hours}:${minutes}:${seconds}.${ms}`;
    }
    
    /**
     * Format date for markdown export
     * @param {string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted markdown date
     */
    static formatMarkdownDate(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    /**
     * Format date for file exports
     * @param {string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted export date (YYYY-MM-DD_HH-MM-SS)
     */
    static formatExportFilename(timestamp = new Date()) {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'invalid-date';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    }
    
    /**
     * Basic date formatting
     * @param {string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted date (MM/DD/YYYY)
     */
    static formatDate(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleDateString('en-US');
    }
    
    /**
     * Format date and time together
     * @param {string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted date and time
     */
    static formatDateTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleDateString('en-US') + ' at ' + 
               date.toLocaleTimeString('en-US', { 
                   hour: 'numeric', 
                   minute: '2-digit',
                   hour12: true 
               });
    }
    
    /**
     * Check if timestamp is today
     * @param {string|Date} timestamp - Timestamp to check
     * @returns {boolean} - True if timestamp is today
     */
    static isToday(timestamp) {
        if (!timestamp) return false;
        
        const date = new Date(timestamp);
        const today = new Date();
        
        return date.toDateString() === today.toDateString();
    }
    
    /**
     * Get start of day for date filtering
     * @param {string|Date} timestamp - Timestamp to get start of day for
     * @returns {Date} - Start of day
     */
    static getStartOfDay(timestamp = new Date()) {
        const date = new Date(timestamp);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    
    /**
     * Get end of day for date filtering
     * @param {string|Date} timestamp - Timestamp to get end of day for
     * @returns {Date} - End of day
     */
    static getEndOfDay(timestamp = new Date()) {
        const date = new Date(timestamp);
        date.setHours(23, 59, 59, 999);
        return date;
    }
}

// Export for use in other modules
window.DateFormatter = DateFormatter;