// Health Context Module - Manages comprehensive health profile for contextual analysis

class HealthContext {
    constructor() {
        this.context = this.load();
    }
    
    // Load context from storage
    load() {
        return Storage.loadHealthContext();
    }
    
    // Save context to storage
    save() {
        return Storage.saveHealthContext(this.context);
    }
    
    // Update context from Claude's analysis
    updateFromAnalysis(userDescription, claudeAnalysis) {
        this.context.userDescription = userDescription;
        this.context.claudeAnalysis = claudeAnalysis;
        this.context.lastUpdated = new Date().toISOString();
        
        // Parse structured data from Claude's analysis
        this.parseStructuredData(claudeAnalysis);
        
        this.save();
    }
    
    // Parse Claude's analysis into structured data
    parseStructuredData(analysis) {
        const structured = {
            conditions: [],
            symptoms: [],
            triggers: [],
            trackingQuestions: [],
            suggestedTags: []
        };
        
        // Extract primary conditions only
        const conditionsMatch = analysis.match(/Primary Conditions:([\s\S]*?)(?=Observations:|Suspected Triggers:|Goals:|$)/i);
        if (conditionsMatch) {
            const conditions = conditionsMatch[1].match(/- ([^:]+:[^-\n]+)/g);
            if (conditions) {
                structured.conditions = conditions.map(c => c.replace('- ', '').trim());
            }
        }
        
        // Extract triggers
        const triggersMatch = analysis.match(/Suspected Triggers:([\s\S]*?)(?=Goals:|2\.|$)/i);
        if (triggersMatch) {
            const triggers = triggersMatch[1].match(/- ([^-\n]+)/g);
            if (triggers) {
                structured.triggers = triggers.map(t => t.replace('- ', '').trim());
            }
        }
        
        // Extract suggested tags
        const tagsMatch = analysis.match(/Suggested Metadata Tags:([\s\S]*?)(?=\d\.|Key Questions|$)/i);
        if (tagsMatch) {
            const tags = tagsMatch[1].match(/- ([^-\n]+)/g);
            if (tags) {
                structured.suggestedTags = tags.map(t => t.replace('- ', '').trim());
            }
        }
        
        // Extract tracking questions
        const questionsMatch = analysis.match(/Key Questions to Track[\s\S]*?(?=\d\.|Potential Patterns|$)/i);
        if (questionsMatch) {
            const questions = questionsMatch[1].match(/- ([^-\n]+\?)/g);
            if (questions) {
                structured.trackingQuestions = questions.map(q => q.replace('- ', '').trim());
            }
        }
        
        this.context.structuredData = structured;
    }
    
    // Get context for log entry analysis
    getContextForLogAnalysis() {
        if (!this.context.userDescription || !this.context.claudeAnalysis) {
            return null;
        }
        
        return {
            description: this.context.userDescription,
            analysis: this.context.claudeAnalysis,
            tags: this.context.structuredData.suggestedTags,
            conditions: this.context.structuredData.conditions
        };
    }
    
    // Generate prompt context
    generatePromptContext() {
        if (!this.context.userDescription) {
            return '';
        }
        
        return `
HEALTH CONTEXT:
User's Health Profile: ${this.context.userDescription}

Key Health Conditions: ${this.context.structuredData.conditions.join(', ')}

Previous Analysis Insights:
${this.context.claudeAnalysis}

Relevant Tags to Consider: ${this.context.structuredData.suggestedTags.join(', ')}
`;
    }
    
    // Check if context exists
    hasContext() {
        return !!(this.context.userDescription && this.context.claudeAnalysis);
    }
    
    // Get formatted display
    getDisplaySummary() {
        if (!this.hasContext()) {
            return 'No health context configured';
        }
        
        return `
            <div class="health-context-summary">
                <h4>Active Health Profile</h4>
                <p><strong>Conditions:</strong> ${this.context.structuredData.conditions.join(', ')}</p>
                <p><strong>Tracking:</strong> ${this.context.structuredData.suggestedTags.length} metadata tags</p>
                <p><strong>Last Updated:</strong> ${new Date(this.context.lastUpdated).toLocaleDateString()}</p>
            </div>
        `;
    }
    
    // Get full context for storage
    getFullContext() {
        return this.context;
    }
}

// Create singleton instance
const healthContext = new HealthContext();

// Export for use in other modules
window.HealthContext = healthContext;