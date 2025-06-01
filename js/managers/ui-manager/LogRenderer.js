// LogRenderer - Specialized renderer for log entry display

class LogRenderer {
    constructor() {
        this.templates = new LogEntryTemplates();
        
        if (window.DebugStore) {
            DebugStore.debug('LogRenderer initialized', {}, 'LOGRENDERER');
        }
    }
    
    /**
     * Render array of log entries
     * @param {Array} entries - Log entries to render
     * @returns {string} - Rendered HTML
     */
    render(entries) {
        const timer = window.DebugStore ? DebugStore.startTimer('renderLogEntries') : null;
        
        if (window.DebugStore) {
            DebugStore.debug('Rendering log entries', {
                entryCount: entries.length
            }, 'LOGRENDERER');
        }
        
        try {
            if (!entries || entries.length === 0) {
                return this.renderEmptyState();
            }
            
            const renderedEntries = entries.map(entry => 
                this.renderEntry(entry)
            ).join('');
            
            const html = this.wrapInContainer(renderedEntries, entries.length);
            
            timer?.end();
            
            if (window.DebugStore) {
                DebugStore.success('Log entries rendered', {
                    entryCount: entries.length,
                    renderTime: timer ? `${timer.end()}ms` : 'unknown'
                }, 'LOGRENDERER');
            }
            
            return html;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to render log entries', {
                    error: error.message,
                    entryCount: entries?.length || 0
                }, 'LOGRENDERER');
            }
            return this.renderErrorState(error);
        }
    }
    
    /**
     * Render a single log entry
     * @param {Object} entry - Log entry to render
     * @returns {string} - Rendered HTML
     */
    renderEntry(entry) {
        try {
            return this.templates.logEntry(entry);
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.warn('Failed to render individual entry', {
                    entryId: entry?.id,
                    error: error.message
                }, 'LOGRENDERER');
            }
            return this.templates.errorEntry(entry, error);
        }
    }
    
    /**
     * Render empty state when no entries exist
     * @returns {string} - Empty state HTML
     */
    renderEmptyState() {
        return this.templates.emptyState();
    }
    
    /**
     * Render error state when rendering fails
     * @param {Error} error - Error that occurred
     * @returns {string} - Error state HTML
     */
    renderErrorState(error) {
        return this.templates.errorState(error);
    }
    
    /**
     * Wrap rendered entries in container
     * @param {string} entriesHtml - Rendered entries HTML
     * @param {number} count - Number of entries
     * @returns {string} - Wrapped HTML
     */
    wrapInContainer(entriesHtml, count) {
        return `
            <div class="log-entries-container" data-entry-count="${count}">
                <div class="log-entries-header">
                    <span class="entry-count">${count} ${count === 1 ? 'entry' : 'entries'}</span>
                </div>
                <div class="log-entries-list">
                    ${entriesHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * Render entries with pagination
     * @param {Array} entries - All entries
     * @param {number} page - Current page (0-based)
     * @param {number} pageSize - Entries per page
     * @returns {string} - Rendered HTML with pagination
     */
    renderPaginated(entries, page = 0, pageSize = 20) {
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const pageEntries = entries.slice(startIndex, endIndex);
        
        const entriesHtml = this.render(pageEntries);
        const paginationHtml = this.renderPagination(entries.length, page, pageSize);
        
        return `
            ${entriesHtml}
            ${paginationHtml}
        `;
    }
    
    /**
     * Render pagination controls
     * @param {number} totalEntries - Total number of entries
     * @param {number} currentPage - Current page (0-based)
     * @param {number} pageSize - Entries per page
     * @returns {string} - Pagination HTML
     */
    renderPagination(totalEntries, currentPage, pageSize) {
        const totalPages = Math.ceil(totalEntries / pageSize);
        
        if (totalPages <= 1) return '';
        
        return this.templates.pagination(totalPages, currentPage);
    }
    
    /**
     * Render entries grouped by date
     * @param {Array} entries - Log entries to render
     * @returns {string} - Rendered HTML with date grouping
     */
    renderGroupedByDate(entries) {
        const groupedEntries = this.groupEntriesByDate(entries);
        
        let html = '';
        for (const [dateString, dayEntries] of Object.entries(groupedEntries)) {
            html += this.templates.dateGroup(dateString, dayEntries);
        }
        
        return this.wrapInContainer(html, entries.length);
    }
    
    /**
     * Group entries by date
     * @param {Array} entries - Entries to group
     * @returns {Object} - Entries grouped by date string
     */
    groupEntriesByDate(entries) {
        const groups = {};
        
        entries.forEach(entry => {
            const dateString = DateFormatter.formatDate(entry.timestamp);
            if (!groups[dateString]) {
                groups[dateString] = [];
            }
            groups[dateString].push(entry);
        });
        
        return groups;
    }
    
    /**
     * Render entries with search highlighting
     * @param {Array} entries - Log entries
     * @param {string} searchTerm - Term to highlight
     * @returns {string} - Rendered HTML with highlighting
     */
    renderWithHighlighting(entries, searchTerm) {
        if (!searchTerm) return this.render(entries);
        
        const highlightedEntries = entries.map(entry => ({
            ...entry,
            highlightedContent: TextProcessor.highlightSearch(entry.content, searchTerm),
            highlightedAnalysis: TextProcessor.highlightSearch(entry.claudeAnalysis || '', searchTerm)
        }));
        
        return this.render(highlightedEntries);
    }
    
    /**
     * Render entry preview for modal or popup
     * @param {Object} entry - Log entry
     * @returns {string} - Preview HTML
     */
    renderEntryPreview(entry) {
        return this.templates.entryPreview(entry);
    }
    
    /**
     * Render entry for editing
     * @param {Object} entry - Log entry
     * @returns {string} - Editable entry HTML
     */
    renderEditableEntry(entry) {
        return this.templates.editableEntry(entry);
    }
    
    /**
     * Render compact entry list (for sidebar, etc.)
     * @param {Array} entries - Log entries
     * @param {number} maxEntries - Maximum entries to show
     * @returns {string} - Compact list HTML
     */
    renderCompactList(entries, maxEntries = 5) {
        const limitedEntries = entries.slice(0, maxEntries);
        
        const listItems = limitedEntries.map(entry => 
            this.templates.compactEntry(entry)
        ).join('');
        
        return `
            <div class="compact-log-list">
                ${listItems}
                ${entries.length > maxEntries ? 
                    `<div class="compact-list-more">
                        +${entries.length - maxEntries} more entries
                     </div>` : ''
                }
            </div>
        `;
    }
    
    /**
     * Render loading state
     * @param {string} message - Loading message
     * @returns {string} - Loading state HTML
     */
    renderLoadingState(message = 'Loading entries...') {
        return this.templates.loadingState(message);
    }
    
    /**
     * Update existing rendered entry in DOM
     * @param {string} entryId - Entry ID to update
     * @param {Object} updatedEntry - Updated entry data
     */
    updateRenderedEntry(entryId, updatedEntry) {
        const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (entryElement) {
            const newHtml = this.renderEntry(updatedEntry);
            entryElement.outerHTML = newHtml;
            
            if (window.DebugStore) {
                DebugStore.debug('Entry updated in DOM', { entryId }, 'LOGRENDERER');
            }
        }
    }
    
    /**
     * Remove rendered entry from DOM
     * @param {string} entryId - Entry ID to remove
     */
    removeRenderedEntry(entryId) {
        const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (entryElement) {
            entryElement.remove();
            
            if (window.DebugStore) {
                DebugStore.debug('Entry removed from DOM', { entryId }, 'LOGRENDERER');
            }
        }
    }
    
    /**
     * Add rendered entry to DOM
     * @param {Object} entry - Entry to add
     * @param {string} position - Position to add ('top' or 'bottom')
     */
    addRenderedEntry(entry, position = 'top') {
        const container = document.querySelector('.log-entries-list');
        if (container) {
            const entryHtml = this.renderEntry(entry);
            
            if (position === 'top') {
                container.insertAdjacentHTML('afterbegin', entryHtml);
            } else {
                container.insertAdjacentHTML('beforeend', entryHtml);
            }
            
            if (window.DebugStore) {
                DebugStore.debug('Entry added to DOM', { 
                    entryId: entry.id, 
                    position 
                }, 'LOGRENDERER');
            }
        }
    }
}

// Export for use in other modules
window.LogRenderer = LogRenderer;