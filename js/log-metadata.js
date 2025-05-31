// Log Item Metadata Manager - Manages enriched log entries with health context

class LogItemMetadataManager {
    constructor() {
        this.METADATA_VERSION = '2.0';  // Updated to clean structure
    }
    
    // Create enriched log entry with full metadata
    createEnrichedLogEntry(content) {
        const timestamp = new Date().toISOString();
        const healthContext = window.HealthContext ? window.HealthContext.getFullContext() : null;
        
        return {
            id: Date.now(),
            timestamp: timestamp,
            version: this.METADATA_VERSION,
            
            // User's log entry
            userLogEntry: content,
            
            // Claude's health context response (persisted)
            claudeHealthContext: healthContext ? {
                fullResponse: healthContext.claudeAnalysis || '',
                conditions: healthContext.structuredData?.conditions || [],
                triggers: healthContext.structuredData?.triggers || [],
                trackingGoals: healthContext.structuredData?.trackingQuestions || [],
                capturedAt: healthContext.lastUpdated || timestamp
            } : null,
            
            // Claude's item-level response (will be populated async)
            claudeLogMessage: undefined,
            
            // Claude's item-level tags
            claudeTags: [],
            
            // Claude's observations about this entry
            claudeObservations: [],
            
            // Claude's follow-up questions
            claudeQuestions: [],
            
            // Claude's suggested exploration pathways
            claudePotentialPathways: [],
            
            // Analysis metadata
            analysisMetadata: {
                analyzedAt: null,
                promptUsed: null,
                modelUsed: 'claude-3-sonnet-20240229'
            }
        };
    }
    
    // Update entry with Claude's analysis
    updateWithAnalysis(entry, analysisResponse, promptUsed) {
        console.log('Updating entry with analysis:', analysisResponse);
        
        // Parse JSON response from Claude
        const parsedResponse = window.API.parseJsonResponse(analysisResponse);
        console.log('Parsed response:', parsedResponse);
        
        // Update the entry with Claude's response
        entry.claudeLogMessage = parsedResponse.message || analysisResponse;
        entry.claudeTags = parsedResponse.tags || [];
        entry.claudeObservations = parsedResponse.observations || [];
        entry.claudeQuestions = parsedResponse.questions || [];
        entry.claudePotentialPathways = parsedResponse.potential_pathways || [];
        
        // Update analysis metadata
        entry.analysisMetadata.analyzedAt = new Date().toISOString();
        entry.analysisMetadata.promptUsed = promptUsed;
        
        // Remove legacy structure to avoid duplication
        delete entry.analysis;
        
        console.log('Updated entry:', entry);
        return entry;
    }
    
    // Extract tags from Claude's response
    extractTagsFromAnalysis(analysis) {
        const tags = [];
        const lowerAnalysis = analysis.toLowerCase();
        
        // Only extract tags that represent relationships between activities and health context
        // Focus on activity-symptom connections mentioned in the analysis
        
        // Look for activity triggers mentioned in relation to symptoms
        if (lowerAnalysis.includes('after eating') || lowerAnalysis.includes('food') && lowerAnalysis.includes('symptom')) {
            tags.push('food-trigger');
        }
        
        if (lowerAnalysis.includes('exercise') && (lowerAnalysis.includes('fatigue') || lowerAnalysis.includes('crash') || lowerAnalysis.includes('symptom'))) {
            tags.push('exercise-impact');
        }
        
        if (lowerAnalysis.includes('stress') && (lowerAnalysis.includes('flare') || lowerAnalysis.includes('symptom') || lowerAnalysis.includes('worse'))) {
            tags.push('stress-trigger');
        }
        
        if (lowerAnalysis.includes('sleep') && (lowerAnalysis.includes('recovery') || lowerAnalysis.includes('better') || lowerAnalysis.includes('improve'))) {
            tags.push('sleep-recovery');
        }
        
        // Look for symptom improvement or worsening
        if (lowerAnalysis.includes('improve') || lowerAnalysis.includes('better') || lowerAnalysis.includes('relief')) {
            tags.push('symptom-improvement');
        }
        
        if (lowerAnalysis.includes('worse') || lowerAnalysis.includes('flare') || lowerAnalysis.includes('crash')) {
            tags.push('symptom-flare');
        }
        
        // Look for explicitly mentioned relationship tags in Claude's analysis
        const tagMatch = analysis.match(/tags?:([^.]+)/i);
        if (tagMatch) {
            const explicitTags = tagMatch[1]
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.includes('-') || t.includes('trigger') || t.includes('impact')); // Only relationship tags
            tags.push(...explicitTags);
        }
        
        return [...new Set(tags)]; // Remove duplicates
    }
    
    // Extract key insights from analysis
    extractInsightsFromAnalysis(analysis) {
        const insights = [];
        
        // Look for numbered insights or bullet points
        const numberedInsights = analysis.match(/\d+\.\s*([^.]+\.)/g);
        if (numberedInsights) {
            insights.push(...numberedInsights.map(i => i.replace(/^\d+\.\s*/, '')));
        }
        
        // Look for pattern mentions
        if (analysis.includes('pattern')) {
            const patternMatch = analysis.match(/pattern[^.]+\./i);
            if (patternMatch) {
                insights.push(patternMatch[0]);
            }
        }
        
        return insights.slice(0, 3); // Limit to top 3 insights
    }
    
    // Format entry for display
    formatForDisplay(entry) {
        return {
            id: entry.id,
            timestamp: entry.timestamp,
            
            // Section 1: User Entry
            userContent: entry.userEntry.content,
            userTimestamp: this.formatTimestamp(entry.userEntry.timestamp),
            
            // Section 2: Health Context (if available)
            healthSummary: entry.healthContext ? {
                conditions: entry.healthContext.conditions.join(', '),
                summary: this.truncateSummary(entry.healthContext.summary, 150)
            } : null,
            
            // Section 3: Claude's Analysis
            analysis: entry.analysis.response ? {
                response: entry.analysis.response,
                tags: entry.analysis.tags,
                timestamp: this.formatTimestamp(entry.analysis.analyzedAt)
            } : null,
            
            // Combined tags
            allTags: [...(entry.analysis.tags || []), ...(entry.userTags || [])]
        };
    }
    
    // Format timestamp for display
    formatTimestamp(isoString) {
        if (!isoString) return '';
        
        const date = new Date(isoString);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);
        
        if (diffHours < 1) {
            const diffMins = Math.floor((now - date) / (1000 * 60));
            return `${diffMins} minutes ago`;
        } else if (diffHours < 24) {
            return `${Math.floor(diffHours)} hours ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // Truncate summary for preview
    truncateSummary(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Migrate old log entries to new format
    migrateOldEntry(oldEntry) {
        const enriched = this.createEnrichedLogEntry(oldEntry.content || oldEntry.userEntry?.content || '');
        
        // Preserve original timestamp and ID
        enriched.timestamp = oldEntry.timestamp;
        enriched.id = oldEntry.id || Date.parse(oldEntry.timestamp);
        
        // Migrate analysis if exists
        if (oldEntry.analysis) {
            enriched.claudeLogMessage = oldEntry.analysis.claudeAnalysis || oldEntry.analysis.response || oldEntry.analysis;
            enriched.claudeTags = oldEntry.analysis.tags || oldEntry.metaTags || [];
            enriched.analysisMetadata.analyzedAt = oldEntry.analysis.analyzedAt || oldEntry.timestamp;
            
            // Don't keep legacy structure in v2.0
        }
        
        // Migrate health context if exists
        if (oldEntry.healthContext) {
            enriched.claudeHealthContext = oldEntry.healthContext;
        } else if (oldEntry.healthIssues) {
            enriched.claudeHealthContext = {
                fullResponse: oldEntry.healthIssues,
                conditions: [],
                triggers: [],
                trackingGoals: [],
                capturedAt: oldEntry.timestamp
            };
        }
        
        return enriched;
    }
    
    // Check if entry needs migration
    needsMigration(entry) {
        // Check if it's using the new structure
        return !entry.version || 
               entry.version !== this.METADATA_VERSION || 
               !entry.hasOwnProperty('userLogEntry') ||
               !entry.hasOwnProperty('claudeHealthContext') ||
               !entry.hasOwnProperty('claudeLogMessage') ||
               entry.hasOwnProperty('analysis');  // Old entries have this duplicate field
    }
}

// Create singleton instance
const logMetadata = new LogItemMetadataManager();

// Export for use in other modules
window.LogMetadata = logMetadata;