// Main Application Module

const App = {
    // Application state
    logEntries: [],
    currentView: 'entries', // 'entries', 'markdown', 'summary'
    deferredPrompt: null,
    isOffline: false,
    
    // Initialize application
    init() {
        // Initialize UI
        UI.init();
        
        // Load data
        this.loadData();
        
        // Initialize health module
        Health.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
        
        // Hide loading screen
        UI.hideLoadingScreen();
        
        // Register service worker
        this.registerServiceWorker();
        
        // Handle install prompt
        this.handleInstallPrompt();
        
        // Check online status
        this.checkOnlineStatus();
    },
    
    // Load data from storage
    loadData() {
        this.logEntries = Storage.loadLogEntries();
    },
    
    // Save data to storage
    saveData() {
        Storage.saveLogEntries(this.logEntries);
    },
    
    // Update UI
    updateUI() {
        UI.updateStats(this.logEntries);
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Log button
        document.getElementById('logBtn').addEventListener('click', () => {
            this.logEntry();
        });
        
        // View button
        document.getElementById('viewBtn').addEventListener('click', () => {
            this.showLogModal();
        });
        
        // Modal buttons
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.closeLogModal();
        });
        
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyAsMarkdown();
        });
        
        document.getElementById('codeBtn').addEventListener('click', () => {
            this.copyAsJSON();
        });
        
        document.getElementById('emailBtn').addEventListener('click', () => {
            this.emailLog();
        });
        
        document.getElementById('viewMarkdownBtn').addEventListener('click', () => {
            this.toggleMarkdownView();
        });
        
        document.getElementById('summaryBtn').addEventListener('click', () => {
            this.toggleSummaryView();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeLogModal();
                if (UI.elements.healthModal.style.display === 'block') {
                    UI.elements.healthModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }
        });
        
        // Install button
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.installPWA();
            });
        }
    },
    
    // Log new entry
    async logEntry() {
        const content = UI.elements.logText.value.trim();
        
        if (!content) {
            UI.showToast('Please enter some text to log');
            return;
        }
        
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: content,
            analysis: null
        };
        
        // Add to beginning of array
        this.logEntries.unshift(entry);
        
        // Save immediately
        this.saveData();
        
        // Clear input
        UI.elements.logText.value = '';
        
        // Update UI
        this.updateUI();
        
        // Show success
        UI.showToast('Entry logged successfully!');
        
        // Analyze if health issues are set
        if (Health.healthIssues.claudeAnalysis && !this.isOffline) {
            this.analyzeEntryInBackground(entry);
        }
    },
    
    // Analyze entry in background
    async analyzeEntryInBackground(entry) {
        try {
            const analysis = await Health.analyzeLogEntry(entry);
            if (analysis) {
                // Update the entry
                const entryIndex = this.logEntries.findIndex(e => e.id === entry.id);
                if (entryIndex !== -1) {
                    this.logEntries[entryIndex].analysis = analysis;
                    this.saveData();
                }
            }
        } catch (error) {
            console.error('Background analysis failed:', error);
        }
    },
    
    // Show log modal
    showLogModal() {
        UI.elements.logModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Render based on current view
        this.renderCurrentView();
        
        // Celebrate if entries exist
        if (this.logEntries.length > 0) {
            UI.celebrateViewButton();
        }
    },
    
    // Close log modal
    closeLogModal() {
        UI.elements.logModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    },
    
    // Render current view
    renderCurrentView() {
        switch (this.currentView) {
            case 'markdown':
                UI.renderMarkdown(this.logEntries);
                break;
            case 'summary':
                UI.renderSummary(this.logEntries);
                break;
            default:
                UI.renderLogEntries(this.logEntries, Health.healthIssues);
        }
    },
    
    // Toggle markdown view
    toggleMarkdownView() {
        if (this.currentView === 'markdown') {
            this.currentView = 'entries';
        } else {
            this.currentView = 'markdown';
        }
        
        this.renderCurrentView();
        
        // Update button icon
        const btn = document.getElementById('viewMarkdownBtn');
        btn.innerHTML = '<span class="material-symbols-outlined">check</span><span class="icon-text">✓</span>';
        
        setTimeout(() => {
            if (this.currentView === 'markdown') {
                btn.innerHTML = '<span class="material-symbols-outlined">list</span><span class="icon-text">≡</span>';
            } else {
                btn.innerHTML = '<span class="material-symbols-outlined">description</span><span class="icon-text">Σ</span>';
            }
        }, 2000);
    },
    
    // Toggle summary view
    toggleSummaryView() {
        if (this.currentView === 'summary') {
            this.currentView = 'entries';
        } else {
            this.currentView = 'summary';
        }
        
        this.renderCurrentView();
        
        // Update button icon
        const btn = document.getElementById('summaryBtn');
        btn.innerHTML = '<span class="material-symbols-outlined">check</span><span class="icon-text">✓</span>';
        
        setTimeout(() => {
            if (this.currentView === 'summary') {
                btn.innerHTML = '<span class="material-symbols-outlined">list</span><span class="icon-text">≡</span>';
            } else {
                btn.innerHTML = '<span class="material-symbols-outlined">analytics</span><span class="icon-text">☯</span>';
            }
        }, 2000);
    },
    
    // Copy as markdown
    copyAsMarkdown() {
        const markdown = UI.generateMarkdown(this.logEntries);
        this.copyToClipboard(markdown, 'Markdown copied!');
        
        // Update button
        const btn = document.getElementById('copyBtn');
        btn.innerHTML = '<span class="material-symbols-outlined">check</span><span class="icon-text">✓</span>';
        
        setTimeout(() => {
            btn.innerHTML = '<span class="material-symbols-outlined">content_copy</span><span class="icon-text">C</span>';
        }, 2000);
    },
    
    // Copy as JSON
    copyAsJSON() {
        const logData = JSON.stringify(this.logEntries, null, 2);
        this.copyToClipboard(logData, 'JSON copied!');
        
        // Update button
        const btn = document.getElementById('codeBtn');
        btn.innerHTML = '<span class="material-symbols-outlined">check</span><span class="icon-text">✓</span>';
        
        setTimeout(() => {
            btn.innerHTML = '<span class="material-symbols-outlined">code</span><span class="icon-text">{}</span>';
        }, 2000);
    },
    
    // Email log
    emailLog() {
        const markdown = UI.generateMarkdown(this.logEntries);
        const subject = encodeURIComponent('My HealthIQ Log Entries');
        const body = encodeURIComponent(`Here are my HealthIQ log entries:\n\n${markdown}`);
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoUrl;
        
        // Update button
        const btn = document.getElementById('emailBtn');
        btn.innerHTML = '<span class="material-symbols-outlined">check</span><span class="icon-text">✓</span>';
        
        setTimeout(() => {
            btn.innerHTML = '<span class="material-symbols-outlined">mail</span><span class="icon-text">@</span>';
        }, 2000);
    },
    
    // Copy to clipboard
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
    
    // Register service worker
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('SW registered'))
                .catch(() => console.log('SW registration failed'));
        }
    },
    
    // Handle install prompt
    handleInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            const banner = document.getElementById('installBanner');
            if (banner) {
                banner.style.display = 'flex';
            }
        });
    },
    
    // Install PWA
    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                this.deferredPrompt = null;
                
                const banner = document.getElementById('installBanner');
                if (banner) {
                    banner.style.display = 'none';
                }
            });
        }
    },
    
    // Check online status
    checkOnlineStatus() {
        this.isOffline = !navigator.onLine;
        
        if (this.isOffline) {
            document.body.classList.add('offline');
        }
        
        window.addEventListener('online', () => {
            this.isOffline = false;
            document.body.classList.remove('offline');
            UI.showToast('Back online!');
        });
        
        window.addEventListener('offline', () => {
            this.isOffline = true;
            document.body.classList.add('offline');
            UI.showToast('Offline mode - AI features unavailable');
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for debugging
window.App = App;