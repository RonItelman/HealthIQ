// HealthAnalysisService - Handles AI analysis for health context and log entries

class HealthAnalysisService {
    constructor() {
        this.apiService = window.API; // Use existing API service
        
        if (window.DebugStore) {
            DebugStore.debug('HealthAnalysisService initialized', {}, 'HEALTHANALYSIS');
        }
    }
    
    /**
     * Analyze health profile description with Claude
     * @param {string} description - Health description to analyze
     * @returns {Promise<string>} - Claude's analysis
     */
    async analyzeProfile(description) {
        if (window.DebugStore) {
            DebugStore.info('Starting health profile analysis', {
                descriptionLength: description.length
            }, 'HEALTHANALYSIS');
        }
        
        const timer = window.DebugStore ? DebugStore.startTimer('analyzeHealthProfile') : null;
        
        try {
            // Validate description
            const validation = ValidationHelper.validateHealthDescription(description);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            
            // Build analysis prompt
            const prompt = this.buildProfileAnalysisPrompt(description);
            
            // Call Claude API
            const response = await this.apiService.callClaude(prompt);
            
            if (!response) {
                throw new Error('No response received from Claude API');
            }
            
            timer?.end();
            
            if (window.DebugStore) {
                DebugStore.success('Health profile analysis completed', {
                    descriptionLength: description.length,
                    responseLength: response.length,
                    analysisTime: timer ? `${timer.end()}ms` : 'unknown'
                }, 'HEALTHANALYSIS');
            }
            
            return response;
            
        } catch (error) {
            timer?.end();
            
            if (window.DebugStore) {
                DebugStore.error('Health profile analysis failed', {
                    error: error.message,
                    descriptionLength: description.length,
                    analysisTime: timer ? `${timer.end()}ms` : 'unknown'
                }, 'HEALTHANALYSIS');
            }
            
            throw error;
        }
    }
    
    /**
     * Analyze log entry in context of health profile
     * @param {Object} logEntry - Log entry to analyze
     * @param {HealthProfile} healthProfile - Health context
     * @returns {Promise<Object>} - Analysis result
     */
    async analyzeLogEntry(logEntry, healthProfile) {
        if (window.DebugStore) {
            DebugStore.info('Starting log entry analysis', {
                logId: logEntry.id,
                contentLength: logEntry.content.length,
                hasHealthContext: healthProfile?.hasContext()
            }, 'HEALTHANALYSIS');
        }
        
        const timer = window.DebugStore ? DebugStore.startTimer('analyzeLogEntry') : null;
        
        try {
            if (!healthProfile || !healthProfile.hasContext()) {
                throw new Error('Health profile context required for analysis');
            }
            
            // Build log analysis prompt
            const prompt = this.buildLogAnalysisPrompt(logEntry, healthProfile);
            
            // Call Claude API
            const response = await this.apiService.callClaude(prompt);
            
            if (!response) {
                throw new Error('No response received from Claude API');
            }
            
            // Parse structured response
            const analysis = this.parseLogAnalysisResponse(response);
            
            timer?.end();
            
            if (window.DebugStore) {
                DebugStore.success('Log entry analysis completed', {
                    logId: logEntry.id,
                    hasMessage: !!analysis.message,
                    tagCount: analysis.tags?.length || 0,
                    observationCount: analysis.observations?.length || 0,
                    analysisTime: timer ? `${timer.end()}ms` : 'unknown'
                }, 'HEALTHANALYSIS');
            }
            
            return analysis;
            
        } catch (error) {
            timer?.end();
            
            if (window.DebugStore) {
                DebugStore.error('Log entry analysis failed', {
                    logId: logEntry?.id,
                    error: error.message,
                    analysisTime: timer ? `${timer.end()}ms` : 'unknown'
                }, 'HEALTHANALYSIS');
            }
            
            throw error;
        }
    }
    
    /**
     * Build prompt for health profile analysis
     * @param {string} description - Health description
     * @returns {string} - Formatted prompt
     */
    buildProfileAnalysisPrompt(description) {
        return `You are a health analysis assistant helping someone track their health patterns. Please analyze the following health context and provide guidance.

Health Description:
${description}

Please provide:
1. A summary of the key health conditions and concerns mentioned
2. Important patterns or triggers to watch for in daily logs
3. Specific symptoms or changes that would be worth tracking
4. Questions or areas where more information would be helpful
5. Suggestions for what to log to better understand these health issues

Keep your response clear, empathetic, and focused on practical tracking guidance. Format your response in clear sections.`;
    }
    
    /**
     * Build prompt for log entry analysis
     * @param {Object} logEntry - Log entry
     * @param {HealthProfile} healthProfile - Health context
     * @returns {string} - Formatted prompt
     */
    buildLogAnalysisPrompt(logEntry, healthProfile) {
        const healthContext = healthProfile.getFormattedDescription();
        const healthAnalysis = healthProfile.getFormattedAnalysis();
        
        return `You are a health tracking assistant. Analyze this daily log entry in the context of the user's health profile.

HEALTH CONTEXT:
${healthContext}

${healthAnalysis ? `PREVIOUS HEALTH ANALYSIS:\n${healthAnalysis}\n` : ''}

TODAY'S LOG ENTRY:
${logEntry.content}

Please analyze this entry and provide:

ANALYSIS: A brief analysis of what this entry reveals about their health patterns, symptoms, or progress.

TAGS: 3-5 relevant tags (comma-separated) like: sleep, energy, pain, mood, medication, exercise, food, symptoms

OBSERVATIONS: Key observations about patterns, changes, or notable details (2-4 bullet points)

QUESTIONS: Thoughtful questions to consider for future tracking (1-3 questions)

PATHWAYS: Potential connections to explore or next steps to consider (1-3 suggestions)

Format your response exactly like this:

ANALYSIS:
[Your analysis here]

TAGS:
tag1, tag2, tag3, tag4

OBSERVATIONS:
• [Observation 1]
• [Observation 2]
• [Observation 3]

QUESTIONS:
• [Question 1]
• [Question 2]

PATHWAYS:
• [Pathway 1]
• [Pathway 2]`;
    }
    
    /**
     * Parse structured log analysis response
     * @param {string} response - Claude's response
     * @returns {Object} - Parsed analysis
     */
    parseLogAnalysisResponse(response) {
        try {
            const analysis = {
                message: '',
                tags: [],
                observations: [],
                questions: [],
                potentialPathways: []
            };
            
            // Extract sections using regex patterns
            const sections = {
                analysis: /ANALYSIS:\s*([\s\S]*?)(?=TAGS:|$)/i,
                tags: /TAGS:\s*([\s\S]*?)(?=OBSERVATIONS:|$)/i,
                observations: /OBSERVATIONS:\s*([\s\S]*?)(?=QUESTIONS:|$)/i,
                questions: /QUESTIONS:\s*([\s\S]*?)(?=PATHWAYS:|$)/i,
                pathways: /PATHWAYS:\s*([\s\S]*?)$/i
            };
            
            // Extract main analysis
            const analysisMatch = response.match(sections.analysis);
            if (analysisMatch) {
                analysis.message = analysisMatch[1].trim();
            } else {
                // Fallback: use entire response as message if no structure found
                analysis.message = response.trim();
            }
            
            // Extract tags
            const tagsMatch = response.match(sections.tags);
            if (tagsMatch) {
                analysis.tags = tagsMatch[1]
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
            }
            
            // Extract observations
            const observationsMatch = response.match(sections.observations);
            if (observationsMatch) {
                analysis.observations = this.extractBulletPoints(observationsMatch[1]);
            }
            
            // Extract questions
            const questionsMatch = response.match(sections.questions);
            if (questionsMatch) {
                analysis.questions = this.extractBulletPoints(questionsMatch[1]);
            }
            
            // Extract pathways
            const pathwaysMatch = response.match(sections.pathways);
            if (pathwaysMatch) {
                analysis.potentialPathways = this.extractBulletPoints(pathwaysMatch[1]);
            }
            
            if (window.DebugStore) {
                DebugStore.debug('Parsed log analysis response', {
                    hasMessage: !!analysis.message,
                    tagCount: analysis.tags.length,
                    observationCount: analysis.observations.length,
                    questionCount: analysis.questions.length,
                    pathwayCount: analysis.potentialPathways.length
                }, 'HEALTHANALYSIS');
            }
            
            return analysis;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.warn('Failed to parse structured response, using raw response', {
                    error: error.message
                }, 'HEALTHANALYSIS');
            }
            
            // Fallback: return basic analysis with full response as message
            return {
                message: response.trim(),
                tags: [],
                observations: [],
                questions: [],
                potentialPathways: []
            };
        }
    }
    
    /**
     * Extract bullet points from text
     * @param {string} text - Text containing bullet points
     * @returns {Array} - Array of bullet point text
     */
    extractBulletPoints(text) {
        if (!text) return [];
        
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
            .map(line => line.replace(/^[•\-*]\s*/, '').trim())
            .filter(line => line.length > 0);
    }
    
    /**
     * Generate analysis summary for multiple entries
     * @param {Array} logEntries - Array of log entries with analysis
     * @param {HealthProfile} healthProfile - Health context
     * @returns {Promise<Object>} - Summary analysis
     */
    async generateSummary(logEntries, healthProfile) {
        if (!logEntries || logEntries.length === 0) {
            throw new Error('No log entries provided for summary');
        }
        
        if (window.DebugStore) {
            DebugStore.info('Generating analysis summary', {
                entryCount: logEntries.length,
                hasHealthContext: healthProfile?.hasContext()
            }, 'HEALTHANALYSIS');
        }
        
        try {
            const prompt = this.buildSummaryPrompt(logEntries, healthProfile);
            const response = await this.apiService.callClaude(prompt);
            
            if (window.DebugStore) {
                DebugStore.success('Analysis summary generated', {
                    entryCount: logEntries.length,
                    summaryLength: response?.length || 0
                }, 'HEALTHANALYSIS');
            }
            
            return {
                summary: response,
                entryCount: logEntries.length,
                dateRange: this.getDateRange(logEntries),
                generatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Analysis summary generation failed', {
                    error: error.message,
                    entryCount: logEntries.length
                }, 'HEALTHANALYSIS');
            }
            throw error;
        }
    }
    
    /**
     * Build prompt for summary analysis
     * @param {Array} logEntries - Log entries
     * @param {HealthProfile} healthProfile - Health context
     * @returns {string} - Summary prompt
     */
    buildSummaryPrompt(logEntries, healthProfile) {
        const healthContext = healthProfile?.getFormattedDescription() || '';
        const dateRange = this.getDateRange(logEntries);
        
        let entriesText = logEntries.map((entry, index) => {
            const date = DateFormatter.formatDate(entry.timestamp);
            return `Day ${index + 1} (${date}): ${entry.content}`;
        }).join('\n\n');
        
        return `Please analyze these health log entries as a group and provide insights about patterns, trends, and overall health status.

HEALTH CONTEXT:
${healthContext}

LOG ENTRIES (${dateRange}):
${entriesText}

Please provide a comprehensive summary including:
1. Overall patterns and trends observed
2. Notable changes or improvements
3. Concerning symptoms or patterns
4. Recommendations for continued tracking
5. Suggested next steps or areas to explore

Keep your analysis practical and actionable.`;
    }
    
    /**
     * Get date range from log entries
     * @param {Array} logEntries - Log entries
     * @returns {string} - Formatted date range
     */
    getDateRange(logEntries) {
        if (!logEntries || logEntries.length === 0) return '';
        
        const dates = logEntries.map(entry => new Date(entry.timestamp)).sort();
        const start = DateFormatter.formatDate(dates[0]);
        const end = DateFormatter.formatDate(dates[dates.length - 1]);
        
        return start === end ? start : `${start} - ${end}`;
    }
    
    /**
     * Check if analysis service is available
     * @returns {boolean} - True if service is ready
     */
    isAvailable() {
        return !!(this.apiService && this.apiService.callClaude);
    }
    
    /**
     * Get service status
     * @returns {Object} - Service status
     */
    getStatus() {
        return {
            available: this.isAvailable(),
            apiService: !!this.apiService,
            hasCallClaude: !!(this.apiService && this.apiService.callClaude)
        };
    }
}

// Export for use in other modules
window.HealthAnalysisService = HealthAnalysisService;