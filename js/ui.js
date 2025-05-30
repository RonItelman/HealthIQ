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
    renderLogEntries(entries, healthIssues) {
        if (entries.length === 0) {
            this.elements.modalBody.innerHTML = '<div class="empty-state">No entries yet. Start logging your daily activities!</div>';
            return;
        }
        
        const html = entries.map(entry => {
            const hasAnalysis = entry.analysis && entry.analysis.claudeAnalysis;
            const metaTags = entry.analysis?.tags || this.extractMetaTags(entry.content);
            
            return `
                <div class="log-entry">
                    <div class="log-timestamp">${this.formatDate(entry.timestamp)}</div>
                    <div class="log-content">${this.escapeHtml(entry.content)}</div>
                    ${hasAnalysis ? `
                        <div class="log-entry-analysis">
                            <strong>Claude's Analysis:</strong><br>
                            ${this.escapeHtml(entry.analysis.claudeAnalysis).replace(/\n/g, '<br>')}
                        </div>
                    ` : ''}
                    ${healthIssues.claudeAnalysis && !hasAnalysis ? `
                        <div class="log-entry-health">
                            <em>Health Context: ${this.escapeHtml(healthIssues.description.substring(0, 100))}...</em>
                        </div>
                    ` : ''}
                    ${metaTags.length > 0 ? `
                        <div class="meta-tags">
                            ${metaTags.map(tag => `<span class="meta-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
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
    
    // Generate markdown
    generateMarkdown(entries) {
        if (!entries || entries.length === 0) return 'No entries to export';
        
        let markdown = '# My HealthIQ Log Entries\n\n';
        
        entries.forEach((entry, index) => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            markdown += `## Entry ${entries.length - index}\n`;
            markdown += `**Date:** ${formattedDate}\n\n`;
            markdown += `${entry.content}\n\n`;
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
            const words = entry.content.toLowerCase().split(/\s+/);
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
            this.elements.viewBtnIcon.textContent = 'visibility';
        }, 5000);
    }
};

// Export for use in other modules
window.UI = UI;