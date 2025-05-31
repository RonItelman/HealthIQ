# Dots Log Entry JSON Structure

Each log entry is stored with the following JSON structure:

```json
{
    "id": 1735423856789,
    "timestamp": "2025-05-31T13:10:56.789Z",
    "version": "1.0",
    
    // User's original log entry text
    "userLogEntry": "Woke up feeling tired despite 8 hours of sleep. Had oatmeal for breakfast.",
    
    // Claude's health context response (persisted snapshot)
    "claudeHealthContext": {
        "fullResponse": "Full text of Claude's analysis of the user's health issues...",
        "conditions": [
            "Chronic Fatigue: Persistent exhaustion affecting daily activities",
            "Eczema: Skin inflammation and irritation, severity varies",
            "Sinus Issues: Chronic congestion, post-nasal drip, sinus pressure",
            "Breathing Difficulties: Shortness of breath, chest tightness"
        ],
        "triggers": [
            "Food sensitivities (possibly gluten, dairy, processed foods)",
            "Environmental factors",
            "Stress and sleep quality",
            "Physical exertion levels"
        ],
        "trackingGoals": [
            "Identify specific food triggers through detailed tracking",
            "Find patterns between diet, activities, and symptom severity",
            "Optimize daily routines to minimize fatigue"
        ],
        "capturedAt": "2025-05-31T10:00:00.000Z"
    },
    
    // Claude's item-level response (JSON format)
    "claudeLogMessage": "Despite getting 8 hours of sleep, your fatigue upon waking could indicate non-restorative sleep, which is common with chronic fatigue syndrome. The oatmeal breakfast is a good choice for sustained energy, though some people with food sensitivities react to oats or gluten.",
    
    // Claude's item-level tags
    "claudeTags": [
        "sleep-recovery",
        "food-trigger",
        "symptom-morning"
    ],
    
    // Claude's observations about patterns
    "claudeObservations": [
        "Morning fatigue despite adequate sleep duration",
        "Oatmeal choice aligns with complex carb recommendations",
        "No mention of other symptoms (skin, sinus, breathing)"
    ],
    
    // Claude's follow-up questions
    "claudeQuestions": [
        "What time did you go to bed and wake up?",
        "How would you rate your sleep quality on a scale of 1-10?",
        "Did you notice any skin irritation or sinus congestion this morning?",
        "How did you feel 30-60 minutes after eating the oatmeal?"
    ],
    
    // Claude's suggested exploration pathways
    "claudePotentialPathways": [
        "Track sleep quality metrics (not just duration) for a week to identify patterns",
        "Try different breakfast options (eggs, rice) to compare energy responses",
        "Log morning symptoms immediately upon waking vs. 30 minutes later"
    ],
    
    // Analysis metadata
    "analysisMetadata": {
        "analyzedAt": "2025-05-31T13:11:02.123Z",
        "promptUsed": "Full prompt text sent to Claude...",
        "modelUsed": "claude-3-sonnet-20240229"
    },
    
}
```

## Claude's Response Format

When analyzing a log entry, Claude returns JSON in this format:

```json
{
    "message": "Core analysis of how the log entry relates to health conditions",
    "tags": ["food-trigger", "symptom-morning"],
    "observations": [
        "Key observation about timing or pattern",
        "Notable correlation or absence"
    ],
    "questions": [
        "Specific follow-up question?",
        "Data point to track next time?"
    ],
    "potential_pathways": [
        "Hypothesis to test or explore",
        "Experiment to try for better data"
    ]
}
```

## Tag Categories

Tags focus on relationships between activities and symptoms:
- `food-trigger` - Food caused symptom flare
- `food-safe` - Food was well-tolerated
- `exercise-impact` - Physical activity affected symptoms
- `stress-trigger` - Stress correlated with symptoms
- `sleep-recovery` - Sleep quality affected recovery
- `symptom-improvement` - Symptoms got better
- `symptom-flare` - Symptoms got worse
- `medication-effect` - Medication impact noted
- `environmental-trigger` - Environment affected symptoms
- `symptom-morning` - Morning-specific symptoms
- `symptom-evening` - Evening-specific symptoms