// Event Handler Module - Manages all user interactions

const EventHandler = {
    // Initialize all event listeners
    init() {
        this.setupMainButtons();
        this.setupModalButtons();
        this.setupKeyboardShortcuts();
        this.setupPWAEvents();
    },
    
    // Setup main interface buttons
    setupMainButtons() {
        // Log button
        document.getElementById('logBtn').addEventListener('click', () => {
            LogManager.createEntry();
        });
        
        // View button
        document.getElementById('viewBtn').addEventListener('click', () => {
            LogManager.showLogModal();
        });
    },
    
    // Setup modal action buttons
    setupModalButtons() {
        // Close modal
        document.getElementById('closeBtn').addEventListener('click', () => {
            LogManager.closeLogModal();
        });
        
        // Copy as markdown
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyAsMarkdown();
        });
        
        // Copy as JSON
        document.getElementById('codeBtn').addEventListener('click', () => {
            this.copyAsJSON();
        });
        
        // Email log
        document.getElementById('emailBtn').addEventListener('click', () => {
            this.emailLog();
        });
        
        // Toggle markdown view
        document.getElementById('viewMarkdownBtn').addEventListener('click', () => {
            LogManager.toggleView('markdown');
        });
        
        // Toggle summary view
        document.getElementById('summaryBtn').addEventListener('click', () => {
            LogManager.toggleView('summary');
        });
    },
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modal
                LogManager.closeLogModal();
                
                // Also close health modal if open
                if (UI.elements.healthModal.style.display === 'block') {
                    UI.elements.healthModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }
        });
    },
    
    // Setup PWA-specific events
    setupPWAEvents() {
        // Install button removed
        
        // Online/offline events
        window.addEventListener('online', () => {
            PWAManager.updateOnlineStatus(true);
        });
        
        window.addEventListener('offline', () => {
            PWAManager.updateOnlineStatus(false);
        });
    },
    
    // Copy as markdown
    copyAsMarkdown() {
        const markdown = UI.generateMarkdown(LogManager.getEntries());
        this.copyToClipboard(markdown, 'Markdown copied!');
        
        // Update button
        const btn = document.getElementById('copyBtn');
        this.animateButton(btn, 'check', 'content_copy', 'C');
    },
    
    // Copy as JSON
    copyAsJSON() {
        const logData = JSON.stringify(LogManager.getEntries(), null, 2);
        this.copyToClipboard(logData, 'JSON copied!');
        
        // Update button
        const btn = document.getElementById('codeBtn');
        this.animateButton(btn, 'check', 'code', '{}');
    },
    
    // Email log
    emailLog() {
        const markdown = UI.generateMarkdown(LogManager.getEntries());
        const subject = encodeURIComponent('My HealthIQ Log Entries');
        const body = encodeURIComponent(`Here are my HealthIQ log entries:\n\n${markdown}`);
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoUrl;
        
        // Update button
        const btn = document.getElementById('emailBtn');
        this.animateButton(btn, 'check', 'mail', '@');
    },
    
    // Copy to clipboard utility
    copyToClipboard(text, successMessage) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                UI.showToast(successMessage);
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
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
        UI.showToast('Copied!');
    },
    
    // Animate button after action
    animateButton(btn, tempIcon, originalIcon, iconText) {
        btn.innerHTML = `<span class="material-symbols-outlined">${tempIcon}</span><span class="icon-text">✓</span>`;
        
        setTimeout(() => {
            btn.innerHTML = `<span class="material-symbols-outlined">${originalIcon}</span><span class="icon-text">${iconText}</span>`;
        }, 2000);
    }
};

// Export for use in other modules
window.EventHandler = EventHandler;