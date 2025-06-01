// Debug Logger Module - Captures console logs for mobile debugging

const DebugLogger = {
    logs: [],
    maxLogs: 100,
    originalConsole: {},
    
    // Initialize debug logger
    init() {
        this.captureConsoleMethods();
        this.setupEventListeners();
    },
    
    // Capture console methods
    captureConsoleMethods() {
        const methods = ['log', 'error', 'warn', 'info'];
        
        methods.forEach(method => {
            this.originalConsole[method] = console[method];
            console[method] = (...args) => {
                // Call original console method
                this.originalConsole[method](...args);
                
                // Capture for debug log
                this.addLogEntry(method, args);
            };
        });
    },
    
    // Add log entry
    addLogEntry(level, args) {
        const timestamp = new Date().toISOString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return String(arg);
        }).join(' ');
        
        const entry = {
            timestamp,
            level,
            message
        };
        
        this.logs.unshift(entry);
        
        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Debug button click
        document.getElementById('debugBtn').addEventListener('click', () => {
            this.showDebugModal();
        });
        
        // Close debug modal
        document.getElementById('debugCloseBtn').addEventListener('click', () => {
            this.closeDebugModal();
        });
        
        // Copy debug log
        document.getElementById('copyDebugBtn').addEventListener('click', () => {
            this.copyDebugLog();
        });
        
        // Clear debug log
        document.getElementById('clearDebugBtn').addEventListener('click', () => {
            this.clearDebugLog();
        });
        
        // Click outside modal to close
        document.getElementById('debugModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('debugModal')) {
                this.closeDebugModal();
            }
        });
    },
    
    // Show debug modal
    showDebugModal() {
        document.getElementById('debugModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.renderDebugLog();
    },
    
    // Close debug modal
    closeDebugModal() {
        document.getElementById('debugModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },
    
    // Render debug log
    renderDebugLog() {
        const content = document.getElementById('debugLogContent');
        
        if (this.logs.length === 0) {
            content.innerHTML = '<div class="debug-log-entry">No debug logs captured yet.</div>';
            return;
        }
        
        const logHtml = this.logs.map(entry => {
            const timeStr = new Date(entry.timestamp).toLocaleTimeString();
            return `<div class="debug-log-entry ${entry.level}">
                <span class="debug-log-timestamp">[${timeStr}]</span> 
                <strong>${entry.level.toUpperCase()}:</strong> ${this.escapeHtml(entry.message)}
            </div>`;
        }).join('');
        
        content.innerHTML = logHtml;
        
        // Scroll to top to show latest logs
        content.scrollTop = 0;
    },
    
    // Copy debug log to clipboard
    copyDebugLog() {
        if (this.logs.length === 0) {
            UI.showToast('No debug logs to copy');
            return;
        }
        
        const logText = this.logs.map(entry => {
            const timeStr = new Date(entry.timestamp).toLocaleTimeString();
            return `[${timeStr}] ${entry.level.toUpperCase()}: ${entry.message}`;
        }).join('\n');
        
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
        this.logs = [];
        this.renderDebugLog();
        UI.showToast('Debug log cleared');
        this.animateButton('clearDebugBtn');
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
    
    // Get logs for external use
    getLogs() {
        return [...this.logs];
    },
    
    // Add custom log entry (for app-specific logging)
    addCustomLog(level, message) {
        this.addLogEntry(level, [message]);
    }
};

// Export for use in other modules
window.DebugLogger = DebugLogger;