// HealthCategorizerService - Categorizes log entries based on health context

class HealthCategorizerService {
    constructor() {
        this.categories = {
            symptoms: ['pain', 'fatigue', 'nausea', 'headache', 'dizziness', 'fever'],
            mood: ['happy', 'sad', 'anxious', 'stressed', 'calm', 'irritated'],
            sleep: ['sleep', 'tired', 'insomnia', 'rest', 'dream', 'woke'],
            energy: ['energy', 'energetic', 'sluggish', 'alert', 'drowsy'],
            food: ['food', 'eat', 'meal', 'hungry', 'appetite', 'diet'],
            exercise: ['exercise', 'workout', 'walk', 'run', 'gym', 'active'],
            medication: ['medication', 'pill', 'dose', 'treatment', 'therapy'],
            social: ['friends', 'family', 'social', 'alone', 'people', 'visit'],
            work: ['work', 'job', 'office', 'meeting', 'project', 'deadline'],
            weather: ['weather', 'sunny', 'rainy', 'cold', 'hot', 'humid']
        };
        
        this.patterns = {
            improvement: ['better', 'improved', 'good', 'great', 'well', 'fine'],
            worsening: ['worse', 'bad', 'terrible', 'awful', 'horrible', 'sick'],
            stability: ['same', 'stable', 'steady', 'consistent', 'unchanged'],
            triggers: ['triggered', 'caused', 'started', 'brought on', 'led to']
        };
        
        if (window.DebugStore) {
            DebugStore.debug('HealthCategorizerService initialized', {
                categoryCount: Object.keys(this.categories).length,
                patternCount: Object.keys(this.patterns).length
            }, 'HEALTHCATEGORIZER');
        }
    }
    
    /**
     * Initialize service
     */
    init() {
        // Load custom categories from health profile if available
        this.loadCustomCategories();
        
        if (window.DebugStore) {
            DebugStore.debug('HealthCategorizerService init completed', {}, 'HEALTHCATEGORIZER');
        }
    }
    
    /**
     * Categorize a log entry
     * @param {Object} logEntry - Log entry to categorize
     * @param {HealthProfile} healthProfile - Health context
     * @returns {Promise<Object>} - Categorization result
     */
    async categorizeEntry(logEntry, healthProfile) {
        if (window.DebugStore) {
            DebugStore.debug('Categorizing log entry', {
                logId: logEntry.id,
                contentLength: logEntry.content.length,
                hasHealthProfile: !!healthProfile
            }, 'HEALTHCATEGORIZER');
        }
        
        try {
            const content = logEntry.content.toLowerCase();
            const result = {
                entryId: logEntry.id,
                categories: {},
                patterns: {},
                confidence: 0,
                timestamp: new Date().toISOString()
            };
            
            // Categorize by health topics
            result.categories = this.detectCategories(content);
            
            // Detect health patterns
            result.patterns = this.detectPatterns(content);
            
            // Calculate confidence score
            result.confidence = this.calculateConfidence(result.categories, result.patterns);
            
            // Add health profile specific categorization
            if (healthProfile && healthProfile.hasContext()) {
                const contextCategories = this.categorizeWithHealthContext(content, healthProfile);
                result.healthContextCategories = contextCategories;
            }
            
            if (window.DebugStore) {
                DebugStore.success('Log entry categorized', {
                    logId: logEntry.id,
                    categoryCount: Object.keys(result.categories).length,
                    patternCount: Object.keys(result.patterns).length,
                    confidence: result.confidence
                }, 'HEALTHCATEGORIZER');
            }
            
            return result;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Log entry categorization failed', {
                    logId: logEntry.id,
                    error: error.message
                }, 'HEALTHCATEGORIZER');
            }
            throw error;
        }
    }
    
    /**
     * Detect categories in content
     * @param {string} content - Content to analyze
     * @returns {Object} - Detected categories with scores
     */
    detectCategories(content) {
        const detected = {};
        
        for (const [category, keywords] of Object.entries(this.categories)) {
            const score = this.calculateCategoryScore(content, keywords);
            if (score > 0) {
                detected[category] = {
                    score: score,
                    matches: keywords.filter(keyword => content.includes(keyword))
                };
            }
        }
        
        return detected;
    }
    
    /**
     * Detect health patterns in content
     * @param {string} content - Content to analyze
     * @returns {Object} - Detected patterns
     */
    detectPatterns(content) {
        const detected = {};
        
        for (const [pattern, keywords] of Object.entries(this.patterns)) {
            const matches = keywords.filter(keyword => content.includes(keyword));
            if (matches.length > 0) {
                detected[pattern] = {
                    matches: matches,
                    strength: matches.length / keywords.length
                };
            }
        }
        
        return detected;
    }
    
    /**
     * Calculate category score based on keyword matches
     * @param {string} content - Content to analyze
     * @param {Array} keywords - Keywords to look for
     * @returns {number} - Score (0-1)
     */
    calculateCategoryScore(content, keywords) {
        let score = 0;
        let totalKeywords = keywords.length;
        
        for (const keyword of keywords) {
            if (content.includes(keyword)) {
                // Give higher score for exact matches
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = content.match(regex);
                if (matches) {
                    score += matches.length;
                } else {
                    score += 0.5; // Partial match
                }
            }
        }
        
        // Normalize score
        return Math.min(score / totalKeywords, 1);
    }
    
    /**
     * Categorize with health context
     * @param {string} content - Content to analyze
     * @param {HealthProfile} healthProfile - Health context
     * @returns {Object} - Health context specific categories
     */
    categorizeWithHealthContext(content, healthProfile) {
        const contextCategories = {};
        
        // Extract health-specific terms from profile
        const healthDescription = healthProfile.description.toLowerCase();
        const healthTerms = this.extractHealthTerms(healthDescription);
        
        // Check for mentions of user's specific health conditions
        for (const term of healthTerms) {
            if (content.includes(term)) {
                if (!contextCategories.personalConditions) {
                    contextCategories.personalConditions = [];
                }
                contextCategories.personalConditions.push(term);
            }
        }
        
        // Check for correlation with previously analyzed entries
        // This would require access to historical data
        
        return contextCategories;
    }
    
    /**
     * Extract health terms from profile description
     * @param {string} description - Health description
     * @returns {Array} - Extracted health terms
     */
    extractHealthTerms(description) {
        // Simple extraction - could be enhanced with NLP
        const medicalTerms = [
            'diabetes', 'hypertension', 'anxiety', 'depression', 'migraine',
            'arthritis', 'asthma', 'allergies', 'insomnia', 'fatigue',
            'chronic pain', 'fibromyalgia', 'ibs', 'gerd', 'thyroid'
        ];
        
        return medicalTerms.filter(term => description.includes(term));
    }
    
    /**
     * Calculate overall confidence score
     * @param {Object} categories - Detected categories
     * @param {Object} patterns - Detected patterns
     * @returns {number} - Confidence score (0-1)
     */
    calculateConfidence(categories, patterns) {
        const categoryCount = Object.keys(categories).length;
        const patternCount = Object.keys(patterns).length;
        
        // Base confidence on number of matches
        let confidence = 0;
        
        // Category confidence
        const categoryScores = Object.values(categories).map(cat => cat.score);
        if (categoryScores.length > 0) {
            confidence += categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length * 0.7;
        }
        
        // Pattern confidence
        if (patternCount > 0) {
            confidence += (patternCount / Object.keys(this.patterns).length) * 0.3;
        }
        
        return Math.min(confidence, 1);
    }
    
    /**
     * Get category summary for multiple entries
     * @param {Array} categorizations - Array of categorization results
     * @returns {Object} - Summary statistics
     */
    getSummary(categorizations) {
        const summary = {
            totalEntries: categorizations.length,
            topCategories: {},
            topPatterns: {},
            averageConfidence: 0,
            trends: {}
        };
        
        // Aggregate categories
        const categoryTotals = {};
        const patternTotals = {};
        let totalConfidence = 0;
        
        for (const result of categorizations) {
            // Sum category scores
            for (const [category, data] of Object.entries(result.categories)) {
                categoryTotals[category] = (categoryTotals[category] || 0) + data.score;
            }
            
            // Count patterns
            for (const pattern of Object.keys(result.patterns)) {
                patternTotals[pattern] = (patternTotals[pattern] || 0) + 1;
            }
            
            totalConfidence += result.confidence;
        }
        
        // Calculate averages and sort
        summary.topCategories = Object.entries(categoryTotals)
            .map(([category, total]) => ({
                category,
                averageScore: total / categorizations.length,
                frequency: categorizations.filter(r => r.categories[category]).length
            }))
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 5);
        
        summary.topPatterns = Object.entries(patternTotals)
            .map(([pattern, count]) => ({
                pattern,
                count,
                frequency: count / categorizations.length
            }))
            .sort((a, b) => b.count - a.count);
        
        summary.averageConfidence = totalConfidence / categorizations.length;
        
        return summary;
    }
    
    /**
     * Load custom categories from storage or health profile
     */
    loadCustomCategories() {
        try {
            const customCategories = localStorage.getItem('customHealthCategories');
            if (customCategories) {
                const custom = JSON.parse(customCategories);
                this.categories = { ...this.categories, ...custom };
                
                if (window.DebugStore) {
                    DebugStore.debug('Custom categories loaded', {
                        customCount: Object.keys(custom).length
                    }, 'HEALTHCATEGORIZER');
                }
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.warn('Failed to load custom categories', {
                    error: error.message
                }, 'HEALTHCATEGORIZER');
            }
        }
    }
    
    /**
     * Save custom categories
     * @param {Object} customCategories - Custom categories to save
     */
    saveCustomCategories(customCategories) {
        try {
            localStorage.setItem('customHealthCategories', JSON.stringify(customCategories));
            this.categories = { ...this.categories, ...customCategories };
            
            if (window.DebugStore) {
                DebugStore.success('Custom categories saved', {
                    customCount: Object.keys(customCategories).length
                }, 'HEALTHCATEGORIZER');
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to save custom categories', {
                    error: error.message
                }, 'HEALTHCATEGORIZER');
            }
            throw error;
        }
    }
    
    /**
     * Add custom category
     * @param {string} name - Category name
     * @param {Array} keywords - Keywords for category
     */
    addCustomCategory(name, keywords) {
        if (!name || !Array.isArray(keywords)) {
            throw new Error('Invalid category name or keywords');
        }
        
        this.categories[name] = keywords;
        
        // Save to storage
        const customCategories = JSON.parse(localStorage.getItem('customHealthCategories') || '{}');
        customCategories[name] = keywords;
        this.saveCustomCategories(customCategories);
        
        if (window.DebugStore) {
            DebugStore.info('Custom category added', {
                name: name,
                keywordCount: keywords.length
            }, 'HEALTHCATEGORIZER');
        }
    }
    
    /**
     * Get available categories
     * @returns {Object} - All available categories
     */
    getCategories() {
        return { ...this.categories };
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service statistics
     */
    getStats() {
        return {
            categoryCount: Object.keys(this.categories).length,
            patternCount: Object.keys(this.patterns).length,
            totalKeywords: Object.values(this.categories).flat().length
        };
    }
}

// Export for use in other modules
window.HealthCategorizerService = HealthCategorizerService;