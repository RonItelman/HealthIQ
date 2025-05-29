// Claude API Module

const API = {
    // Configuration
    CLAUDE_MODEL: 'claude-3-sonnet-20240229',
    
    // Get the API endpoint URL
    getApiUrl() {
        return window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api/claude'  
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
    createLogEntryPrompt(logEntry, healthIssues, healthAnalysis) {
        return `You are analyzing a health log entry. The user is tracking their activities and feelings to understand their health issues better.

HEALTH CONTEXT:
User's Health Issues: ${healthIssues}
Previous Analysis: ${healthAnalysis}

NEW LOG ENTRY:
Timestamp: ${new Date(logEntry.timestamp).toLocaleString()}
Content: ${logEntry.content}

Please provide:
1. Relevant observations about this entry in context of their health issues
2. Questions that might help gather more useful data
3. Any nutritional concerns (gluten, sugar, etc.) if food is mentioned
4. Metadata tags for this entry such as: "exercise", "nutrition", "sleep", "emotion", "physical_sensation", "medication", "symptom", etc.
5. Any patterns or connections to their health issues

Format your response with clear sections. Be helpful but concise.`;
    }
};

// Export for use in other modules
window.API = API;