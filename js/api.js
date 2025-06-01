// Claude API Module

const API = {
    // Configuration
    CLAUDE_MODEL: 'claude-3-sonnet-20240229',
    
    // Get the API endpoint URL
    getApiUrl() {
        return window.location.hostname === 'localhost' 
            ? 'http://localhost:8000/api/claude'  
            : '/api/claude';
    },
    
    // Call Claude API
    async callClaude(prompt) {
        try {
            const response = await fetch(this.getApiUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.CLAUDE_MODEL,
                    max_tokens: 1024,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }
            
            const data = await response.json();
            return data.content[0].text;
            
        } catch (error) {
            console.error('Claude API Error:', error);
            throw error; // Re-throw to handle in UI
        }
    },
    
    // Create health issues analysis prompt
    createHealthIssuesPrompt(description) {
        return `You are a health analysis assistant. A user has provided their health issues description. Please analyze it and provide:

1. A structured summary of their health issues
2. Suggested metadata tags that would be useful for categorizing health logs
3. Key questions they should consider tracking in their logs
4. Any patterns or connections you notice

Health Issues Description:
${description}

Please format your response with clear sections and be concise but comprehensive.`;
    },
    
    // Create log entry analysis prompt
    createLogEntryPrompt(logEntry) {
        // Get health context if available
        const contextStr = window.HealthContext ? window.HealthContext.generatePromptContext() : '';
        
        return `You are analyzing a health log entry. The user is tracking their activities and feelings to understand their health issues better.
${contextStr}

NEW LOG ENTRY:
Timestamp: ${new Date(logEntry.timestamp).toLocaleString()}
Content: ${logEntry.userLogEntry || logEntry.content || logEntry.userEntry?.content || ''}

IMPORTANT: You MUST respond with valid JSON in exactly this format:
{
    "message": "Your main analysis of how this log entry relates to their health conditions. Use \\n for line breaks. Escape quotes with \\". Keep as a single line string.",
    "tags": ["tag1", "tag2", "tag3"],
    "observations": ["observation1", "observation2"],
    "questions": ["question1?", "question2?"],
    "potential_pathways": ["pathway1", "pathway2"]
}

Field definitions:
- message: Core analysis relating the log to health conditions
- tags: Activity-symptom relationship tags (see list below)
- observations: Key observations about patterns, timing, or correlations
- questions: Specific questions to help gather more useful data next time
- potential_pathways: Hypotheses or areas to explore (e.g., "Try logging food 30min before/after meals to catch delayed reactions")

Be specific and actionable. Focus on finding patterns and connections.
IMPORTANT: Analyze EVERY entry, even simple ones like "went to gym" or "ate pizza". For simple entries:
- Still provide relevant tags (e.g., "exercise-impact" for gym)
- Ask follow-up questions to get more detail next time
- Note what information would be helpful

Remember: The JSON must be valid! Use \\n for newlines within string fields.

For tags, focus on activity-symptom relationships like:
- "food-trigger" (if certain foods triggered symptoms)
- "exercise-impact" (if exercise affected symptoms)
- "stress-trigger" (if stress correlates with symptoms)
- "sleep-recovery" (if sleep helped symptoms)
- "symptom-improvement" (if symptoms got better)
- "symptom-flare" (if symptoms got worse)
- "medication-effect" (if medication was mentioned)
- "environmental-trigger" (if environment affected symptoms)

Only include tags that represent actual relationships between the log entry and health conditions, not generic health tags.`;
    },
    
    // Parse JSON response from Claude
    parseJsonResponse(response) {
        // Check if response is valid
        if (!response || typeof response !== 'string') {
            console.error('Invalid response:', response);
            return {
                message: 'No response received',
                tags: [],
                observations: [],
                questions: [],
                potential_pathways: []
            };
        }
        
        try {
            // First try to parse as-is
            return JSON.parse(response);
        } catch (e) {
            // If that fails, try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    // Clean up the JSON string by escaping control characters
                    let cleanJson = jsonMatch[0]
                        .replace(/\n/g, '\\n')  // Escape newlines
                        .replace(/\r/g, '\\r')  // Escape carriage returns
                        .replace(/\t/g, '\\t')  // Escape tabs
                        .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove other control characters
                    
                    // Fix any double-escaped characters
                    cleanJson = cleanJson.replace(/\\\\n/g, '\\n');
                    
                    return JSON.parse(cleanJson);
                } catch (e2) {
                    console.error('Failed to parse JSON from response:', e2);
                    console.log('Attempted to parse:', jsonMatch[0]);
                    
                    // Try one more time with a more aggressive approach
                    try {
                        // Extract message and tags manually
                        const messageMatch = response.match(/"message"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
                        const tagsMatch = response.match(/"tags"\s*:\s*\[([^\]]*)\]/);
                        
                        const message = messageMatch ? 
                            messageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 
                            response;
                        
                        const tags = tagsMatch ? 
                            tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : 
                            [];
                        
                        return {
                            message: message,
                            tags: tags.filter(t => t.length > 0),
                            observations: [],
                            questions: [],
                            potential_pathways: []
                        };
                    } catch (e3) {
                        // Return a fallback structure
                        return {
                            message: response,
                            tags: [],
                            observations: [],
                            questions: [],
                            potential_pathways: []
                        };
                    }
                }
            }
            // Final fallback
            return {
                message: response,
                tags: [],
                observations: [],
                questions: [],
                potential_pathways: []
            };
        }
    }
};

// Export for use in other modules
window.API = API;