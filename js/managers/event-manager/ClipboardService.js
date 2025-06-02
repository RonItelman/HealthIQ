// ClipboardService - Handles clipboard operations (copy markdown, JSON, etc.)

class ClipboardService {
    constructor() {
        this.clipboardHistory = [];
        this.maxHistorySize = 10;
        
        if (window.DebugStore) {
            DebugStore.debug('ClipboardService initialized', {}, 'CLIPBOARD');
        }
    }
    
    /**
     * Initialize clipboard service
     */
    init() {
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('ClipboardService init completed', {}, 'CLIPBOARD');
        }
    }
    
    /**
     * Setup event listeners for clipboard operations
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for copy markdown requests
        EventBus.on('clipboard:copyMarkdownRequested', (data) => {
            this.copyAsMarkdown();
        });
        
        // Listen for copy JSON requests
        EventBus.on('clipboard:copyJSONRequested', (data) => {
            this.copyJSONData();
        });
        
        // Listen for custom copy requests
        EventBus.on('clipboard:copyTextRequested', (data) => {
            this.copyToClipboard(data.text, data.successMessage);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Clipboard event listeners setup', {}, 'CLIPBOARD');
        }
    }
    
    /**
     * Copy log entries as markdown
     */
    async copyAsMarkdown() {
        if (window.DebugStore) {
            DebugStore.info('Copy as markdown requested', {}, 'CLIPBOARD');
        }
        
        try {
            const entries = this.getLogEntries();
            if (!entries || entries.length === 0) {
                this.showError('No log entries to copy');
                return;
            }
            
            const markdown = this.generateMarkdown(entries);
            await this.copyToClipboard(markdown, 'Markdown copied!');
            
            // Animate copy button
            this.animateButton('copyBtn', 'check', 'content_copy');
            
            // Track in history
            this.addToHistory('markdown', markdown);
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Copy markdown failed', {
                    error: error.message
                }, 'CLIPBOARD');
            }
            this.showError('Failed to copy markdown');
        }
    }
    
    /**
     * Copy log entries as JSON data
     */
    async copyJSONData() {
        if (window.DebugStore) {
            DebugStore.info('Copy JSON data requested', {}, 'CLIPBOARD');
        }
        
        try {
            const entries = this.getLogEntries();
            if (!entries || entries.length === 0) {
                this.showError('No log entries to copy');
                return;
            }
            
            const jsonData = JSON.stringify(entries, null, 2);
            await this.copyToClipboard(jsonData, 'JSON data copied!');
            
            // Animate data button
            this.animateButton('dataBtn', 'check', 'code');
            
            // Track in history
            this.addToHistory('json', jsonData);
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Copy JSON failed', {
                    error: error.message
                }, 'CLIPBOARD');
            }
            this.showError('Failed to copy JSON data');
        }
    }
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @param {string} successMessage - Success message to show
     */
    async copyToClipboard(text, successMessage = 'Copied!') {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                this.showSuccess(successMessage);
            } else {
                this.fallbackCopy(text, successMessage);
            }
            
            if (window.DebugStore) {
                DebugStore.success('Text copied to clipboard', {
                    textLength: text.length,
                    successMessage: successMessage
                }, 'CLIPBOARD');
            }
            
            // Emit clipboard event
            if (window.EventBus) {
                EventBus.emit('clipboard:copied', {
                    textLength: text.length,
                    method: navigator.clipboard ? 'modern' : 'fallback'
                });
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Clipboard copy failed', {
                    error: error.message,
                    textLength: text.length
                }, 'CLIPBOARD');
            }
            
            // Try fallback method
            this.fallbackCopy(text, successMessage);
        }
    }
    
    /**
     * Fallback copy method for older browsers
     * @param {string} text - Text to copy
     * @param {string} successMessage - Success message
     */
    fallbackCopy(text, successMessage = 'Copied!') {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            textArea.style.opacity = '0';
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showSuccess(successMessage);
                
                if (window.DebugStore) {
                    DebugStore.success('Fallback copy successful', {
                        textLength: text.length
                    }, 'CLIPBOARD');
                }
            } else {
                throw new Error('execCommand copy failed');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Fallback copy failed', {
                    error: error.message
                }, 'CLIPBOARD');
            }
            this.showError('Copy failed - please copy manually');
        }
    }
    
    /**
     * Generate markdown from log entries
     * @param {Array} entries - Log entries
     * @returns {string} - Markdown content
     */
    generateMarkdown(entries) {
        if (!entries || entries.length === 0) {
            return '# Log Entries\n\nNo entries found.';
        }
        
        let markdown = '# Health Log Entries\n\n';
        markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`;
        markdown += `Total entries: ${entries.length}\n\n`;
        markdown += '---\n\n';
        
        entries.forEach((entry, index) => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString();
            
            markdown += `## Entry ${index + 1}\n\n`;
            markdown += `**Date:** ${formattedDate} at ${formattedTime}\n\n`;
            
            // User entry content
            const userContent = entry.userLogEntry || entry.content || entry.userEntry?.content || '';
            if (userContent) {
                markdown += `**Log Entry:**\n${userContent}\n\n`;
            }
            
            // Claude's analysis if available
            const claudeAnalysis = entry.claudeLogMessage || entry.analysis?.response || entry.analysis?.claudeAnalysis;
            if (claudeAnalysis) {
                markdown += `**Analysis:**\n${claudeAnalysis}\n\n`;
            }
            
            // Tags if available
            const tags = entry.claudeTags || entry.analysis?.tags || entry.metaTags || [];
            if (tags && tags.length > 0) {
                markdown += `**Tags:** ${tags.join(', ')}\n\n`;
            }
            
            // Observations if available
            const observations = entry.claudeObservations || [];
            if (observations && observations.length > 0) {
                markdown += `**Observations:**\n`;
                observations.forEach(obs => {
                    markdown += `- ${obs}\n`;
                });
                markdown += '\n';
            }
            
            markdown += '---\n\n';
        });
        
        return markdown;
    }
    
    /**
     * Get log entries from LogManager
     * @returns {Array} - Log entries
     */
    getLogEntries() {
        if (window.LogManager && window.LogManager.getEntries) {
            return window.LogManager.getEntries();
        }
        
        // Fallback to legacy UI method
        if (window.UI && window.UI.generateMarkdown) {
            return []; // UI.generateMarkdown handles its own data
        }
        
        console.warn('No log entries source available');
        return [];
    }
    
    /**
     * Add to clipboard history
     * @param {string} type - Type of content (markdown, json, text)
     * @param {string} content - Content that was copied
     */
    addToHistory(type, content) {
        const historyItem = {
            type: type,
            content: content,
            timestamp: new Date().toISOString(),
            size: content.length
        };
        
        this.clipboardHistory.unshift(historyItem);
        
        // Trim history to max size
        if (this.clipboardHistory.length > this.maxHistorySize) {
            this.clipboardHistory = this.clipboardHistory.slice(0, this.maxHistorySize);
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Added to clipboard history', {
                type: type,
                size: content.length,
                historySize: this.clipboardHistory.length
            }, 'CLIPBOARD');
        }
    }
    
    /**
     * Animate button after clipboard operation
     * @param {string} buttonId - Button ID
     * @param {string} tempIcon - Temporary icon
     * @param {string} originalIcon - Original icon
     * @param {number} duration - Animation duration
     */
    animateButton(buttonId, tempIcon, originalIcon, duration = 2000) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        
        const iconElement = btn.querySelector('.material-symbols-outlined');
        if (!iconElement) return;
        
        const originalIconText = iconElement.textContent;
        iconElement.textContent = tempIcon;
        
        setTimeout(() => {
            iconElement.textContent = originalIconText;
        }, duration);
    }
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Emit toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: message,
                type: 'success'
            });
        }
        
        // Fallback to legacy UI
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(message);
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Emit toast notification
        if (window.EventBus) {
            EventBus.emit('toast:show', {
                message: message,
                type: 'error'
            });
        }
        
        // Fallback to legacy UI
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(message);
        }
    }
    
    /**
     * Get clipboard history
     * @returns {Array} - Clipboard history
     */
    getHistory() {
        return [...this.clipboardHistory];
    }
    
    /**
     * Clear clipboard history
     */
    clearHistory() {
        this.clipboardHistory = [];
        
        if (window.DebugStore) {
            DebugStore.info('Clipboard history cleared', {}, 'CLIPBOARD');
        }
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            historySize: this.clipboardHistory.length,
            maxHistorySize: this.maxHistorySize,
            totalCopies: this.clipboardHistory.length,
            typeBreakdown: this.getTypeBreakdown()
        };
    }
    
    /**
     * Get breakdown of copy types
     * @returns {Object} - Type breakdown
     */
    getTypeBreakdown() {
        const breakdown = {};
        this.clipboardHistory.forEach(item => {
            breakdown[item.type] = (breakdown[item.type] || 0) + 1;
        });
        return breakdown;
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        this.clearHistory();
        
        if (window.DebugStore) {
            DebugStore.debug('ClipboardService destroyed', {}, 'CLIPBOARD');
        }
    }
}

// Export for use in other modules
window.ClipboardService = ClipboardService;