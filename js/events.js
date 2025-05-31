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
        
        // Think button
        document.getElementById('thinkBtn').addEventListener('click', () => {
            this.showThinkView();
        });
    },
    
    // Setup modal action buttons
    setupModalButtons() {
        // Close modal
        document.getElementById('closeBtn').addEventListener('click', () => {
            LogManager.closeLogModal();
            // Clear Think context if it exists
            if (this.thinkContext) {
                this.clearThinkContext();
            }
        });
        
        // Copy as markdown
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyAsMarkdown();
        });
        
        // Toggle summary view (now Analysis)
        document.getElementById('summaryBtn').addEventListener('click', () => {
            LogManager.toggleView('summary');
        });
        
        // Clear logs button
        document.getElementById('clearLogsBtn').addEventListener('click', () => {
            this.handleClearLogs();
        });
        
        // Copy JSON data button
        document.getElementById('dataBtn').addEventListener('click', () => {
            this.copyJSONData();
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
        this.animateButton(btn, 'check', 'content_copy', 'Copy');
    },
    
    // Copy JSON data
    copyJSONData() {
        const entries = LogManager.getEntries();
        const jsonData = JSON.stringify(entries, null, 2);
        this.copyToClipboard(jsonData, 'JSON data copied!');
        
        // Update button
        const btn = document.getElementById('dataBtn');
        this.animateButton(btn, 'check', 'code', 'Data');
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
    animateButton(btn, tempIcon, originalIcon, buttonText) {
        const iconElement = btn.querySelector('.material-symbols-outlined');
        const originalIconText = iconElement.textContent;
        iconElement.textContent = tempIcon;
        
        setTimeout(() => {
            iconElement.textContent = originalIconText;
        }, 2000);
    },
    
    // Handle clear logs with confirmation
    handleClearLogs() {
        const totalEntries = LogManager.getEntries().length;
        
        if (totalEntries === 0) {
            UI.showToast('No logs to clear');
            return;
        }
        
        const confirmMessage = `Are you sure you want to permanently delete all ${totalEntries} log entries? This action cannot be undone.`;
        
        if (confirm(confirmMessage)) {
            LogManager.clearAllEntries();
            UI.showToast('All logs cleared successfully');
            
            // Animate button
            const btn = document.getElementById('clearLogsBtn');
            this.animateButton(btn, 'check', 'delete_sweep', 'Clear');
        }
    },
    
    // Show Think view
    async showThinkView() {
        // Get all log entries
        const entries = LogManager.getEntries();
        
        if (entries.length === 0) {
            UI.showToast('No log entries to analyze');
            return;
        }
        
        // Categorize entries if needed
        if (window.HealthCategorizer.needsRecategorization(entries)) {
            window.HealthCategorizer.categorizeEntries(entries);
        }
        
        // Get categorized data for analysis
        const categorizedData = window.HealthCategorizer.exportForAnalysis();
        
        // Show in modal
        UI.elements.logModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Display loading state
        UI.renderThinkView({ loading: true });
        
        try {
            // Send to Claude for analysis
            const analysis = await this.getThinkAnalysis(categorizedData);
            
            // Initialize context with the analysis
            this.thinkContext = [
                { role: 'system', content: `You are analyzing categorized health log data. The user has ${categorizedData.totalEntries} entries across ${categorizedData.totalCategories} health context categories.` },
                { role: 'assistant', content: analysis }
            ];
            
            // Display the analysis
            UI.renderThinkView({ 
                analysis: analysis,
                categorizedData: categorizedData
            });
        } catch (error) {
            console.error('Think analysis error:', error);
            UI.renderThinkView({ 
                error: 'Failed to analyze data. Please try again.',
                categorizedData: categorizedData
            });
        }
    },
    
    // Get Claude's analysis of categorized data
    async getThinkAnalysis(categorizedData) {
        const prompt = `Analyze this categorized health log data and provide insights, patterns, and recommendations.

Data Overview:
- Total entries: ${categorizedData.totalEntries}
- Total health context categories: ${categorizedData.totalCategories}
- Date range: ${new Date(categorizedData.categories[0]?.dateRange?.from).toLocaleDateString()} to ${new Date(categorizedData.categories[categorizedData.categories.length - 1]?.dateRange?.to).toLocaleDateString()}

Categorized Data:
${JSON.stringify(categorizedData, null, 2)}

Please provide:
1. Key patterns and insights across different health contexts
2. Correlations between different conditions/symptoms
3. Progression or changes over time
4. Specific recommendations based on the data
5. Important questions for the user to consider

Focus on actionable insights and patterns that could help the user better understand and manage their health.`;
        
        return await API.callClaude(prompt);
    },
    
    // Handle Think dialog input
    async handleThinkQuestion(question) {
        if (!question.trim()) return;
        
        // Add user question to context
        this.thinkContext.push({ role: 'user', content: question });
        
        // Show loading state
        UI.updateThinkDialog({ loading: true });
        
        try {
            // Build context for Claude
            const contextMessages = this.thinkContext.map(msg => 
                `${msg.role}: ${msg.content}`
            ).join('\n\n');
            
            const prompt = `${contextMessages}\n\nuser: ${question}\n\nProvide a helpful response based on the health data analysis and previous discussion.`;
            
            const response = await API.callClaude(prompt);
            
            // Add response to context
            this.thinkContext.push({ role: 'assistant', content: response });
            
            // Update UI with new response
            UI.updateThinkDialog({ 
                messages: this.thinkContext,
                loading: false 
            });
        } catch (error) {
            console.error('Think question error:', error);
            UI.updateThinkDialog({ 
                error: 'Failed to get response. Please try again.',
                loading: false 
            });
        }
    },
    
    // Clear Think context when closing
    clearThinkContext() {
        this.thinkContext = [];
    },
    
    // Copy Think data to clipboard
    copyThinkData() {
        const entries = LogManager.getEntries();
        if (window.HealthCategorizer.needsRecategorization(entries)) {
            window.HealthCategorizer.categorizeEntries(entries);
        }
        const categorizedData = window.HealthCategorizer.exportForAnalysis();
        const jsonData = JSON.stringify(categorizedData, null, 2);
        this.copyToClipboard(jsonData, 'Categorized data copied!');
    }
};

// Export for use in other modules
window.EventHandler = EventHandler;