// Think Modal Module - Handles the Think analysis modal

const ThinkModal = {
    // Modal elements
    modal: null,
    modalBody: null,
    closeBtn: null,
    
    // Current context for dialog
    thinkContext: [],
    
    // Initialize the module
    init() {
        this.modal = document.getElementById('thinkModal');
        this.modalBody = document.getElementById('thinkModalBody');
        this.closeBtn = document.getElementById('thinkCloseBtn');
        
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Close button
        this.closeBtn.addEventListener('click', () => {
            this.close();
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.close();
            }
        });
    },
    
    // Open the modal
    open() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    },
    
    // Close the modal
    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Clear context when closing
        this.clearContext();
    },
    
    // Clear think context
    clearContext() {
        this.thinkContext = [];
    },
    
    // Show loading state
    showLoading() {
        this.open();
        this.renderContent({
            loading: true
        });
    },
    
    // Show analysis
    showAnalysis(analysis, categorizedData) {
        this.thinkContext = [
            { 
                role: 'system', 
                content: `You are analyzing categorized health log data. The user has ${categorizedData.totalEntries} entries across ${categorizedData.totalCategories} health context categories.` 
            },
            { 
                role: 'assistant', 
                content: analysis 
            }
        ];
        
        this.renderContent({
            analysis: analysis,
            categorizedData: categorizedData
        });
    },
    
    // Show error
    showError(error) {
        this.renderContent({
            error: error
        });
    },
    
    // Handle follow-up question
    async handleQuestion(question) {
        if (!question.trim()) return;
        
        // Add user question to context
        this.thinkContext.push({ role: 'user', content: question });
        
        // Show loading state
        this.updateDialog({ loading: true });
        
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
            this.updateDialog({ 
                messages: this.thinkContext,
                loading: false 
            });
        } catch (error) {
            console.error('Think question error:', error);
            this.updateDialog({ 
                error: 'Failed to get response. Please try again.',
                loading: false 
            });
        }
    },
    
    // Render content in modal
    renderContent(options) {
        let html = '';
        
        if (options.loading) {
            html = `
                <div class="think-view">
                    <div class="think-header">
                        <h2>Analyzing Health Data...</h2>
                        <p>Claude is reviewing your health log patterns</p>
                    </div>
                    <div class="think-loading">
                        <div class="loading-spinner"></div>
                        <p>This may take a moment...</p>
                    </div>
                </div>
            `;
        } else if (options.error) {
            html = `
                <div class="think-view">
                    <div class="think-header">
                        <h2>Analysis Error</h2>
                    </div>
                    <div class="error-message">${options.error}</div>
                </div>
            `;
        } else if (options.analysis) {
            html = `
                <div class="think-view">
                    <div class="think-header">
                        <h2>Health Data Analysis</h2>
                        <p>Analyzed ${options.categorizedData.totalEntries} entries across ${options.categorizedData.totalCategories} health contexts</p>
                    </div>
                    
                    <div class="think-dialog">
                        <div class="think-messages" id="thinkMessages">
                            <div class="think-message assistant">
                                <div class="message-label">Claude's Analysis</div>
                                <div class="message-content">${this.formatContent(options.analysis)}</div>
                            </div>
                        </div>
                        
                        <div class="think-input-container">
                            <textarea 
                                id="thinkQuestion" 
                                class="think-input" 
                                placeholder="Ask a follow-up question about your health data..."
                                rows="2"
                                onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ThinkModal.handleQuestion(this.value); }"
                            ></textarea>
                            <button class="btn btn-primary" onclick="ThinkModal.handleQuestion(document.getElementById('thinkQuestion').value)">
                                <span class="material-symbols-outlined">send</span>
                                Ask
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.modalBody.innerHTML = html;
        
        // Focus on input if analysis is shown
        if (options.analysis) {
            setTimeout(() => {
                document.getElementById('thinkQuestion')?.focus();
            }, 100);
        }
    },
    
    // Update dialog with new messages
    updateDialog(options) {
        const messagesContainer = document.getElementById('thinkMessages');
        const questionInput = document.getElementById('thinkQuestion');
        
        if (!messagesContainer) return;
        
        if (options.loading) {
            // Add loading message
            const loadingHtml = `
                <div class="think-message loading">
                    <div class="message-label">Claude is thinking...</div>
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', loadingHtml);
            
            // Clear input
            if (questionInput) {
                questionInput.value = '';
                questionInput.disabled = true;
            }
        } else {
            // Remove loading message if exists
            const loadingMsg = messagesContainer.querySelector('.think-message.loading');
            if (loadingMsg) loadingMsg.remove();
            
            // Add new messages
            if (options.messages) {
                // Clear and rebuild all messages
                messagesContainer.innerHTML = '';
                options.messages.forEach(msg => {
                    if (msg.role !== 'system') {
                        const msgHtml = `
                            <div class="think-message ${msg.role}">
                                <div class="message-label">${msg.role === 'user' ? 'You' : "Claude's Response"}</div>
                                <div class="message-content">${this.formatContent(msg.content)}</div>
                            </div>
                        `;
                        messagesContainer.insertAdjacentHTML('beforeend', msgHtml);
                    }
                });
            }
            
            // Handle error
            if (options.error) {
                const errorHtml = `
                    <div class="think-message error">
                        <div class="message-content">${options.error}</div>
                    </div>
                `;
                messagesContainer.insertAdjacentHTML('beforeend', errorHtml);
            }
            
            // Re-enable input
            if (questionInput) {
                questionInput.disabled = false;
                questionInput.focus();
            }
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },
    
    // Format content with line breaks
    formatContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/(\d+\.\s)/g, '<br>$1')
            .replace(/^<br>/, '');
    }
};

// Export for use in other modules
window.ThinkModal = ThinkModal;