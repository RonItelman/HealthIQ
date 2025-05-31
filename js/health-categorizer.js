// Health Issue Categorizer - Groups log entries by health context
class HealthIssueCategorizer {
    constructor() {
        this.categories = [];
        this.lastCategorizedCount = 0;
    }
    
    // Categorize all log entries by health context
    categorizeEntries(entries) {
        const categoriesMap = new Map();
        
        entries.forEach(entry => {
            // Get the health context hash
            const contextHash = this.getHealthContextHash(entry.claudeHealthContext);
            
            if (!categoriesMap.has(contextHash)) {
                categoriesMap.set(contextHash, {
                    id: contextHash,
                    healthContext: entry.claudeHealthContext,
                    firstSeenAt: entry.timestamp,
                    lastSeenAt: entry.timestamp,
                    entries: []
                });
            }
            
            const category = categoriesMap.get(contextHash);
            category.entries.push({
                id: entry.id,
                timestamp: entry.timestamp,
                userLogEntry: entry.userLogEntry,
                claudeLogMessage: entry.claudeLogMessage,
                claudeTags: entry.claudeTags || [],
                claudeObservations: entry.claudeObservations || [],
                claudeQuestions: entry.claudeQuestions || [],
                claudePotentialPathways: entry.claudePotentialPathways || []
            });
            
            // Update last seen timestamp
            if (new Date(entry.timestamp) > new Date(category.lastSeenAt)) {
                category.lastSeenAt = entry.timestamp;
            }
        });
        
        // Convert map to array and sort by first seen date
        this.categories = Array.from(categoriesMap.values())
            .sort((a, b) => new Date(a.firstSeenAt) - new Date(b.firstSeenAt));
        
        // Mark as categorized
        this.lastCategorizedCount = entries.length;
        
        return this.categories;
    }
    
    // Generate a hash for health context to identify unique contexts
    getHealthContextHash(healthContext) {
        if (!healthContext) return 'no-context';
        
        // Create a unique identifier based on conditions and triggers
        const conditions = (healthContext.conditions || []).sort().join('|');
        const triggers = (healthContext.triggers || []).sort().join('|');
        
        // Simple hash function
        const str = `${conditions}::${triggers}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return `context-${Math.abs(hash)}`;
    }
    
    // Check if recategorization is needed
    needsRecategorization(entries) {
        return entries.length !== this.lastCategorizedCount;
    }
    
    // Get categories with summary stats
    getCategoriesWithStats() {
        return this.categories.map(category => ({
            ...category,
            stats: {
                totalEntries: category.entries.length,
                uniqueTags: this.getUniqueTags(category.entries),
                dateRange: {
                    from: category.firstSeenAt,
                    to: category.lastSeenAt
                },
                hasAnalysis: category.entries.filter(e => e.claudeLogMessage).length
            }
        }));
    }
    
    // Get unique tags from entries
    getUniqueTags(entries) {
        const tags = new Set();
        entries.forEach(entry => {
            (entry.claudeTags || []).forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }
    
    // Export categorized data for Claude analysis
    exportForAnalysis() {
        return {
            categorizedAt: new Date().toISOString(),
            totalCategories: this.categories.length,
            totalEntries: this.categories.reduce((sum, cat) => sum + cat.entries.length, 0),
            categories: this.categories.map(category => ({
                contextId: category.id,
                healthConditions: category.healthContext?.conditions || [],
                triggers: category.healthContext?.triggers || [],
                trackingGoals: category.healthContext?.trackingGoals || [],
                dateRange: {
                    from: category.firstSeenAt,
                    to: category.lastSeenAt
                },
                entries: category.entries.map(entry => ({
                    timestamp: entry.timestamp,
                    userEntry: entry.userLogEntry,
                    claudeAnalysis: entry.claudeLogMessage,
                    tags: entry.claudeTags,
                    observations: entry.claudeObservations,
                    questions: entry.claudeQuestions,
                    pathways: entry.claudePotentialPathways
                }))
            }))
        };
    }
}

// Create singleton instance
const healthCategorizer = new HealthIssueCategorizer();

// Export for use in other modules
window.HealthCategorizer = healthCategorizer;