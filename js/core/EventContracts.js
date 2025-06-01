// EventContracts - Define all event types and their data contracts

class EventContracts {
    static initialize() {
        if (!window.EventBus) {
            console.error('EventBus must be initialized before contracts');
            return;
        }
        
        // Define all event contracts for validation and documentation
        this.defineLogEvents();
        this.defineAnalysisEvents();
        this.defineUIEvents();
        this.defineHealthEvents();
        this.defineSystemEvents();
        
        if (window.DebugStore) {
            DebugStore.info('Event contracts initialized', {
                totalContracts: this.getContractCount()
            }, 'EVENTCONTRACTS');
        }
    }
    
    /**
     * Define log management events
     */
    static defineLogEvents() {
        // Log entry lifecycle events
        EventBus.defineContract('logEntry:creating', {
            content: { required: true, type: 'string' },
            hasHealthContext: { required: false, type: 'boolean' },
            userAgent: { required: false, type: 'string' }
        });
        
        EventBus.defineContract('logEntry:created', {
            entry: { required: true, type: 'object' },
            stats: { required: true, type: 'object' },
            readyForAnalysis: { required: false, type: 'boolean' }
        });
        
        EventBus.defineContract('logEntry:updated', {
            entryId: { required: true, type: 'string' },
            oldContent: { required: true, type: 'string' },
            newContent: { required: true, type: 'string' },
            updatedAt: { required: true, type: 'string' }
        });
        
        EventBus.defineContract('logEntry:deleted', {
            entryId: { required: true, type: 'string' },
            content: { required: false, type: 'string' },
            hadAnalysis: { required: false, type: 'boolean' }
        });
        
        EventBus.defineContract('logEntry:error', {
            error: { required: true, type: 'object' },
            content: { required: false, type: 'string' },
            operation: { required: false, type: 'string' }
        });
        
        // Bulk operations
        EventBus.defineContract('logEntries:cleared', {
            count: { required: true, type: 'number' },
            timestamp: { required: true, type: 'string' }
        });
        
        EventBus.defineContract('logEntries:imported', {
            count: { required: true, type: 'number' },
            source: { required: false, type: 'string' },
            errors: { required: false, type: 'number' }
        });
    }
    
    /**
     * Define analysis events
     */
    static defineAnalysisEvents() {
        EventBus.defineContract('analysis:scheduled', {
            entryId: { required: true, type: 'string' },
            queuePosition: { required: false, type: 'number' },
            estimatedWait: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('analysis:started', {
            entryId: { required: true, type: 'string' },
            attempt: { required: false, type: 'number' },
            startTime: { required: true, type: 'string' }
        });
        
        EventBus.defineContract('analysis:completed', {
            entryId: { required: true, type: 'string' },
            analysis: { required: true, type: 'object' },
            processingTime: { required: false, type: 'number' },
            completedAt: { required: true, type: 'string' }
        });
        
        EventBus.defineContract('analysis:failed', {
            entryId: { required: true, type: 'string' },
            error: { required: true, type: 'object' },
            attempt: { required: false, type: 'number' },
            willRetry: { required: false, type: 'boolean' }
        });
        
        EventBus.defineContract('analysis:retrying', {
            entryId: { required: true, type: 'string' },
            attempt: { required: true, type: 'number' },
            maxAttempts: { required: true, type: 'number' },
            delay: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('analysis:queueUpdated', {
            queueLength: { required: true, type: 'number' },
            isProcessing: { required: true, type: 'boolean' },
            nextEntryId: { required: false, type: 'string' }
        });
    }
    
    /**
     * Define UI state events
     */
    static defineUIEvents() {
        EventBus.defineContract('view:changed', {
            previousView: { required: true, type: 'string' },
            currentView: { required: true, type: 'string' },
            timestamp: { required: true, type: 'string' }
        });
        
        EventBus.defineContract('modal:opened', {
            modalType: { required: true, type: 'string' },
            modalId: { required: false, type: 'string' },
            data: { required: false, type: 'object' }
        });
        
        EventBus.defineContract('modal:closed', {
            modalType: { required: true, type: 'string' },
            modalId: { required: false, type: 'string' },
            reason: { required: false, type: 'string' }
        });
        
        EventBus.defineContract('filter:applied', {
            filterType: { required: true, type: 'string' },
            filterValue: { required: true },
            resultCount: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('search:performed', {
            searchTerm: { required: true, type: 'string' },
            resultCount: { required: true, type: 'number' },
            searchTime: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('stats:updated', {
            totalEntries: { required: true, type: 'number' },
            todayEntries: { required: true, type: 'number' },
            analysisCount: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('toast:show', {
            message: { required: true, type: 'string' },
            type: { required: false, type: 'string' },
            duration: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('ui:refresh', {
            component: { required: false, type: 'string' },
            reason: { required: false, type: 'string' }
        });
    }
    
    /**
     * Define health context events
     */
    static defineHealthEvents() {
        EventBus.defineContract('health:contextUpdated', {
            description: { required: true, type: 'string' },
            previousDescription: { required: false, type: 'string' },
            wordCount: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('health:analysisUpdated', {
            analysis: { required: true, type: 'string' },
            description: { required: true, type: 'string' },
            analysisLength: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('health:profileCleared', {
            previousData: { required: false, type: 'object' },
            timestamp: { required: true, type: 'string' }
        });
        
        EventBus.defineContract('health:modalOpened', {
            hasExistingContext: { required: true, type: 'boolean' },
            contextLength: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('health:categoryDetected', {
            entryId: { required: true, type: 'string' },
            categories: { required: true, type: 'object' },
            confidence: { required: false, type: 'number' }
        });
    }
    
    /**
     * Define system events
     */
    static defineSystemEvents() {
        EventBus.defineContract('app:initialized', {
            version: { required: true, type: 'string' },
            buildDate: { required: false, type: 'string' },
            initTime: { required: false, type: 'number' },
            modules: { required: false, type: 'object' }
        });
        
        EventBus.defineContract('app:offline', {
            wasOnline: { required: true, type: 'boolean' },
            timestamp: { required: true, type: 'string' }
        });
        
        EventBus.defineContract('app:online', {
            wasOffline: { required: true, type: 'boolean' },
            timestamp: { required: true, type: 'string' },
            queuedActions: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('app:error', {
            error: { required: true, type: 'object' },
            component: { required: false, type: 'string' },
            severity: { required: false, type: 'string' },
            context: { required: false, type: 'object' }
        });
        
        EventBus.defineContract('debug:log', {
            level: { required: true, type: 'string' },
            message: { required: true, type: 'string' },
            source: { required: true, type: 'string' },
            data: { required: false, type: 'object' }
        });
        
        EventBus.defineContract('performance:slow', {
            operation: { required: true, type: 'string' },
            duration: { required: true, type: 'number' },
            threshold: { required: false, type: 'number' },
            context: { required: false, type: 'object' }
        });
        
        EventBus.defineContract('storage:updated', {
            store: { required: true, type: 'string' },
            operation: { required: true, type: 'string' },
            itemCount: { required: false, type: 'number' },
            size: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('export:completed', {
            format: { required: true, type: 'string' },
            itemCount: { required: true, type: 'number' },
            size: { required: false, type: 'number' },
            duration: { required: false, type: 'number' }
        });
        
        EventBus.defineContract('import:completed', {
            format: { required: true, type: 'string' },
            itemCount: { required: true, type: 'number' },
            errors: { required: false, type: 'number' },
            duration: { required: false, type: 'number' }
        });
    }
    
    /**
     * Get count of defined contracts
     */
    static getContractCount() {
        return window.EventBus ? window.EventBus.contracts.size : 0;
    }
    
    /**
     * Get all contract definitions for documentation
     */
    static getAllContracts() {
        if (!window.EventBus) return {};
        
        const contracts = {};
        for (const [eventType, contract] of window.EventBus.contracts) {
            contracts[eventType] = contract;
        }
        return contracts;
    }
    
    /**
     * Validate an event against its contract (for testing)
     */
    static validateEvent(eventType, data) {
        if (!window.EventBus) return { valid: false, error: 'EventBus not available' };
        
        const contract = window.EventBus.contracts.get(eventType);
        if (!contract) return { valid: true, warning: 'No contract defined' };
        
        try {
            window.EventBus.validateEvent({ type: eventType, data: data });
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Get contract documentation for an event type
     */
    static getContractDocs(eventType) {
        if (!window.EventBus) return null;
        
        const contract = window.EventBus.contracts.get(eventType);
        if (!contract) return null;
        
        const docs = {
            eventType: eventType,
            description: this.getEventDescription(eventType),
            fields: {},
            examples: this.getEventExamples(eventType)
        };
        
        for (const [field, spec] of Object.entries(contract)) {
            if (field !== 'definedAt') {
                docs.fields[field] = {
                    type: spec.type || 'any',
                    required: spec.required || false,
                    description: spec.description || ''
                };
            }
        }
        
        return docs;
    }
    
    /**
     * Get human-readable description for event types
     */
    static getEventDescription(eventType) {
        const descriptions = {
            'logEntry:creating': 'Fired before a log entry is created, allows validation and preprocessing',
            'logEntry:created': 'Fired after a log entry is successfully created and saved',
            'logEntry:updated': 'Fired when an existing log entry is modified',
            'logEntry:deleted': 'Fired when a log entry is permanently removed',
            'logEntry:error': 'Fired when log entry operations fail',
            
            'analysis:scheduled': 'Fired when an entry is added to the analysis queue',
            'analysis:started': 'Fired when AI analysis begins for an entry',
            'analysis:completed': 'Fired when AI analysis completes successfully',
            'analysis:failed': 'Fired when AI analysis fails',
            'analysis:retrying': 'Fired when analysis is being retried after failure',
            
            'view:changed': 'Fired when the user switches between different view modes',
            'modal:opened': 'Fired when any modal dialog is opened',
            'modal:closed': 'Fired when any modal dialog is closed',
            'filter:applied': 'Fired when filters are applied to the log view',
            'search:performed': 'Fired when the user performs a search',
            'stats:updated': 'Fired when application statistics are recalculated',
            'toast:show': 'Fired when a toast notification should be displayed',
            
            'health:contextUpdated': 'Fired when the user updates their health context',
            'health:analysisUpdated': 'Fired when health context analysis is updated',
            'health:profileCleared': 'Fired when health profile is cleared',
            
            'app:initialized': 'Fired when application initialization is complete',
            'app:offline': 'Fired when the application goes offline',
            'app:online': 'Fired when the application comes back online',
            'app:error': 'Fired when a global application error occurs'
        };
        
        return descriptions[eventType] || 'No description available';
    }
    
    /**
     * Get example data for event types
     */
    static getEventExamples(eventType) {
        const examples = {
            'logEntry:created': {
                entry: {
                    id: 'log-123-abc',
                    content: 'Feeling better today after getting good sleep',
                    timestamp: '2025-01-06T10:30:00.000Z'
                },
                stats: {
                    totalEntries: 15,
                    todayEntries: 3
                }
            },
            
            'analysis:completed': {
                entryId: 'log-123-abc',
                analysis: {
                    message: 'This entry suggests improved sleep quality...',
                    tags: ['sleep', 'mood', 'recovery']
                },
                processingTime: 1250,
                completedAt: '2025-01-06T10:30:05.000Z'
            },
            
            'view:changed': {
                previousView: 'entries',
                currentView: 'markdown',
                timestamp: '2025-01-06T10:30:00.000Z'
            },
            
            'health:contextUpdated': {
                description: 'Managing chronic fatigue and sleep issues...',
                wordCount: 45
            }
        };
        
        return examples[eventType] || null;
    }
}

// Initialize contracts when EventBus is ready
if (window.EventBus) {
    EventContracts.initialize();
} else {
    // Wait for EventBus to be ready
    document.addEventListener('DOMContentLoaded', () => {
        if (window.EventBus) {
            EventContracts.initialize();
        }
    });
}

// Export for use in other modules
window.EventContracts = EventContracts;