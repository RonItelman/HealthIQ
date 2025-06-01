// LogEntryTemplates - HTML templates for log entry rendering

class LogEntryTemplates {
    constructor() {
        if (window.DebugStore) {
            DebugStore.debug('LogEntryTemplates initialized', {}, 'TEMPLATES');
        }
    }
    
    /**
     * Main log entry template
     * @param {Object} entry - Log entry data
     * @returns {string} - HTML template
     */
    logEntry(entry) {
        const hasAnalysis = entry.hasAnalysis && entry.claudeAnalysis;
        const hasHealthContext = entry.healthContext && entry.healthContext.trim();
        
        return `
            <div class="log-entry" data-entry-id="${entry.id}">
                ${this.entryHeader(entry)}
                ${this.entryContent(entry)}
                ${hasHealthContext ? this.healthContext(entry.healthContext) : ''}
                ${hasAnalysis ? this.analysisSection(entry) : this.analysisPlaceholder(entry)}
                ${this.entryFooter(entry)}
            </div>
        `;
    }
    
    /**
     * Entry header with timestamp and metadata
     * @param {Object} entry - Log entry data
     * @returns {string} - Header HTML
     */
    entryHeader(entry) {
        const statusIcon = this.getStatusIcon(entry.analysisStatus);
        const todayIndicator = entry.isToday ? '<span class="today-indicator">Today</span>' : '';
        
        return `
            <div class="log-entry-header">
                <div class="entry-meta">
                    <span class="entry-timestamp" title="${entry.timestamp}">
                        ${entry.formattedTimestamp || DateFormatter.formatLogTimestamp(entry.timestamp)}
                    </span>
                    ${todayIndicator}
                </div>
                <div class="entry-actions">
                    <div class="analysis-status" title="Analysis status: ${entry.analysisStatus}">
                        ${statusIcon}
                    </div>
                    <button class="entry-action-btn delete-btn" 
                            onclick="LogManager.deleteEntry('${entry.id}')" 
                            title="Delete entry">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Entry content section
     * @param {Object} entry - Log entry data
     * @returns {string} - Content HTML
     */
    entryContent(entry) {
        const content = entry.highlightedContent || TextProcessor.formatDisplay(entry.content);
        const wordCount = entry.wordCount || (entry.content ? entry.content.trim().split(/\s+/).length : 0);
        
        return `
            <div class="log-entry-content">
                <div class="user-content">
                    ${content}
                </div>
                <div class="content-meta">
                    <span class="word-count">${wordCount} words</span>
                    ${entry.tags && entry.tags.length > 0 ? this.tagsList(entry.tags) : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Health context section
     * @param {string} healthContext - Health context text
     * @returns {string} - Health context HTML
     */
    healthContext(healthContext) {
        return `
            <div class="health-context-section">
                <details class="health-context-details">
                    <summary class="health-context-summary">
                        <span class="material-symbols-outlined">medical_information</span>
                        Health Context
                    </summary>
                    <div class="health-context-content">
                        ${TextProcessor.formatDisplay(healthContext)}
                    </div>
                </details>
            </div>
        `;
    }
    
    /**
     * Analysis section when analysis exists
     * @param {Object} entry - Log entry with analysis
     * @returns {string} - Analysis HTML
     */
    analysisSection(entry) {
        const analysis = entry.highlightedAnalysis || TextProcessor.formatDisplay(entry.claudeAnalysis);
        
        return `
            <div class="analysis-section">
                <details class="analysis-details" open>
                    <summary class="analysis-summary">
                        <span class="material-symbols-outlined">psychology</span>
                        AI Analysis
                        ${entry.tags && entry.tags.length > 0 ? 
                            `<span class="tag-count">${entry.tags.length} tags</span>` : ''
                        }
                    </summary>
                    <div class="analysis-content">
                        <div class="claude-analysis">
                            ${analysis}
                        </div>
                        ${this.structuredAnalysis(entry)}
                    </div>
                </details>
            </div>
        `;
    }
    
    /**
     * Structured analysis components (observations, questions, etc.)
     * @param {Object} entry - Log entry with analysis
     * @returns {string} - Structured analysis HTML
     */
    structuredAnalysis(entry) {
        let html = '';
        
        if (entry.observations && entry.observations.length > 0) {
            html += `
                <div class="analysis-observations">
                    <h4>Key Observations</h4>
                    <ul>
                        ${entry.observations.map(obs => `<li>${TextProcessor.formatDisplay(obs)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (entry.questions && entry.questions.length > 0) {
            html += `
                <div class="analysis-questions">
                    <h4>Questions to Consider</h4>
                    <ul>
                        ${entry.questions.map(q => `<li>${TextProcessor.formatDisplay(q)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (entry.potentialPathways && entry.potentialPathways.length > 0) {
            html += `
                <div class="analysis-pathways">
                    <h4>Potential Pathways</h4>
                    <ul>
                        ${entry.potentialPathways.map(p => `<li>${TextProcessor.formatDisplay(p)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        return html;
    }
    
    /**
     * Analysis placeholder when no analysis exists
     * @param {Object} entry - Log entry without analysis
     * @returns {string} - Placeholder HTML
     */
    analysisPlaceholder(entry) {
        const status = entry.analysisStatus;
        let message = '';
        let icon = '';
        
        switch (status) {
            case 'in_progress':
                icon = 'hourglass_top';
                message = 'Analysis in progress...';
                break;
            case 'failed':
                icon = 'error';
                message = 'Analysis failed. <button class="retry-analysis-btn" onclick="LogAnalysisCoordinator.retryAnalysis(\'${entry.id}\')">Retry</button>';
                break;
            default:
                icon = 'psychology_alt';
                message = 'No analysis available';
        }
        
        return `
            <div class="analysis-placeholder">
                <span class="material-symbols-outlined">${icon}</span>
                <span class="placeholder-message">${message}</span>
            </div>
        `;
    }
    
    /**
     * Entry footer with additional metadata
     * @param {Object} entry - Log entry data
     * @returns {string} - Footer HTML
     */
    entryFooter(entry) {
        return `
            <div class="log-entry-footer">
                <div class="entry-stats">
                    <span class="entry-id" title="Entry ID">${entry.id}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Tags list display
     * @param {Array} tags - Array of tags
     * @returns {string} - Tags HTML
     */
    tagsList(tags) {
        if (!tags || tags.length === 0) return '';
        
        const tagElements = tags.map(tag => 
            `<span class="entry-tag">${TextProcessor.escapeHtml(tag)}</span>`
        ).join('');
        
        return `<div class="entry-tags">${tagElements}</div>`;
    }
    
    /**
     * Get status icon based on analysis status
     * @param {string} status - Analysis status
     * @returns {string} - Icon HTML
     */
    getStatusIcon(status) {
        const icons = {
            'completed': '<span class="material-symbols-outlined status-completed">check_circle</span>',
            'in_progress': '<span class="material-symbols-outlined status-progress">hourglass_top</span>',
            'failed': '<span class="material-symbols-outlined status-failed">error</span>',
            'none': '<span class="material-symbols-outlined status-none">radio_button_unchecked</span>'
        };
        
        return icons[status] || icons['none'];
    }
    
    /**
     * Empty state template
     * @returns {string} - Empty state HTML
     */
    emptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <span class="material-symbols-outlined">auto_stories</span>
                </div>
                <h3>No entries yet</h3>
                <p>Start tracking your health journey by creating your first log entry.</p>
                <button class="btn btn-primary" onclick="document.getElementById('logText').focus()">
                    Create First Entry
                </button>
            </div>
        `;
    }
    
    /**
     * Error state template
     * @param {Error} error - Error that occurred
     * @returns {string} - Error state HTML
     */
    errorState(error) {
        return `
            <div class="error-state">
                <div class="error-state-icon">
                    <span class="material-symbols-outlined">error</span>
                </div>
                <h3>Unable to load entries</h3>
                <p>An error occurred while loading your log entries.</p>
                <div class="error-details">
                    <code>${TextProcessor.escapeHtml(error.message)}</code>
                </div>
                <button class="btn btn-secondary" onclick="window.location.reload()">
                    Reload Page
                </button>
            </div>
        `;
    }
    
    /**
     * Error entry template for individual entry failures
     * @param {Object} entry - Entry that failed to render
     * @param {Error} error - Error that occurred
     * @returns {string} - Error entry HTML
     */
    errorEntry(entry, error) {
        return `
            <div class="log-entry error-entry" data-entry-id="${entry?.id || 'unknown'}">
                <div class="error-entry-content">
                    <span class="material-symbols-outlined">warning</span>
                    <span>Failed to render entry: ${TextProcessor.escapeHtml(error.message)}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Loading state template
     * @param {string} message - Loading message
     * @returns {string} - Loading HTML
     */
    loadingState(message) {
        return `
            <div class="loading-state">
                <div class="loading-spinner">
                    <span class="material-symbols-outlined spinning">refresh</span>
                </div>
                <p>${TextProcessor.escapeHtml(message)}</p>
            </div>
        `;
    }
    
    /**
     * Date group template for grouped display
     * @param {string} dateString - Date string
     * @param {Array} entries - Entries for this date
     * @returns {string} - Date group HTML
     */
    dateGroup(dateString, entries) {
        const entriesHtml = entries.map(entry => this.logEntry(entry)).join('');
        
        return `
            <div class="date-group">
                <div class="date-group-header">
                    <h3 class="date-group-title">${dateString}</h3>
                    <span class="date-group-count">${entries.length} entries</span>
                </div>
                <div class="date-group-entries">
                    ${entriesHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * Compact entry template for lists
     * @param {Object} entry - Log entry
     * @returns {string} - Compact entry HTML
     */
    compactEntry(entry) {
        const preview = entry.preview || TextProcessor.extractPreview(entry.content, 80);
        
        return `
            <div class="compact-entry" data-entry-id="${entry.id}">
                <div class="compact-entry-header">
                    <span class="compact-timestamp">${entry.formattedTimestamp}</span>
                    ${this.getStatusIcon(entry.analysisStatus)}
                </div>
                <div class="compact-entry-content">
                    ${TextProcessor.formatDisplay(preview)}
                </div>
            </div>
        `;
    }
    
    /**
     * Entry preview template for modals
     * @param {Object} entry - Log entry
     * @returns {string} - Preview HTML
     */
    entryPreview(entry) {
        return `
            <div class="entry-preview">
                <div class="preview-header">
                    <h4>${entry.formattedTimestamp}</h4>
                    <span class="preview-word-count">${entry.wordCount} words</span>
                </div>
                <div class="preview-content">
                    ${TextProcessor.formatDisplay(entry.content)}
                </div>
                ${entry.hasAnalysis ? `
                    <div class="preview-analysis">
                        <strong>AI Analysis:</strong>
                        ${TextProcessor.formatDisplay(entry.claudeAnalysis)}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Editable entry template
     * @param {Object} entry - Log entry
     * @returns {string} - Editable HTML
     */
    editableEntry(entry) {
        return `
            <div class="editable-entry" data-entry-id="${entry.id}">
                <div class="edit-header">
                    <h4>Edit Entry</h4>
                    <span class="edit-timestamp">${entry.formattedTimestamp}</span>
                </div>
                <textarea class="edit-content" rows="6">${TextProcessor.escapeHtml(entry.content)}</textarea>
                <div class="edit-actions">
                    <button class="btn btn-primary save-edit-btn">Save</button>
                    <button class="btn btn-secondary cancel-edit-btn">Cancel</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Pagination template
     * @param {number} totalPages - Total number of pages
     * @param {number} currentPage - Current page (0-based)
     * @returns {string} - Pagination HTML
     */
    pagination(totalPages, currentPage) {
        let html = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 0) {
            html += `<button class="pagination-btn" onclick="LogManager.goToPage(${currentPage - 1})">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 0; i < totalPages; i++) {
            const isActive = i === currentPage;
            html += `<button class="pagination-btn ${isActive ? 'active' : ''}" 
                     onclick="LogManager.goToPage(${i})">${i + 1}</button>`;
        }
        
        // Next button
        if (currentPage < totalPages - 1) {
            html += `<button class="pagination-btn" onclick="LogManager.goToPage(${currentPage + 1})">Next</button>`;
        }
        
        html += '</div>';
        return html;
    }
}

// Export for use in other modules
window.LogEntryTemplates = LogEntryTemplates;