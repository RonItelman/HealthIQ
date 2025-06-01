// Export Utilities - Handles data export in various formats

class ExportHelper {
    /**
     * Export data as JSON file download
     * @param {Object} data - Data to export
     * @param {string} filename - Filename (without extension)
     */
    static downloadJSON(data, filename = 'dots-export') {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const timestamp = DateFormatter.formatExportFilename();
            const fullFilename = `${filename}_${timestamp}.json`;
            
            this.downloadBlob(blob, fullFilename);
            
            if (window.DebugStore) {
                DebugStore.success('JSON export completed', {
                    filename: fullFilename,
                    dataSize: jsonString.length
                }, 'EXPORT');
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('JSON export failed', {
                    error: error.message,
                    filename: filename
                }, 'EXPORT');
            }
            throw error;
        }
    }
    
    /**
     * Export log entries as markdown
     * @param {Array} entries - Log entries to export
     * @param {string} filename - Filename (without extension)
     */
    static downloadMarkdown(entries, filename = 'dots-logs') {
        try {
            const markdownContent = this.generateMarkdown(entries);
            const blob = new Blob([markdownContent], { type: 'text/markdown' });
            
            const timestamp = DateFormatter.formatExportFilename();
            const fullFilename = `${filename}_${timestamp}.md`;
            
            this.downloadBlob(blob, fullFilename);
            
            if (window.DebugStore) {
                DebugStore.success('Markdown export completed', {
                    filename: fullFilename,
                    entryCount: entries.length,
                    contentSize: markdownContent.length
                }, 'EXPORT');
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Markdown export failed', {
                    error: error.message,
                    entryCount: entries?.length || 0
                }, 'EXPORT');
            }
            throw error;
        }
    }
    
    /**
     * Copy data to clipboard as JSON
     * @param {Object} data - Data to copy
     * @returns {Promise<boolean>} - Success status
     */
    static async copyJSON(data) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            await navigator.clipboard.writeText(jsonString);
            
            if (window.DebugStore) {
                DebugStore.success('JSON copied to clipboard', {
                    dataSize: jsonString.length
                }, 'EXPORT');
            }
            
            return true;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to copy JSON to clipboard', {
                    error: error.message
                }, 'EXPORT');
            }
            return false;
        }
    }
    
    /**
     * Copy log entries as markdown to clipboard
     * @param {Array} entries - Log entries to copy
     * @returns {Promise<boolean>} - Success status
     */
    static async copyMarkdown(entries) {
        try {
            const markdownContent = this.generateMarkdown(entries);
            await navigator.clipboard.writeText(markdownContent);
            
            if (window.DebugStore) {
                DebugStore.success('Markdown copied to clipboard', {
                    entryCount: entries.length,
                    contentSize: markdownContent.length
                }, 'EXPORT');
            }
            
            return true;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to copy markdown to clipboard', {
                    error: error.message,
                    entryCount: entries?.length || 0
                }, 'EXPORT');
            }
            return false;
        }
    }
    
    /**
     * Generate markdown content from log entries
     * @param {Array} entries - Log entries to convert
     * @returns {string} - Markdown content
     */
    static generateMarkdown(entries) {
        if (!entries || !Array.isArray(entries)) {
            return '# Health Log Export\n\nNo entries found.';
        }
        
        let markdown = `# Health Log Export\n\n`;
        markdown += `Generated on ${DateFormatter.formatMarkdownDate(new Date())}\n\n`;
        markdown += `Total entries: ${entries.length}\n\n---\n\n`;
        
        // Group entries by date
        const entriesByDate = this.groupEntriesByDate(entries);
        
        for (const [dateString, dayEntries] of Object.entries(entriesByDate)) {
            markdown += `## ${dateString}\n\n`;
            
            for (const entry of dayEntries) {
                markdown += this.formatEntryAsMarkdown(entry);
                markdown += '\n---\n\n';
            }
        }
        
        return markdown;
    }
    
    /**
     * Group entries by date for organized export
     * @param {Array} entries - Log entries to group
     * @returns {Object} - Entries grouped by date string
     */
    static groupEntriesByDate(entries) {
        const groups = {};
        
        for (const entry of entries) {
            const dateString = DateFormatter.formatMarkdownDate(entry.timestamp);
            if (!groups[dateString]) {
                groups[dateString] = [];
            }
            groups[dateString].push(entry);
        }
        
        return groups;
    }
    
    /**
     * Format single entry as markdown
     * @param {Object} entry - Log entry to format
     * @returns {string} - Markdown formatted entry
     */
    static formatEntryAsMarkdown(entry) {
        let markdown = `### ${DateFormatter.formatDateTime(entry.timestamp)}\n\n`;
        
        // User content
        markdown += `${TextProcessor.toMarkdown(entry.content)}\n\n`;
        
        // Health context if available
        if (entry.healthContext && entry.healthContext.trim()) {
            markdown += `**Health Context:** ${TextProcessor.toMarkdown(entry.healthContext)}\n\n`;
        }
        
        // Analysis if available
        if (entry.claudeAnalysis && entry.claudeAnalysis.trim()) {
            markdown += `**AI Analysis:**\n\n${TextProcessor.toMarkdown(entry.claudeAnalysis)}\n\n`;
        }
        
        // Tags if available
        if (entry.tags && entry.tags.length > 0) {
            markdown += `**Tags:** ${entry.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
        }
        
        return markdown;
    }
    
    /**
     * Download blob as file
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Filename for download
     */
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        
        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            URL.revokeObjectURL(url);
        }
    }
    
    /**
     * Import JSON data from file
     * @param {File} file - File to import
     * @returns {Promise<Object>} - Imported data
     */
    static async importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (window.DebugStore) {
                        DebugStore.success('JSON import completed', {
                            filename: file.name,
                            dataSize: event.target.result.length
                        }, 'EXPORT');
                    }
                    
                    resolve(data);
                } catch (error) {
                    if (window.DebugStore) {
                        DebugStore.error('JSON import failed', {
                            error: error.message,
                            filename: file.name
                        }, 'EXPORT');
                    }
                    reject(new Error(`Invalid JSON file: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                const error = new Error('Failed to read file');
                if (window.DebugStore) {
                    DebugStore.error('File read failed', {
                        error: error.message,
                        filename: file.name
                    }, 'EXPORT');
                }
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }
}

// Export for use in other modules
window.ExportHelper = ExportHelper;