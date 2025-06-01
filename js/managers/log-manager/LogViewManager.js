// LogViewManager - Manages different view states and data preparation for log display

class LogViewManager {
    constructor() {
        this.currentView = 'entries'; // 'entries', 'markdown', 'summary'
        this.sortOrder = 'newest'; // 'newest', 'oldest'
        this.filterOptions = {
            dateRange: null,
            searchTerm: '',
            hasAnalysis: null,
            tags: []
        };
        
        if (window.DebugStore) {
            DebugStore.debug('LogViewManager initialized', {
                currentView: this.currentView,
                sortOrder: this.sortOrder
            }, 'LOGVIEW');
        }
    }
    
    /**
     * Set the current view type
     * @param {string} viewType - View type ('entries', 'markdown', 'summary')
     */
    setView(viewType) {
        const validViews = ['entries', 'markdown', 'summary'];
        
        if (!validViews.includes(viewType)) {
            throw new Error(`Invalid view type: ${viewType}`);
        }
        
        const previousView = this.currentView;
        this.currentView = viewType;
        
        if (window.DebugStore) {
            DebugStore.info('View changed', {
                from: previousView,
                to: viewType
            }, 'LOGVIEW');
        }
        
        // Dispatch view change event
        window.dispatchEvent(new CustomEvent('viewChanged', {
            detail: { 
                previousView: previousView,
                currentView: viewType 
            }
        }));
    }
    
    /**
     * Get the current view type
     * @returns {string} - Current view type
     */
    getCurrentView() {
        return this.currentView;
    }
    
    /**
     * Toggle view between entries and specified type
     * @param {string} viewType - View type to toggle to
     */
    toggleView(viewType) {
        if (this.currentView === viewType) {
            this.setView('entries');
        } else {
            this.setView(viewType);
        }
    }
    
    /**
     * Get all entries prepared for current view
     * @returns {Array} - Prepared entries for display
     */
    getEntriesForCurrentView() {
        return this.getEntriesForView(this.currentView);
    }
    
    /**
     * Get entries prepared for specific view
     * @param {string} viewType - View type to prepare for
     * @returns {Array} - Prepared entries
     */
    getEntriesForView(viewType) {
        const timer = window.DebugStore ? DebugStore.startTimer('prepareEntriesForView') : null;
        
        if (window.DebugStore) {
            DebugStore.debug('Preparing entries for view', {
                viewType: viewType,
                hasFilters: this.hasActiveFilters()
            }, 'LOGVIEW');
        }
        
        try {
            // Get raw log entries
            const rawEntries = this.getRawLogEntries();
            
            // Combine with analysis data
            const combinedEntries = this.combineWithAnalysis(rawEntries);
            
            // Apply filters
            const filteredEntries = this.applyFilters(combinedEntries);
            
            // Sort entries
            const sortedEntries = this.sortEntries(filteredEntries);
            
            // Prepare for specific view
            const preparedEntries = this.prepareForView(sortedEntries, viewType);
            
            timer?.end();
            
            if (window.DebugStore) {
                DebugStore.debug('Entries prepared for view', {
                    viewType: viewType,
                    totalRaw: rawEntries.length,
                    afterFilters: filteredEntries.length,
                    final: preparedEntries.length,
                    preparationTime: timer ? `${timer.end()}ms` : 'unknown'
                }, 'LOGVIEW');
            }
            
            return preparedEntries;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to prepare entries for view', {
                    viewType: viewType,
                    error: error.message
                }, 'LOGVIEW');
            }
            return [];
        }
    }
    
    /**
     * Get raw log entries from storage
     * @returns {Array} - Raw log entries
     */
    getRawLogEntries() {
        if (!window.LogDataStore) {
            return [];
        }
        
        return window.LogDataStore.getAllLogEntries() || [];
    }
    
    /**
     * Combine log entries with analysis data
     * @param {Array} rawEntries - Raw log entries
     * @returns {Array} - Combined entries
     */
    combineWithAnalysis(rawEntries) {
        return rawEntries.map(log => {
            const analysis = window.AnalysisDataStore ? 
                            window.AnalysisDataStore.getAnalysis(log.id) : null;
            
            return {
                // Raw log data
                id: log.id,
                timestamp: log.timestamp,
                content: log.content,
                healthContext: log.healthContext || '',
                metadata: log.metadata || {},
                
                // Analysis data (if available)
                hasAnalysis: !!analysis,
                analysisStatus: analysis?.status || 'none',
                claudeAnalysis: analysis?.message || '',
                tags: analysis?.tags || [],
                observations: analysis?.observations || [],
                questions: analysis?.questions || [],
                potentialPathways: analysis?.potentialPathways || [],
                
                // Combined for backward compatibility
                analysis: analysis ? {
                    claudeAnalysis: analysis.message,
                    tags: analysis.tags
                } : null,
                
                // View-specific computed properties
                formattedTimestamp: DateFormatter.formatLogTimestamp(log.timestamp),
                formattedDate: DateFormatter.formatDate(log.timestamp),
                preview: TextProcessor.extractPreview(log.content),
                wordCount: log.content ? log.content.trim().split(/\s+/).length : 0,
                isToday: DateFormatter.isToday(log.timestamp)
            };
        });
    }
    
    /**
     * Apply current filters to entries
     * @param {Array} entries - Entries to filter
     * @returns {Array} - Filtered entries
     */
    applyFilters(entries) {
        let filtered = [...entries];
        
        // Date range filter
        if (this.filterOptions.dateRange) {
            filtered = this.filterByDateRange(filtered, this.filterOptions.dateRange);
        }
        
        // Search term filter
        if (this.filterOptions.searchTerm) {
            filtered = this.filterBySearchTerm(filtered, this.filterOptions.searchTerm);
        }
        
        // Analysis filter
        if (this.filterOptions.hasAnalysis !== null) {
            filtered = this.filterByAnalysis(filtered, this.filterOptions.hasAnalysis);
        }
        
        // Tags filter
        if (this.filterOptions.tags.length > 0) {
            filtered = this.filterByTags(filtered, this.filterOptions.tags);
        }
        
        return filtered;
    }
    
    /**
     * Filter entries by date range
     * @param {Array} entries - Entries to filter
     * @param {Object} dateRange - Date range {start, end}
     * @returns {Array} - Filtered entries
     */
    filterByDateRange(entries, dateRange) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        return entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= startDate && entryDate <= endDate;
        });
    }
    
    /**
     * Filter entries by search term
     * @param {Array} entries - Entries to filter
     * @param {string} searchTerm - Search term
     * @returns {Array} - Filtered entries
     */
    filterBySearchTerm(entries, searchTerm) {
        const cleanTerm = TextProcessor.cleanForSearch(searchTerm);
        
        return entries.filter(entry => {
            const searchableText = [
                entry.content,
                entry.claudeAnalysis,
                entry.tags.join(' '),
                entry.observations?.join(' '),
                entry.questions?.join(' ')
            ].join(' ');
            
            return TextProcessor.cleanForSearch(searchableText).includes(cleanTerm);
        });
    }
    
    /**
     * Filter entries by analysis presence
     * @param {Array} entries - Entries to filter
     * @param {boolean} hasAnalysis - Filter for entries with/without analysis
     * @returns {Array} - Filtered entries
     */
    filterByAnalysis(entries, hasAnalysis) {
        return entries.filter(entry => entry.hasAnalysis === hasAnalysis);
    }
    
    /**
     * Filter entries by tags
     * @param {Array} entries - Entries to filter
     * @param {Array} tags - Tags to filter by
     * @returns {Array} - Filtered entries
     */
    filterByTags(entries, tags) {
        return entries.filter(entry => {
            return tags.some(tag => entry.tags.includes(tag));
        });
    }
    
    /**
     * Sort entries based on current sort order
     * @param {Array} entries - Entries to sort
     * @returns {Array} - Sorted entries
     */
    sortEntries(entries) {
        const sorted = [...entries];
        
        sorted.sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            
            if (this.sortOrder === 'oldest') {
                return dateA - dateB;
            } else {
                return dateB - dateA; // newest first (default)
            }
        });
        
        return sorted;
    }
    
    /**
     * Prepare entries for specific view type
     * @param {Array} entries - Sorted and filtered entries
     * @param {string} viewType - View type
     * @returns {Array} - View-specific prepared entries
     */
    prepareForView(entries, viewType) {
        switch (viewType) {
            case 'markdown':
                return this.prepareForMarkdownView(entries);
            case 'summary':
                return this.prepareForSummaryView(entries);
            default:
                return this.prepareForEntriesView(entries);
        }
    }
    
    /**
     * Prepare entries for markdown view
     * @param {Array} entries - Entries to prepare
     * @returns {Array} - Prepared entries
     */
    prepareForMarkdownView(entries) {
        // Group by date for markdown view
        return this.groupEntriesByDate(entries);
    }
    
    /**
     * Prepare entries for summary view
     * @param {Array} entries - Entries to prepare
     * @returns {Array} - Prepared entries with summary data
     */
    prepareForSummaryView(entries) {
        // Add summary statistics to each entry
        return entries.map(entry => ({
            ...entry,
            summaryStats: {
                complexity: this.calculateComplexity(entry),
                sentiment: this.calculateSentiment(entry),
                topTags: this.getTopTags(entry)
            }
        }));
    }
    
    /**
     * Prepare entries for standard entries view
     * @param {Array} entries - Entries to prepare
     * @returns {Array} - Prepared entries
     */
    prepareForEntriesView(entries) {
        // Add highlighting if search term is active
        if (this.filterOptions.searchTerm) {
            return entries.map(entry => ({
                ...entry,
                highlightedContent: TextProcessor.highlightSearch(
                    entry.content, 
                    this.filterOptions.searchTerm
                ),
                highlightedAnalysis: TextProcessor.highlightSearch(
                    entry.claudeAnalysis, 
                    this.filterOptions.searchTerm
                )
            }));
        }
        
        return entries;
    }
    
    /**
     * Group entries by date
     * @param {Array} entries - Entries to group
     * @returns {Object} - Entries grouped by date
     */
    groupEntriesByDate(entries) {
        const groups = {};
        
        entries.forEach(entry => {
            const dateKey = entry.formattedDate;
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(entry);
        });
        
        return groups;
    }
    
    /**
     * Calculate entry complexity score
     * @param {Object} entry - Entry to analyze
     * @returns {number} - Complexity score
     */
    calculateComplexity(entry) {
        let score = 0;
        
        // Content length factor
        score += Math.min(entry.content.length / 100, 5);
        
        // Analysis presence
        if (entry.hasAnalysis) score += 2;
        
        // Number of tags
        score += entry.tags.length * 0.5;
        
        // Number of observations/questions
        score += (entry.observations?.length || 0) * 0.3;
        score += (entry.questions?.length || 0) * 0.3;
        
        return Math.min(Math.round(score), 10);
    }
    
    /**
     * Calculate basic sentiment score
     * @param {Object} entry - Entry to analyze
     * @returns {string} - Sentiment category
     */
    calculateSentiment(entry) {
        const content = entry.content.toLowerCase();
        
        const positiveWords = ['good', 'great', 'happy', 'better', 'improved', 'well'];
        const negativeWords = ['bad', 'terrible', 'worse', 'pain', 'sad', 'tired'];
        
        const positiveCount = positiveWords.filter(word => content.includes(word)).length;
        const negativeCount = negativeWords.filter(word => content.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
    
    /**
     * Get top tags for entry
     * @param {Object} entry - Entry to analyze
     * @returns {Array} - Top tags
     */
    getTopTags(entry) {
        return entry.tags.slice(0, 3); // Return top 3 tags
    }
    
    /**
     * Set filter options
     * @param {Object} filters - Filter options to set
     */
    setFilters(filters) {
        this.filterOptions = { ...this.filterOptions, ...filters };
        
        if (window.DebugStore) {
            DebugStore.debug('Filters updated', {
                activeFilters: this.getActiveFilters()
            }, 'LOGVIEW');
        }
    }
    
    /**
     * Clear all filters
     */
    clearFilters() {
        this.filterOptions = {
            dateRange: null,
            searchTerm: '',
            hasAnalysis: null,
            tags: []
        };
        
        if (window.DebugStore) {
            DebugStore.debug('Filters cleared', {}, 'LOGVIEW');
        }
    }
    
    /**
     * Check if any filters are active
     * @returns {boolean} - True if filters are active
     */
    hasActiveFilters() {
        return !!(
            this.filterOptions.dateRange ||
            this.filterOptions.searchTerm ||
            this.filterOptions.hasAnalysis !== null ||
            this.filterOptions.tags.length > 0
        );
    }
    
    /**
     * Get list of active filters
     * @returns {Array} - Active filter descriptions
     */
    getActiveFilters() {
        const active = [];
        
        if (this.filterOptions.dateRange) {
            active.push('Date range');
        }
        if (this.filterOptions.searchTerm) {
            active.push(`Search: "${this.filterOptions.searchTerm}"`);
        }
        if (this.filterOptions.hasAnalysis !== null) {
            active.push(this.filterOptions.hasAnalysis ? 'With analysis' : 'No analysis');
        }
        if (this.filterOptions.tags.length > 0) {
            active.push(`Tags: ${this.filterOptions.tags.join(', ')}`);
        }
        
        return active;
    }
    
    /**
     * Set sort order
     * @param {string} order - Sort order ('newest' or 'oldest')
     */
    setSortOrder(order) {
        if (!['newest', 'oldest'].includes(order)) {
            throw new Error(`Invalid sort order: ${order}`);
        }
        
        this.sortOrder = order;
        
        if (window.DebugStore) {
            DebugStore.debug('Sort order changed', {
                sortOrder: order
            }, 'LOGVIEW');
        }
    }
    
    /**
     * Get view manager state
     * @returns {Object} - Current state
     */
    getState() {
        return {
            currentView: this.currentView,
            sortOrder: this.sortOrder,
            filterOptions: { ...this.filterOptions },
            hasActiveFilters: this.hasActiveFilters(),
            activeFilters: this.getActiveFilters()
        };
    }
}

// Export for use in other modules
window.LogViewManager = LogViewManager;