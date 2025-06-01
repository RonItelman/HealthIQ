// Debug Modal - UI for viewing and managing debug logs

const DebugModal = {
    // Initialize debug modal
    init() {
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Close debug modal
        document.getElementById('debugCloseBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Refresh debug log
        document.getElementById('refreshDebugBtn').addEventListener('click', () => {
            this.renderDebugLog();
        });
        
        // Export debug log
        document.getElementById('exportDebugBtn').addEventListener('click', () => {
            this.exportDebugLog();
        });
        
        // Copy debug log
        document.getElementById('copyDebugBtn').addEventListener('click', () => {
            this.copyDebugLog();
        });
        
        // Clear debug log
        document.getElementById('clearDebugBtn').addEventListener('click', () => {
            this.clearDebugLog();
        });
        
        // Filter event listeners
        document.getElementById('debugLevelFilter').addEventListener('change', () => {
            this.renderDebugLog();
        });
        
        document.getElementById('debugSourceFilter').addEventListener('change', () => {
            this.renderDebugLog();
        });
        
        document.getElementById('debugSearchFilter').addEventListener('input', () => {
            this.renderDebugLog();
        });
        
        // Click outside modal to close
        document.getElementById('debugModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('debugModal')) {
                this.closeModal();
            }
        });
    },
    
    // Show debug modal
    showModal() {
        document.getElementById('debugModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.renderDebugLog();
        this.renderStats();
    },
    
    // Close debug modal
    closeModal() {
        document.getElementById('debugModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },
    
    // Get current filter values
    getFilters() {
        return {
            level: document.getElementById('debugLevelFilter').value,
            source: document.getElementById('debugSourceFilter').value,
            message: document.getElementById('debugSearchFilter').value
        };
    },
    
    // Render debug log with current filters
    renderDebugLog() {
        const filters = this.getFilters();
        const logs = DebugStore.getLogs(filters);
        const content = document.getElementById('debugLogContent');
        
        if (logs.length === 0) {
            content.innerHTML = '<div class="debug-log-entry debug-empty">No debug logs match the current filters.</div>';
            return;
        }
        
        const logHtml = logs.map(entry => {
            const timeStr = new Date(entry.timestamp).toLocaleTimeString();
            const levelClass = entry.level.toLowerCase();
            
            return `
                <div class="debug-log-entry ${levelClass}" data-level="${entry.level}" data-source="${entry.source}">
                    <div class="debug-log-header">
                        <span class="debug-log-timestamp">[${timeStr}]</span>
                        <span class="debug-log-level level-${levelClass}">${entry.level}</span>
                        <span class="debug-log-source">${entry.source}</span>
                    </div>
                    <div class="debug-log-message">${this.escapeHtml(entry.message)}</div>
                    ${entry.data && Object.keys(entry.data).length > 0 ? 
                        `<div class="debug-log-data">
                            <details>
                                <summary>Data</summary>
                                <pre>${this.escapeHtml(JSON.stringify(entry.data, null, 2))}</pre>
                            </details>
                        </div>` : ''}
                    ${entry.stack ? 
                        `<div class="debug-log-stack">
                            <details>
                                <summary>Stack Trace</summary>
                                <pre>${this.escapeHtml(entry.stack)}</pre>
                            </details>
                        </div>` : ''}
                </div>
            `;
        }).join('');
        
        content.innerHTML = logHtml;
        
        // Scroll to top to show latest logs
        content.scrollTop = 0;
    },
    
    // Render debug statistics
    renderStats() {
        const stats = DebugStore.getStats();
        const statsContainer = document.getElementById('debugStats');
        
        const errorCount = stats.levelCounts.ERROR || 0;
        const warnCount = stats.levelCounts.WARN || 0;
        
        statsContainer.innerHTML = `
            <div class="debug-stat">
                <span class="debug-stat-label">Total Logs:</span>
                <span class="debug-stat-value">${stats.totalLogs}</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Errors:</span>
                <span class="debug-stat-value error">${errorCount}</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Warnings:</span>
                <span class="debug-stat-value warn">${warnCount}</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Session:</span>
                <span class="debug-stat-value">${stats.currentSession.substring(0, 8)}...</span>
            </div>
        `;
    },
    
    // Export debug log
    exportDebugLog() {
        try {
            const filters = this.getFilters();
            const logs = DebugStore.getLogs(filters);
            const exportData = DebugStore.exportLogs();
            
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-log-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            UI.showToast('Debug log exported successfully');
            this.animateButton('exportDebugBtn');
            
        } catch (error) {
            DebugStore.error('Failed to export debug log', { error: error.message }, 'DEBUGMODAL');
            UI.showToast('Failed to export debug log');
        }
    },
    
    // Copy debug log to clipboard
    copyDebugLog() {
        try {
            const filters = this.getFilters();
            const logs = DebugStore.getLogs(filters);
            
            if (logs.length === 0) {
                UI.showToast('No debug logs to copy');
                return;
            }
            
            const logText = logs.map(entry => {
                const timeStr = new Date(entry.timestamp).toLocaleTimeString();
                let text = `[${timeStr}] ${entry.level} (${entry.source}): ${entry.message}`;
                
                if (entry.data && Object.keys(entry.data).length > 0) {
                    text += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
                }
                
                if (entry.stack) {
                    text += `\nStack: ${entry.stack}`;
                }
                
                return text;
            }).join('\n\n');
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(logText).then(() => {
                    UI.showToast('Debug log copied to clipboard');
                    this.animateButton('copyDebugBtn');
                }).catch(() => {
                    this.fallbackCopy(logText);
                });
            } else {
                this.fallbackCopy(logText);
            }
            
        } catch (error) {
            DebugStore.error('Failed to copy debug log', { error: error.message }, 'DEBUGMODAL');
            UI.showToast('Failed to copy debug log');
        }
    },
    
    // Fallback copy method
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        UI.showToast('Debug log copied to clipboard');
        this.animateButton('copyDebugBtn');
    },
    
    // Clear debug log
    clearDebugLog() {
        const totalLogs = DebugStore.getStats().totalLogs;
        
        if (totalLogs === 0) {
            UI.showToast('No debug logs to clear');
            return;
        }
        
        const confirmMessage = `Are you sure you want to clear all ${totalLogs} debug logs? This action cannot be undone.`;
        
        if (confirm(confirmMessage)) {
            DebugStore.clearLogs();
            this.renderDebugLog();
            this.renderStats();
            UI.showToast('Debug log cleared successfully');
            this.animateButton('clearDebugBtn');
        }
    },
    
    // Animate button after action
    animateButton(btnId) {
        const btn = document.getElementById(btnId);
        const iconElement = btn.querySelector('.material-symbols-outlined');
        const originalIcon = iconElement.textContent;
        
        iconElement.textContent = 'check';
        setTimeout(() => {
            iconElement.textContent = originalIcon;
        }, 2000);
    },
    
    // Escape HTML for safe display
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Check for recent errors and show notification
    checkForRecentErrors() {
        const recentErrors = DebugStore.getRecentErrors(5);
        if (recentErrors.length > 0) {
            console.warn(`${recentErrors.length} recent errors detected. Check Debug Log for details.`);
        }
    }
};

// Export for use in other modules
window.DebugModal = DebugModal;