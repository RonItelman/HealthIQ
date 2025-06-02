// ModalContentService - Handles modal content generation and formatting

class ModalContentService {
    constructor() {
        this.contentGenerators = new Map();
        this.contentCache = new Map();
        this.maxCacheSize = 50;
        
        if (window.DebugStore) {
            DebugStore.debug('ModalContentService initialized', {}, 'MODALCONTENT');
        }
    }
    
    /**
     * Initialize modal content service
     */
    init() {
        this.registerDefaultContentGenerators();
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalContentService init completed', {
                generators: this.contentGenerators.size
            }, 'MODALCONTENT');
        }
    }
    
    /**
     * Register default content generators
     */
    registerDefaultContentGenerators() {
        // Log modal content generator
        this.registerContentGenerator('log', 'entries', (data) => {
            return this.generateLogEntriesContent(data.entries, data.view);
        });
        
        this.registerContentGenerator('log', 'summary', (data) => {
            return this.generateLogSummaryContent(data.entries);
        });
        
        this.registerContentGenerator('log', 'markdown', (data) => {
            return this.generateMarkdownContent(data.entries);
        });
        
        // Health modal content generator
        this.registerContentGenerator('health', 'profile', (data) => {
            return this.generateHealthProfileContent(data.profile);
        });
        
        // Think modal content generator
        this.registerContentGenerator('think', 'analysis', (data) => {
            return this.generateThinkAnalysisContent(data.analysis, data.categorizedData);
        });
        
        this.registerContentGenerator('think', 'loading', (data) => {
            return this.generateLoadingContent('Analyzing your health patterns...');
        });
        
        // Debug modal content generator
        this.registerContentGenerator('debug', 'logs', (data) => {
            return this.generateDebugLogsContent(data.logs, data.filter);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Default content generators registered', {
                count: this.contentGenerators.size
            }, 'MODALCONTENT');
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for content generation requests
        EventBus.on('modal:generateContent', (data) => {
            this.handleContentGeneration(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('ModalContentService event listeners setup', {}, 'MODALCONTENT');
        }
    }
    
    /**
     * Register a content generator
     * @param {string} modalType - Modal type (log, health, think, debug)
     * @param {string} contentType - Content type (entries, summary, etc.)
     * @param {Function} generator - Generator function
     */
    registerContentGenerator(modalType, contentType, generator) {
        const key = `${modalType}:${contentType}`;
        this.contentGenerators.set(key, generator);
        
        if (window.DebugStore) {
            DebugStore.debug('Content generator registered', {
                modalType: modalType,
                contentType: contentType,
                key: key
            }, 'MODALCONTENT');
        }
    }
    
    /**
     * Generate content for a modal
     * @param {string} modalType - Modal type
     * @param {string} contentType - Content type
     * @param {Object} data - Data for content generation
     * @returns {string} - Generated HTML content
     */
    generateContent(modalType, contentType, data = {}) {
        const key = `${modalType}:${contentType}`;
        const generator = this.contentGenerators.get(key);
        
        if (!generator) {
            if (window.DebugStore) {
                DebugStore.warn('Content generator not found', {
                    modalType: modalType,
                    contentType: contentType,
                    key: key
                }, 'MODALCONTENT');
            }
            return this.generateErrorContent(`No generator found for ${modalType}:${contentType}`);
        }
        
        try {
            if (window.DebugStore) {
                DebugStore.debug('Generating content', {
                    modalType: modalType,
                    contentType: contentType,
                    dataKeys: Object.keys(data)
                }, 'MODALCONTENT');
            }
            
            const content = generator(data);
            
            // Cache the generated content
            this.cacheContent(key, data, content);
            
            if (window.DebugStore) {
                DebugStore.success('Content generated successfully', {
                    modalType: modalType,
                    contentType: contentType,
                    contentLength: content.length
                }, 'MODALCONTENT');
            }
            
            return content;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Content generation failed', {
                    modalType: modalType,
                    contentType: contentType,
                    error: error.message
                }, 'MODALCONTENT');
            }
            
            return this.generateErrorContent(`Failed to generate content: ${error.message}`);
        }
    }
    
    /**
     * Handle content generation event
     * @param {Object} data - Event data
     */
    handleContentGeneration(data) {
        const content = this.generateContent(data.modalType, data.contentType, data.data);
        
        // Emit content generated event
        if (window.EventBus) {
            EventBus.emit('modal:contentGenerated', {
                modalId: data.modalId,
                modalType: data.modalType,
                contentType: data.contentType,
                content: content
            });
        }
    }
    
    /**
     * Generate log entries content
     * @param {Array} entries - Log entries
     * @param {string} view - View type (list, compact)
     * @returns {string} - HTML content
     */
    generateLogEntriesContent(entries, view = 'list') {
        if (!entries || entries.length === 0) {
            return '<div class="empty-state">No entries yet. Start logging your daily activities!</div>';
        }
        
        const entriesHtml = entries.map(entry => {
            return this.formatLogEntry(entry, view);
        }).join('');
        
        return `
            <div class="log-entries ${view}-view">
                ${entriesHtml}
            </div>
        `;
    }
    
    /**
     * Generate log summary content
     * @param {Array} entries - Log entries
     * @returns {string} - HTML content
     */
    generateLogSummaryContent(entries) {
        if (!entries || entries.length === 0) {
            return '<div class="empty-state">No entries to summarize</div>';
        }
        
        const totalEntries = entries.length;
        const todayEntries = entries.filter(entry => {
            const entryDate = new Date(entry.timestamp).toDateString();
            const today = new Date().toDateString();
            return entryDate === today;
        }).length;
        
        const analyzedEntries = entries.filter(entry => 
            entry.claudeLogMessage || entry.analysis?.response
        ).length;
        
        const tags = this.extractAllTags(entries);
        const topTags = this.getTopTags(tags, 5);
        
        return `
            <div class="log-summary">
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${totalEntries}</span>
                        <span class="stat-label">Total Entries</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${todayEntries}</span>
                        <span class="stat-label">Today's Entries</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${analyzedEntries}</span>
                        <span class="stat-label">Analyzed</span>
                    </div>
                </div>
                
                ${topTags.length > 0 ? `
                    <div class="summary-tags">
                        <h3>Most Common Tags</h3>
                        <div class="tag-list">
                            ${topTags.map(({ tag, count }) => 
                                `<span class="tag-item">${tag} (${count})</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="summary-recent">
                    <h3>Recent Entries</h3>
                    ${this.generateLogEntriesContent(entries.slice(-3), 'compact')}
                </div>
            </div>
        `;
    }
    
    /**
     * Generate markdown content
     * @param {Array} entries - Log entries
     * @returns {string} - HTML content
     */
    generateMarkdownContent(entries) {
        if (!entries || entries.length === 0) {
            return '<div class="empty-state">No entries to display as markdown</div>';
        }
        
        // Use ClipboardService to generate markdown
        let markdown = '';
        if (window.ClipboardService) {
            const clipboardService = new ClipboardService();
            markdown = clipboardService.generateMarkdown(entries);
        } else {
            markdown = this.generateBasicMarkdown(entries);
        }
        
        return `
            <div class="log-entry">
                <pre style="white-space: pre-wrap; font-family: monospace;">${this.escapeHtml(markdown)}</pre>
            </div>
        `;
    }
    
    /**
     * Generate health profile content
     * @param {Object} profile - Health profile
     * @returns {string} - HTML content
     */
    generateHealthProfileContent(profile) {
        if (!profile) {
            return '<div class="empty-state">No health profile available</div>';
        }
        
        return `
            <div class="health-profile">
                <div class="health-description">
                    <h3>Health Description</h3>
                    <div class="description-content">
                        ${profile.description || 'No description provided'}
                    </div>
                </div>
                
                ${profile.analysis ? `
                    <div class="health-analysis">
                        <h3>Analysis</h3>
                        <div class="analysis-content">
                            ${this.formatHealthAnalysis(profile.analysis)}
                        </div>
                    </div>
                ` : ''}
                
                <div class="health-stats">
                    <div class="stat-item">
                        <span class="stat-label">Completeness</span>
                        <span class="stat-value">${Math.round((profile.getCompletenessScore?.() || 0) * 100)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Last Updated</span>
                        <span class="stat-value">${this.formatDate(profile.lastUpdated)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate think analysis content
     * @param {string} analysis - Analysis text
     * @param {Object} categorizedData - Categorized data
     * @returns {string} - HTML content
     */
    generateThinkAnalysisContent(analysis, categorizedData) {
        if (!analysis) {
            return this.generateErrorContent('No analysis available');
        }
        
        return `
            <div class="think-analysis">
                <div class="analysis-header">
                    <h3>Health Pattern Analysis</h3>
                    <div class="analysis-meta">
                        Based on ${categorizedData?.totalEntries || 0} log entries
                    </div>
                </div>
                
                <div class="analysis-content">
                    ${this.formatAnalysisText(analysis)}
                </div>
                
                ${categorizedData ? `
                    <div class="analysis-summary">
                        <h4>Data Summary</h4>
                        <ul>
                            <li>Total entries analyzed: ${categorizedData.totalEntries}</li>
                            <li>Health categories: ${categorizedData.totalCategories}</li>
                            <li>Analysis generated: ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Generate debug logs content
     * @param {Array} logs - Debug logs
     * @param {string} filter - Log filter
     * @returns {string} - HTML content
     */
    generateDebugLogsContent(logs, filter = 'all') {
        if (!logs || logs.length === 0) {
            return '<div class="empty-state">No debug logs available</div>';
        }
        
        const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.level === filter);
        
        return `
            <div class="debug-logs">
                <div class="debug-header">
                    <span class="log-count">${filteredLogs.length} logs ${filter !== 'all' ? `(${filter})` : ''}</span>
                </div>
                
                <div class="debug-log-list">
                    ${filteredLogs.map(log => this.formatDebugLog(log)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Generate loading content
     * @param {string} message - Loading message
     * @returns {string} - HTML content
     */
    generateLoadingContent(message = 'Loading...') {
        return `
            <div class="loading-state">
                <div class="loading-spinner">
                    <span class="material-symbols-outlined spinning">refresh</span>
                </div>
                <div class="loading-message">${message}</div>
            </div>
        `;
    }
    
    /**
     * Generate error content
     * @param {string} error - Error message
     * @returns {string} - HTML content
     */
    generateErrorContent(error) {
        return `
            <div class="error-state">
                <span class="material-symbols-outlined">error</span>
                <div class="error-message">${this.escapeHtml(error)}</div>
            </div>
        `;
    }
    
    /**
     * Format a single log entry
     * @param {Object} entry - Log entry
     * @param {string} view - View type
     * @returns {string} - HTML content
     */
    formatLogEntry(entry, view = 'list') {
        const date = new Date(entry.timestamp);
        const timeStr = this.formatTime(date);
        const dateStr = this.formatDate(date);
        
        const userContent = entry.userLogEntry || entry.content || entry.userEntry?.content || '';
        const claudeMessage = entry.claudeLogMessage || entry.analysis?.response || entry.analysis?.claudeAnalysis;
        const tags = entry.claudeTags || entry.analysis?.tags || entry.metaTags || [];
        
        if (view === 'compact') {
            return `
                <div class="log-entry compact">
                    <div class="entry-header">
                        <span class="entry-time">${timeStr}</span>
                        ${tags.length > 0 ? `<div class="entry-tags">${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                    </div>
                    <div class="entry-content">${this.truncateText(userContent, 100)}</div>
                </div>
            `;
        }
        
        return `
            <div class="log-entry">
                <div class="entry-header">
                    <div class="entry-time-full">
                        <span class="entry-date">${dateStr}</span>
                        <span class="entry-time">${timeStr}</span>
                    </div>
                </div>
                
                <div class="entry-content">
                    <div class="user-content">${this.formatText(userContent)}</div>
                    
                    ${claudeMessage ? `
                        <div class="claude-analysis">
                            <h4>Analysis</h4>
                            <div class="analysis-text">${this.formatText(claudeMessage)}</div>
                        </div>
                    ` : ''}
                    
                    ${tags.length > 0 ? `
                        <div class="entry-tags">
                            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Format debug log entry
     * @param {Object} log - Debug log
     * @returns {string} - HTML content
     */
    formatDebugLog(log) {
        const time = this.formatTime(new Date(log.timestamp));
        const levelClass = log.level.toLowerCase();
        
        return `
            <div class="debug-log-entry ${levelClass}">
                <div class="log-header">
                    <span class="log-time">${time}</span>
                    <span class="log-level">${log.level}</span>
                    <span class="log-source">${log.source}</span>
                </div>
                <div class="log-message">${this.escapeHtml(log.message)}</div>
                ${log.data && Object.keys(log.data).length > 0 ? `
                    <div class="log-data">
                        <pre>${this.escapeHtml(JSON.stringify(log.data, null, 2))}</pre>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Extract all tags from entries
     * @param {Array} entries - Log entries
     * @returns {Array} - All tags
     */
    extractAllTags(entries) {
        const tags = [];
        entries.forEach(entry => {
            const entryTags = entry.claudeTags || entry.analysis?.tags || entry.metaTags || [];
            tags.push(...entryTags);
        });
        return tags;
    }
    
    /**
     * Get top tags by frequency
     * @param {Array} tags - All tags
     * @param {number} limit - Number of top tags
     * @returns {Array} - Top tags with counts
     */
    getTopTags(tags, limit = 5) {
        const tagCounts = {};
        tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
        
        return Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
    }
    
    /**
     * Cache generated content
     * @param {string} key - Cache key
     * @param {Object} data - Input data
     * @param {string} content - Generated content
     */
    cacheContent(key, data, content) {
        // Simple cache with size limit
        if (this.contentCache.size >= this.maxCacheSize) {
            const firstKey = this.contentCache.keys().next().value;
            this.contentCache.delete(firstKey);
        }
        
        this.contentCache.set(key, {
            data: data,
            content: content,
            timestamp: Date.now()
        });
    }
    
    /**
     * Utility functions for formatting
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    formatDate(date) {
        if (!date) return 'Unknown';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    formatText(text) {
        if (!text) return '';
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }
    
    formatHealthAnalysis(analysis) {
        return this.formatText(analysis);
    }
    
    formatAnalysisText(analysis) {
        return this.formatText(analysis);
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    generateBasicMarkdown(entries) {
        let markdown = '# Health Log Entries\n\n';
        entries.forEach((entry, index) => {
            const date = new Date(entry.timestamp);
            markdown += `## Entry ${index + 1} - ${date.toLocaleDateString()}\n\n`;
            markdown += `${entry.userLogEntry || entry.content || ''}\n\n`;
        });
        return markdown;
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            registeredGenerators: this.contentGenerators.size,
            cacheSize: this.contentCache.size,
            maxCacheSize: this.maxCacheSize,
            generators: Array.from(this.contentGenerators.keys())
        };
    }
    
    /**
     * Clear content cache
     */
    clearCache() {
        this.contentCache.clear();
        
        if (window.DebugStore) {
            DebugStore.info('Content cache cleared', {}, 'MODALCONTENT');
        }
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        this.contentGenerators.clear();
        this.clearCache();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalContentService destroyed', {}, 'MODALCONTENT');
        }
    }
}

// Export for use in other modules
window.ModalContentService = ModalContentService;