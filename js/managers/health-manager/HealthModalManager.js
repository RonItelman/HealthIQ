// HealthModalManager - Handles health modal UI interactions and display

class HealthModalManager {
    constructor() {
        this.modalElement = null;
        this.elements = {};
        this.isOpen = false;
        
        if (window.DebugStore) {
            DebugStore.debug('HealthModalManager initialized', {}, 'HEALTHMODAL');
        }
    }
    
    /**
     * Initialize modal manager
     */
    init() {
        this.findElements();
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('HealthModalManager init completed', {
                elementsFound: Object.keys(this.elements).length
            }, 'HEALTHMODAL');
        }
    }
    
    /**
     * Find modal elements in DOM
     */
    findElements() {
        this.modalElement = document.getElementById('healthModal');
        
        this.elements = {
            modal: this.modalElement,
            closeBtn: document.getElementById('healthCloseBtn'),
            healthIssuesText: document.getElementById('healthIssuesText'),
            analyzeHealthBtn: document.getElementById('analyzeHealthBtn'),
            healthAnalysisContent: document.getElementById('healthAnalysisContent'),
            healthAnalysisResult: document.getElementById('healthAnalysisResult')
        };
        
        // Verify required elements exist
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.warn('HealthModalManager: Missing elements:', missingElements);
        }
    }
    
    /**
     * Setup event listeners for modal interactions
     */
    setupEventListeners() {
        if (!this.elements.modal) return;
        
        // Close button
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // Analyze button
        if (this.elements.analyzeHealthBtn) {
            this.elements.analyzeHealthBtn.addEventListener('click', () => {
                this.handleAnalyzeClick();
            });
        }
        
        // Auto-resize textarea
        if (this.elements.healthIssuesText) {
            this.elements.healthIssuesText.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }
        
        // Click outside modal to close
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeModal();
            }
        });
        
        if (window.DebugStore) {
            DebugStore.debug('HealthModalManager event listeners setup', {}, 'HEALTHMODAL');
        }
    }
    
    /**
     * Show health modal
     */
    showModal() {
        if (!this.elements.modal) {
            console.error('Health modal element not found');
            return;
        }
        
        this.isOpen = true;
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus on textarea
        setTimeout(() => {
            if (this.elements.healthIssuesText) {
                this.elements.healthIssuesText.focus();
                this.autoResizeTextarea();
            }
        }, 100);
        
        if (window.DebugStore) {
            DebugStore.debug('Health modal shown', {}, 'HEALTHMODAL');
        }
    }
    
    /**
     * Close health modal
     */
    closeModal() {
        if (!this.elements.modal) return;
        
        this.isOpen = false;
        this.elements.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (window.DebugStore) {
            DebugStore.debug('Health modal closed', {}, 'HEALTHMODAL');
        }
    }
    
    /**
     * Update modal display with health profile data
     * @param {HealthProfile} profile - Health profile to display
     */
    updateDisplay(profile) {
        if (!profile) return;
        
        if (window.DebugStore) {
            DebugStore.debug('Updating health modal display', {
                hasDescription: !!profile.description,
                hasAnalysis: !!profile.analysis,
                completenessScore: profile.getCompletenessScore()
            }, 'HEALTHMODAL');
        }
        
        // Update description textarea
        if (this.elements.healthIssuesText) {
            this.elements.healthIssuesText.value = profile.description || '';
            setTimeout(() => this.autoResizeTextarea(), 10);
        }
        
        // Update analysis display
        if (this.elements.healthAnalysisContent) {
            if (profile.analysis && profile.analysis.trim()) {
                this.elements.healthAnalysisContent.innerHTML = this.formatAnalysisForDisplay(profile.analysis);
            } else {
                this.elements.healthAnalysisContent.innerHTML = 
                    '<p class="analysis-placeholder">Submit your issue for Claude to gain context</p>';
            }
        }
        
        // Update analyze button state
        this.updateAnalyzeButtonState();
    }
    
    /**
     * Format analysis text for display
     * @param {string} analysis - Analysis text
     * @returns {string} - Formatted HTML
     */
    formatAnalysisForDisplay(analysis) {
        if (!analysis) return '';
        
        return TextProcessor.formatDisplay(analysis);
    }
    
    /**
     * Handle analyze button click
     */
    async handleAnalyzeClick() {
        const description = this.elements.healthIssuesText?.value?.trim();
        
        if (!description) {
            // Emit toast event for error
            if (window.EventBus) {
                EventBus.emit('toast:show', {
                    message: 'Please enter your health description first',
                    type: 'warning'
                });
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.info('Health analysis requested via modal', {
                descriptionLength: description.length
            }, 'HEALTHMODAL');
        }
        
        try {
            // Disable button and show loading state
            this.setAnalyzeButtonLoading(true);
            
            // Emit analysis request event
            if (window.EventBus) {
                EventBus.emit('health:analyzeRequested', {
                    description: description,
                    source: 'modal'
                });
            }
            
            // The actual analysis will be handled by HealthManager
            // and the display will be updated via updateDisplay() when complete
            
        } catch (error) {
            this.setAnalyzeButtonLoading(false);
            
            if (window.DebugStore) {
                DebugStore.error('Health analysis request failed', {
                    error: error.message
                }, 'HEALTHMODAL');
            }
            
            // Emit error toast
            if (window.EventBus) {
                EventBus.emit('toast:show', {
                    message: `Analysis failed: ${error.message}`,
                    type: 'error'
                });
            }
        }
    }
    
    /**
     * Set analyze button loading state
     * @param {boolean} loading - Whether button is loading
     */
    setAnalyzeButtonLoading(loading) {
        if (!this.elements.analyzeHealthBtn) return;
        
        const btn = this.elements.analyzeHealthBtn;
        
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = `
                <span class="material-symbols-outlined spinning">refresh</span>
                <span class="btn-text">Analyzing...</span>
            `;
        } else {
            btn.disabled = false;
            btn.innerHTML = `
                <span class="material-symbols-outlined">psychology</span>
                <span class="btn-text">Analyze with Claude</span>
            `;
        }
    }
    
    /**
     * Update analyze button state based on content
     */
    updateAnalyzeButtonState() {
        if (!this.elements.analyzeHealthBtn || !this.elements.healthIssuesText) return;
        
        const hasContent = this.elements.healthIssuesText.value.trim().length > 0;
        this.elements.analyzeHealthBtn.disabled = !hasContent;
    }
    
    /**
     * Auto-resize textarea to fit content
     */
    autoResizeTextarea() {
        const textarea = this.elements.healthIssuesText;
        if (!textarea) return;
        
        // Reset height to auto to get correct scrollHeight
        textarea.style.height = 'auto';
        
        // Set height to scrollHeight (content height)
        const newHeight = Math.min(textarea.scrollHeight, 300); // Max 300px
        textarea.style.height = newHeight + 'px';
        
        // Update analyze button state
        this.updateAnalyzeButtonState();
    }
    
    /**
     * Show analysis loading state
     */
    showAnalysisLoading() {
        if (this.elements.healthAnalysisContent) {
            this.elements.healthAnalysisContent.innerHTML = `
                <div class="analysis-loading">
                    <span class="material-symbols-outlined spinning">refresh</span>
                    <span>Analyzing with Claude...</span>
                </div>
            `;
        }
    }
    
    /**
     * Show analysis error state
     * @param {string} error - Error message
     */
    showAnalysisError(error) {
        if (this.elements.healthAnalysisContent) {
            this.elements.healthAnalysisContent.innerHTML = `
                <div class="analysis-error">
                    <span class="material-symbols-outlined">error</span>
                    <span>Analysis failed: ${TextProcessor.escapeHtml(error)}</span>
                </div>
            `;
        }
    }
    
    /**
     * Clear health display
     */
    clearDisplay() {
        if (this.elements.healthIssuesText) {
            this.elements.healthIssuesText.value = '';
            this.autoResizeTextarea();
        }
        
        if (this.elements.healthAnalysisContent) {
            this.elements.healthAnalysisContent.innerHTML = 
                '<p class="analysis-placeholder">Submit your issue for Claude to gain context</p>';
        }
        
        this.updateAnalyzeButtonState();
        
        if (window.DebugStore) {
            DebugStore.debug('Health modal display cleared', {}, 'HEALTHMODAL');
        }
    }
    
    /**
     * Get current modal state
     * @returns {Object} - Modal state
     */
    getState() {
        return {
            isOpen: this.isOpen,
            hasContent: !!(this.elements.healthIssuesText?.value?.trim()),
            contentLength: this.elements.healthIssuesText?.value?.length || 0,
            hasAnalysis: this.elements.healthAnalysisContent?.textContent?.trim() !== 
                        'Submit your issue for Claude to gain context'
        };
    }
    
    /**
     * Set focus on description textarea
     */
    focusDescription() {
        if (this.elements.healthIssuesText && this.isOpen) {
            this.elements.healthIssuesText.focus();
        }
    }
    
    /**
     * Get description text
     * @returns {string} - Current description
     */
    getDescription() {
        return this.elements.healthIssuesText?.value?.trim() || '';
    }
    
    /**
     * Set description text
     * @param {string} description - Description to set
     */
    setDescription(description) {
        if (this.elements.healthIssuesText) {
            this.elements.healthIssuesText.value = description || '';
            this.autoResizeTextarea();
        }
    }
    
    /**
     * Destroy modal manager (cleanup)
     */
    destroy() {
        if (this.isOpen) {
            this.closeModal();
        }
        
        // Remove event listeners
        Object.values(this.elements).forEach(element => {
            if (element && element.removeEventListener) {
                // Note: In a real implementation, we'd need to store references to the bound functions
                // to properly remove event listeners
            }
        });
        
        if (window.DebugStore) {
            DebugStore.debug('HealthModalManager destroyed', {}, 'HEALTHMODAL');
        }
    }
}

// Export for use in other modules
window.HealthModalManager = HealthModalManager;