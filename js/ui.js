// UI Module for rendering and updating interface

const UI = {
    // DOM Elements cache
    elements: {},
    
    // Initialize DOM elements
    init() {
        this.elements = {
            // Loading screen
            // loadingScreen removed
            
            // Header stats
            totalCount: document.getElementById('totalCount'),
            todayCount: document.getElementById('todayCount'),
            
            // Main textarea
            logText: document.getElementById('logText'),
            
            // Buttons
            viewBtn: document.getElementById('viewBtn'),
            viewBtnIcon: document.getElementById('viewBtnIcon'),
            
            // Modals
            logModal: document.getElementById('logModal'),
            modalBody: document.getElementById('modalBody'),
            healthModal: document.getElementById('healthModal'),
            
            // Health elements
            healthIssuesText: document.getElementById('healthIssuesText'),
            analyzeHealthBtn: document.getElementById('analyzeHealthBtn'),
            healthAnalysisResult: document.getElementById('healthAnalysisResult'),
            healthAnalysisContent: document.getElementById('healthAnalysisContent'),
            
            // Toast
            toast: document.getElementById('toast')
        };
    },
    
    // Hide loading screen
    hideLoadingScreen() {
        // Loading screen has been removed, so just skip
        return;
    },
    
    // Update stats
    updateStats(logEntries) {
        const total = logEntries.length;
        const today = logEntries.filter(entry => {
            const entryDate = new Date(entry.timestamp).toDateString();
            const todayDate = new Date().toDateString();
            return entryDate === todayDate;
        }).length;
        
        this.elements.totalCount.textContent = total;
        this.elements.todayCount.textContent = today;
    },
    
    // Show toast notification
    showToast(message) {
        this.elements.toast.textContent = message;
        this.elements.toast.classList.add('show');
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    },
    
    // Render log entries
    renderLogEntries(entries) {
        if (entries.length === 0) {
            this.elements.modalBody.innerHTML = '<div class="empty-state">No entries yet. Start logging your daily activities!</div>';
            return;
        }
        
        const html = entries.map(entry => {
            // Handle both new and legacy entry formats
            const healthContext = entry.claudeHealthContext || entry.healthContext || null;
            const userContent = entry.userLogEntry || entry.content || entry.userEntry?.content || '';
            const claudeMessage = entry.claudeLogMessage !== undefined ? entry.claudeLogMessage : (entry.analysis?.response || entry.analysis?.claudeAnalysis || null);
            const metaTags = entry.claudeTags || entry.analysis?.tags || [];
            
            // Check if we should show analysis section
            const hasHealthContext = window.HealthContext && window.HealthContext.hasContext();
            const shouldShowAnalysis = hasHealthContext && userContent; // Only show if there's content to analyze
            
            return `
                <div class="log-entry">
                    <!-- Header with timestamp and tags -->
                    <div class="log-entry-header">
                        <div class="log-timestamp">${this.formatDate(entry.timestamp)}</div>
                        ${metaTags.length > 0 ? `
                            <div class="log-entry-tags">
                                ${metaTags.map(tag => `<span class="log-tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="log-entry-body">
                        <!-- Section 1: User Entry -->
                        <div class="log-section">
                            <div class="log-section-title">
                                <span class="material-symbols-outlined">edit_note</span>
                                Your Entry
                            </div>
                            <div class="log-user-content">
                                ${this.escapeHtml(userContent)}
                            </div>
                        </div>
                        
                        <!-- Section 2: Health Context -->
                        ${healthContext ? `
                            <div class="log-section log-health-context">
                                <div class="log-section-title">
                                    <span class="material-symbols-outlined">medical_information</span>
                                    Health Context
                                </div>
                                ${(healthContext.conditions && healthContext.conditions.length > 0) ? `
                                    <div class="log-health-conditions">
                                        Tracking: ${healthContext.conditions.join(', ')}
                                    </div>
                                ` : ''}
                                <div class="log-health-summary">
                                    ${this.escapeHtml((healthContext.fullResponse || healthContext.summary || healthContext.description || '').substring(0, 150))}...
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Section 3: Claude's Analysis -->
                        ${shouldShowAnalysis ? `
                            <div class="log-section log-analysis">
                                <div class="log-section-title">
                                    <span class="material-symbols-outlined">psychology</span>
                                    AI Analysis
                                </div>
                                <div class="log-analysis-content">
                                    ${claudeMessage ? 
                                        String(claudeMessage).replace(/\n/g, '<br>') :
                                        '<div class="analysis-processing">Processing... AI analysis will appear here</div>'
                                    }
                                </div>
                                ${entry.claudeQuestions && entry.claudeQuestions.length > 0 ? `
                                    <div class="log-analysis-questions">
                                        <strong>Follow-up Questions:</strong>
                                        <ul>
                                            ${entry.claudeQuestions.map(q => `<li>${q}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                ${entry.claudeObservations && entry.claudeObservations.length > 0 ? `
                                    <div class="log-analysis-observations">
                                        <strong>Observations:</strong>
                                        <ul>
                                            ${entry.claudeObservations.map(o => `<li>${o}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.modalBody.innerHTML = html;
    },
    
    // Render markdown view
    renderMarkdown(entries) {
        if (entries.length === 0) {
            this.elements.modalBody.innerHTML = '<div class="empty-state">No entries to display as markdown</div>';
            return;
        }
        
        const markdown = this.generateMarkdown(entries);
        this.elements.modalBody.innerHTML = `<div class="log-entry"><pre style="white-space: pre-wrap; font-family: monospace;">${this.escapeHtml(markdown)}</pre></div>`;
    },
    
    // Render summary view
    renderSummary(entries) {
        const today = new Date().toDateString();
        const todayEntries = entries.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        );
        
        if (todayEntries.length === 0) {
            this.elements.modalBody.innerHTML = '<div class="empty-state">No entries for today</div>';
            return;
        }
        
        // Group by hour
        const hourlyGroups = {};
        todayEntries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            if (!hourlyGroups[hour]) {
                hourlyGroups[hour] = [];
            }
            hourlyGroups[hour].push(entry);
        });
        
        // Calculate tag histogram
        const tagCounts = {};
        todayEntries.forEach(entry => {
            const content = entry.userLogEntry || entry.content || entry.userEntry?.content || '';
            const tags = entry.claudeTags || entry.analysis?.tags || (content ? this.extractMetaTags(content) : []);
            tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        
        // Sort tags by count (descending)
        const sortedTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a);
        
        const summaryHtml = `
            <div class="summary-table">
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Entries</th>
                            <th>Key Activities</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(hourlyGroups)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([hour, entries]) => `
                                <tr>
                                    <td>${hour}:00</td>
                                    <td class="summary-count">${entries.length}</td>
                                    <td>${this.summarizeEntries(entries)}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${sortedTags.length > 0 ? `
                <div class="summary-table" style="margin-top: 20px;">
                    <h3>Tags Histogram</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Tag</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedTags.map(([tag, count]) => `
                                <tr>
                                    <td>${this.escapeHtml(tag)}</td>
                                    <td class="summary-count">${count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            <div class="log-entry" style="margin-top: 20px;">
                <strong>Today's Summary:</strong><br>
                Total entries: ${todayEntries.length}<br>
                First entry: ${new Date(todayEntries[0].timestamp).toLocaleTimeString()}<br>
                Last entry: ${new Date(todayEntries[todayEntries.length - 1].timestamp).toLocaleTimeString()}
            </div>
        `;
        
        this.elements.modalBody.innerHTML = summaryHtml;
    },
    
    // Show error message
    showError(message) {
        const errorHtml = `<div class="error-message">${message}</div>`;
        return errorHtml;
    },
    
    // Format date
    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Generate markdown - Direct JSON to human-readable conversion
    generateMarkdown(entries) {
        if (!entries || entries.length === 0) return 'No entries to export';
        
        let markdown = '# Dots Health Log Data\n\n';
        
        entries.forEach((entry, index) => {
            markdown += `## Entry ${index + 1}\n\n`;
            
            // Basic info
            markdown += `**ID:** ${entry.id}\n`;
            markdown += `**Timestamp:** ${entry.timestamp}\n`;
            markdown += `**Version:** ${entry.version}\n\n`;
            
            // User log entry
            markdown += `### User Log Entry\n`;
            markdown += `${entry.userLogEntry || '(empty)'}\n\n`;
            
            // Claude Health Context
            if (entry.claudeHealthContext) {
                markdown += `### Health Context\n`;
                markdown += `**Captured At:** ${entry.claudeHealthContext.capturedAt}\n\n`;
                
                if (entry.claudeHealthContext.conditions && entry.claudeHealthContext.conditions.length > 0) {
                    markdown += `**Conditions:**\n`;
                    entry.claudeHealthContext.conditions.forEach(condition => {
                        markdown += `- ${condition}\n`;
                    });
                    markdown += '\n';
                }
                
                if (entry.claudeHealthContext.triggers && entry.claudeHealthContext.triggers.length > 0) {
                    markdown += `**Triggers:**\n`;
                    entry.claudeHealthContext.triggers.forEach(trigger => {
                        markdown += `- ${trigger}\n`;
                    });
                    markdown += '\n';
                }
                
                if (entry.claudeHealthContext.trackingGoals && entry.claudeHealthContext.trackingGoals.length > 0) {
                    markdown += `**Tracking Goals:**\n`;
                    entry.claudeHealthContext.trackingGoals.forEach(goal => {
                        markdown += `- ${goal}\n`;
                    });
                    markdown += '\n';
                }
                
                markdown += `**Full Response:**\n${entry.claudeHealthContext.fullResponse}\n\n`;
            }
            
            // Claude's Analysis
            markdown += `### Claude's Analysis\n`;
            markdown += `**Message:** ${entry.claudeLogMessage || '(pending)'}\n\n`;
            
            if (entry.claudeTags && entry.claudeTags.length > 0) {
                markdown += `**Tags:** ${entry.claudeTags.join(', ')}\n\n`;
            }
            
            if (entry.claudeObservations && entry.claudeObservations.length > 0) {
                markdown += `**Observations:**\n`;
                entry.claudeObservations.forEach(obs => {
                    markdown += `- ${obs}\n`;
                });
                markdown += '\n';
            }
            
            if (entry.claudeQuestions && entry.claudeQuestions.length > 0) {
                markdown += `**Questions:**\n`;
                entry.claudeQuestions.forEach(q => {
                    markdown += `- ${q}\n`;
                });
                markdown += '\n';
            }
            
            if (entry.claudePotentialPathways && entry.claudePotentialPathways.length > 0) {
                markdown += `**Potential Pathways:**\n`;
                entry.claudePotentialPathways.forEach(pathway => {
                    markdown += `- ${pathway}\n`;
                });
                markdown += '\n';
            }
            
            // Analysis Metadata
            if (entry.analysisMetadata) {
                markdown += `### Analysis Metadata\n`;
                markdown += `**Analyzed At:** ${entry.analysisMetadata.analyzedAt || 'N/A'}\n`;
                markdown += `**Model Used:** ${entry.analysisMetadata.modelUsed}\n\n`;
            }
            
            markdown += '---\n\n';
        });
        
        return markdown.trim();
    },
    
    // Extract meta tags
    extractMetaTags(text) {
        const tags = [];
        const lowerText = text.toLowerCase();
        
        // Exercise tags
        if (lowerText.match(/\b(walk|run|exercise|gym|yoga|swim|bike|workout)\b/)) tags.push('exercise');
        
        // Food/nutrition tags
        if (lowerText.match(/\b(eat|food|meal|breakfast|lunch|dinner|snack|drink)\b/)) tags.push('nutrition');
        
        // Sleep tags
        if (lowerText.match(/\b(sleep|nap|rest|tired|fatigue|insomnia|awake)\b/)) tags.push('sleep');
        
        // Emotion tags
        if (lowerText.match(/\b(anxious|anxiety|stress|worried|nervous|calm|happy|sad|depressed|mood)\b/)) tags.push('emotion');
        
        // Physical sensation tags
        if (lowerText.match(/\b(pain|ache|hurt|sore|cramp|headache|migraine|dizzy|nausea)\b/)) tags.push('physical_sensation');
        
        // Symptom tags
        if (lowerText.match(/\b(symptom|flare|crash|relapse|better|worse|improve)\b/)) tags.push('symptom');
        
        // Medication tags
        if (lowerText.match(/\b(medication|medicine|pill|supplement|vitamin|drug)\b/)) tags.push('medication');
        
        return tags;
    },
    
    // Summarize entries
    summarizeEntries(entries) {
        const keywords = [];
        entries.forEach(entry => {
            const content = entry.userLogEntry || entry.content || entry.userEntry?.content || '';
            const words = content.toLowerCase().split(/\s+/);
            const importantWords = words.filter(word => 
                word.length > 4 && !['about', 'after', 'before', 'today', 'really'].includes(word)
            );
            keywords.push(...importantWords.slice(0, 2));
        });
        
        const unique = [...new Set(keywords)].slice(0, 3);
        return unique.join(', ') || 'Various activities';
    },
    
    // Celebrate view button
    celebrateViewButton() {
        this.elements.viewBtn.classList.add('celebrating');
        this.elements.viewBtnIcon.textContent = 'celebration';
        
        setTimeout(() => {
            this.elements.viewBtn.classList.remove('celebrating');
            this.elements.viewBtnIcon.textContent = 'auto_stories';
        }, 5000);
    }
};

// Export for use in other modules
window.UI = UI;