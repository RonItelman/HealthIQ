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
        }
        
        if (this.healthIssues.claudeAnalysis) {
            UI.elements.healthAnalysisContent.innerHTML = 
                this.healthIssues.claudeAnalysis.replace(/\n/g, '<br>');
            UI.elements.healthAnalysisResult.style.display = 'block';
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Health button click
        document.getElementById('healthBtn').addEventListener('click', () => {
            UI.elements.healthModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
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
        
        // Click outside modal to close
        UI.elements.healthModal.addEventListener('click', (e) => {
            if (e.target === UI.elements.healthModal) {
                UI.elements.healthModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    },
    
    // Analyze health issues
    async analyzeHealthIssues() {
        const description = UI.elements.healthIssuesText.value.trim();
        
        if (!description) {
            UI.showToast('Please describe your health issues first');
            return;
        }
        
        // Update button state
        UI.elements.analyzeHealthBtn.disabled = true;
        UI.elements.analyzeHealthBtn.innerHTML = 
            '<span class="material-symbols-outlined">hourglass_empty</span> Analyzing...';
        
        try {
            const prompt = API.createHealthIssuesPrompt(description);
            const analysis = await API.callClaude(prompt);
            
            // Save the analysis
            this.healthIssues.description = description;
            this.healthIssues.claudeAnalysis = analysis;
            this.saveHealthIssues();
            
            // Update display
            UI.elements.healthAnalysisContent.innerHTML = analysis.replace(/\n/g, '<br>');
            UI.elements.healthAnalysisResult.style.display = 'block';
            
            UI.showToast('Health analysis completed');
            
        } catch (error) {
            console.error('Health analysis error:', error);
            
            // Show error message
            const errorMessage = UI.showError(
                'Unable to analyze health issues. Please check your internet connection and try again.'
            );
            UI.elements.healthAnalysisContent.innerHTML = errorMessage;
            UI.elements.healthAnalysisResult.style.display = 'block';
            
            UI.showToast('Analysis failed - please try again');
        } finally {
            // Reset button
            UI.elements.analyzeHealthBtn.disabled = false;
            UI.elements.analyzeHealthBtn.innerHTML = 
                '<span class="material-symbols-outlined">psychology</span> Analyze with Claude';
        }
    },
    
    // Analyze log entry in context of health issues
    async analyzeLogEntry(logEntry) {
        if (!this.healthIssues.claudeAnalysis) {
            return null; // No health context to analyze against
        }
        
        try {
            const prompt = API.createLogEntryPrompt(
                logEntry, 
                this.healthIssues.description, 
                this.healthIssues.claudeAnalysis
            );
            
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