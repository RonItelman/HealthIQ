// Health Module for health issues management

const Health = {
    // Current health issues
    healthIssues: {
        description: '',
        claudeAnalysis: ''
    },
    
    // Initialize health module
    init() {
        this.loadHealthIssues();
        this.setupEventListeners();
    },
    
    // Load health issues from storage
    loadHealthIssues() {
        this.healthIssues = Storage.loadHealthIssues();
        this.updateHealthDisplay();
    },
    
    // Save health issues
    saveHealthIssues() {
        Storage.saveHealthIssues(this.healthIssues);
    },
    
    // Update health display
    updateHealthDisplay() {
        if (this.healthIssues.description) {
            UI.elements.healthIssuesText.value = this.healthIssues.description;
            // Auto-resize after setting value
            setTimeout(() => this.autoResizeTextarea(), 10);
        }
        
        if (this.healthIssues.claudeAnalysis) {
            UI.elements.healthAnalysisContent.innerHTML = 
                this.healthIssues.claudeAnalysis.replace(/\n/g, '<br>');
        } else {
            UI.elements.healthAnalysisContent.innerHTML = 
                '<p class="analysis-placeholder">Submit your issue for Claude to gain context</p>';
        }
        
        // Update button to show context is active
        if (window.HealthContext && window.HealthContext.hasContext()) {
            document.getElementById('healthBtn').classList.add('has-context');
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Health button click
        document.getElementById('healthBtn').addEventListener('click', () => {
            UI.elements.healthModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            // Auto-resize textarea after modal opens
            setTimeout(() => this.autoResizeTextarea(), 100);
        });
        
        // Close health modal
        document.getElementById('healthCloseBtn').addEventListener('click', () => {
            UI.elements.healthModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        // Analyze health button
        UI.elements.analyzeHealthBtn.addEventListener('click', () => {
            this.analyzeHealthIssues();
        });
        
        // Auto-resize textarea on input
        UI.elements.healthIssuesText.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Click outside modal to close
        UI.elements.healthModal.addEventListener('click', (e) => {
            if (e.target === UI.elements.healthModal) {
                UI.elements.healthModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    },
    
    // Auto-resize textarea to fit content
    autoResizeTextarea() {
        const textarea = UI.elements.healthIssuesText;
        // Reset height to recalculate
        textarea.style.height = 'auto';
        // Set new height based on scrollHeight
        textarea.style.height = textarea.scrollHeight + 'px';
    },
    
    // Analyze health issues
    async analyzeHealthIssues() {
        console.log('Analyze button clicked');
        const description = UI.elements.healthIssuesText.value.trim();
        
        if (!description) {
            UI.showToast('Please describe your health issues first');
            return;
        }
        
        console.log('Description:', description);
        
        // Update button state
        UI.elements.analyzeHealthBtn.disabled = true;
        UI.elements.analyzeHealthBtn.innerHTML = 
            '<span class="material-symbols-outlined">hourglass_empty</span> Analyzing...';
        
        try {
            console.log('Creating prompt...');
            const prompt = API.createHealthIssuesPrompt(description);
            console.log('Prompt created:', prompt);
            
            console.log('Calling Claude API...');
            const analysis = await API.callClaude(prompt);
            console.log('Analysis received:', analysis);
            
            // Save the analysis
            this.healthIssues.description = description;
            this.healthIssues.claudeAnalysis = analysis;
            this.saveHealthIssues();
            
            // Update health context
            window.HealthContext.updateFromAnalysis(description, analysis);
            
            // Update display
            UI.elements.healthAnalysisContent.innerHTML = analysis.replace(/\n/g, '<br>');
            
            UI.showToast('Health analysis completed');
            
        } catch (error) {
            console.error('Health analysis error:', error);
            
            // Show error message with more details
            const errorMessage = `
                <div class="error-message">
                    <strong>Unable to analyze health issues</strong><br>
                    ${error.message || 'Please check your internet connection and try again.'}
                </div>
            `;
            UI.elements.healthAnalysisContent.innerHTML = errorMessage;
            
            UI.showToast('Analysis failed - check console for details');
        } finally {
            // Reset button
            UI.elements.analyzeHealthBtn.disabled = false;
            UI.elements.analyzeHealthBtn.innerHTML = 
                '<span class="material-symbols-outlined">psychology</span> Analyze with Claude';
        }
    },
    
    // Analyze log entry in context of health issues
    async analyzeLogEntry(logEntry) {
        // Check if we have health context
        if (!window.HealthContext || !window.HealthContext.hasContext()) {
            return null; // No health context to analyze against
        }
        
        try {
            // Create prompt with health context automatically included
            const prompt = API.createLogEntryPrompt(logEntry);
            
            const analysis = await API.callClaude(prompt);
            
            // Extract tags from the analysis
            const tags = this.extractTagsFromAnalysis(analysis);
            
            return {
                claudeAnalysis: analysis,
                tags: tags
            };
            
        } catch (error) {
            console.error('Log entry analysis error:', error);
            return null;
        }
    },
    
    // Extract tags from Claude's analysis
    extractTagsFromAnalysis(analysis) {
        const tags = [];
        const lowerAnalysis = analysis.toLowerCase();
        
        // Look for mentioned tags in the analysis
        const possibleTags = [
            'exercise', 'nutrition', 'sleep', 'emotion', 
            'physical_sensation', 'medication', 'symptom'
        ];
        
        possibleTags.forEach(tag => {
            if (lowerAnalysis.includes(tag)) {
                tags.push(tag);
            }
        });
        
        return tags;
    }
};

// Export for use in other modules
window.Health = Health;