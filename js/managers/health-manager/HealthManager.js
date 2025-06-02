// HealthManager - Main coordinator for all health-related operations

class HealthManager {
    constructor() {
        // Initialize service components
        this.profileService = new HealthProfileService();
        this.analysisService = new HealthAnalysisService();
        this.modalManager = new HealthModalManager();
        this.categorizerService = new HealthCategorizerService();
        
        // Current health state
        this.currentProfile = null;
        
        if (window.DebugStore) {
            DebugStore.debug('HealthManager initialized', {}, 'HEALTHMANAGER');
        }
    }
    
    /**
     * Initialize health manager
     */
    init() {
        if (window.DebugStore) {
            DebugStore.info('HealthManager initialization started', {}, 'HEALTHMANAGER');
        }
        
        // Initialize services
        this.profileService.init();
        this.modalManager.init();
        this.categorizerService.init();
        
        // Load existing health profile
        this.loadHealthProfile();
        
        // Set up event listeners
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.success('HealthManager initialized successfully', {
                hasProfile: !!this.currentProfile,
                profileHasContext: this.currentProfile?.hasContext()
            }, 'HEALTHMANAGER');
        }
        
        console.log('HealthManager initialized with modular architecture');
    }
    
    /**
     * Set up event bus listeners
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for log entry events to trigger categorization
        EventBus.on('logEntry:created', (data) => {
            this.handleLogEntryCreated(data);
        });
        
        // Listen for analysis requests
        EventBus.on('health:analyzeRequested', (data) => {
            this.handleAnalysisRequest(data);
        });
        
        // Listen for profile updates
        EventBus.on('health:profileUpdateRequested', (data) => {
            this.handleProfileUpdate(data);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('HealthManager event listeners setup', {}, 'HEALTHMANAGER');
        }
    }
    
    /**
     * Load health profile
     */
    loadHealthProfile() {
        this.currentProfile = this.profileService.loadProfile();
        
        if (this.currentProfile?.hasContext()) {
            // Update UI display
            this.modalManager.updateDisplay(this.currentProfile);
            
            // Set global context for backward compatibility
            if (window.HealthContext) {
                window.HealthContext.context = this.currentProfile.toJSON();
            }
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Health profile loaded', {
                hasProfile: !!this.currentProfile,
                hasContext: this.currentProfile?.hasContext(),
                descriptionLength: this.currentProfile?.getDescriptionWordCount() || 0
            }, 'HEALTHMANAGER');
        }
    }
    
    /**
     * Update health profile description
     * @param {string} description - New health description
     * @returns {Promise<Object>} - Analysis result
     */
    async updateHealthProfile(description) {
        if (window.DebugStore) {
            DebugStore.info('Updating health profile', {
                descriptionLength: description.length
            }, 'HEALTHMANAGER');
        }
        
        try {
            // Validate description
            const validation = ValidationHelper.validateHealthDescription(description);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            
            // Get analysis from Claude
            const analysis = await this.analysisService.analyzeProfile(description);
            
            // Update profile
            if (!this.currentProfile) {
                this.currentProfile = new HealthProfile(description, analysis);
            } else {
                this.currentProfile.updateFromAnalysis(description, analysis);
            }
            
            // Save profile
            this.profileService.saveProfile(this.currentProfile);
            
            // Update UI
            this.modalManager.updateDisplay(this.currentProfile);
            
            // Emit events
            if (window.EventBus) {
                EventBus.emit('health:contextUpdated', {
                    description: description,
                    previousDescription: this.currentProfile.description,
                    wordCount: this.currentProfile.getDescriptionWordCount()
                });
                
                EventBus.emit('health:analysisUpdated', {
                    analysis: analysis,
                    description: description,
                    analysisLength: analysis?.length || 0
                });
            }
            
            // Update global context for backward compatibility
            this.updateGlobalContext();
            
            if (window.DebugStore) {
                DebugStore.success('Health profile updated successfully', {
                    hasAnalysis: !!analysis,
                    analysisLength: analysis?.length || 0,
                    completenessScore: this.currentProfile.getCompletenessScore()
                }, 'HEALTHMANAGER');
            }
            
            return { profile: this.currentProfile, analysis: analysis };
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to update health profile', {
                    error: error.message,
                    descriptionLength: description.length
                }, 'HEALTHMANAGER');
            }
            
            // Emit error event
            if (window.EventBus) {
                EventBus.emit('app:error', {
                    error: error,
                    component: 'HealthManager',
                    severity: 'error',
                    context: { operation: 'updateProfile' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Analyze a log entry for health insights
     * @param {Object} logEntry - Log entry to analyze
     * @returns {Promise<Object>} - Analysis result
     */
    async analyzeLogEntry(logEntry) {
        if (!this.hasHealthContext()) {
            if (window.DebugStore) {
                DebugStore.warn('Log analysis skipped - no health context', {
                    logId: logEntry.id
                }, 'HEALTHMANAGER');
            }
            return null;
        }
        
        if (window.DebugStore) {
            DebugStore.info('Analyzing log entry', {
                logId: logEntry.id,
                contentLength: logEntry.content.length
            }, 'HEALTHMANAGER');
        }
        
        try {
            // Use analysis service to analyze the log entry
            const analysis = await this.analysisService.analyzeLogEntry(
                logEntry, 
                this.currentProfile
            );
            
            // Run categorization
            const categories = await this.categorizerService.categorizeEntry(
                logEntry, 
                this.currentProfile
            );
            
            // Emit categorization event
            if (categories && window.EventBus) {
                EventBus.emit('health:categoryDetected', {
                    entryId: logEntry.id,
                    categories: categories,
                    confidence: categories.confidence
                });
            }
            
            if (window.DebugStore) {
                DebugStore.success('Log entry analysis completed', {
                    logId: logEntry.id,
                    hasAnalysis: !!analysis,
                    hasCategories: !!categories,
                    tagCount: analysis?.tags?.length || 0
                }, 'HEALTHMANAGER');
            }
            
            return analysis;
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Log entry analysis failed', {
                    logId: logEntry.id,
                    error: error.message
                }, 'HEALTHMANAGER');
            }
            throw error;
        }
    }
    
    /**
     * Check if health context is available
     * @returns {boolean} - True if health context exists
     */
    hasHealthContext() {
        return !!(this.currentProfile && this.currentProfile.hasContext());
    }
    
    /**
     * Get health context description
     * @returns {string} - Health context description
     */
    getHealthDescription() {
        return this.currentProfile?.description || '';
    }
    
    /**
     * Show health modal
     */
    showHealthModal() {
        this.modalManager.showModal();
        
        // Emit modal opened event
        if (window.EventBus) {
            EventBus.emit('modal:opened', {
                modalType: 'health',
                modalId: 'healthModal',
                data: {
                    hasExistingContext: this.hasHealthContext(),
                    contextLength: this.getHealthDescription().length
                }
            });
            
            EventBus.emit('health:modalOpened', {
                hasExistingContext: this.hasHealthContext(),
                contextLength: this.getHealthDescription().length
            });
        }
    }
    
    /**
     * Close health modal
     */
    closeHealthModal() {
        this.modalManager.closeModal();
        
        // Emit modal closed event
        if (window.EventBus) {
            EventBus.emit('modal:closed', {
                modalType: 'health',
                modalId: 'healthModal'
            });
        }
    }
    
    /**
     * Clear health profile
     */
    clearHealthProfile() {
        const previousData = this.currentProfile?.toJSON();
        
        this.currentProfile = new HealthProfile('', '');
        this.profileService.saveProfile(this.currentProfile);
        this.modalManager.updateDisplay(this.currentProfile);
        this.updateGlobalContext();
        
        // Emit event
        if (window.EventBus) {
            EventBus.emit('health:profileCleared', {
                previousData: previousData,
                timestamp: new Date().toISOString()
            });
        }
        
        if (window.DebugStore) {
            DebugStore.info('Health profile cleared', {}, 'HEALTHMANAGER');
        }
    }
    
    /**
     * Handle log entry created event
     * @param {Object} data - Event data
     */
    handleLogEntryCreated(data) {
        // Trigger background categorization if health context exists
        if (this.hasHealthContext()) {
            setTimeout(() => {
                this.categorizerService.categorizeEntry(data.entry, this.currentProfile)
                    .catch(error => {
                        if (window.DebugStore) {
                            DebugStore.warn('Background categorization failed', {
                                logId: data.entry.id,
                                error: error.message
                            }, 'HEALTHMANAGER');
                        }
                    });
            }, 1000); // Delay to not interfere with main analysis
        }
    }
    
    /**
     * Handle analysis request event
     * @param {Object} data - Event data
     */
    async handleAnalysisRequest(data) {
        try {
            await this.updateHealthProfile(data.description);
        } catch (error) {
            console.error('Health analysis request failed:', error);
        }
    }
    
    /**
     * Handle profile update event
     * @param {Object} data - Event data
     */
    async handleProfileUpdate(data) {
        try {
            await this.updateHealthProfile(data.description);
        } catch (error) {
            console.error('Health profile update failed:', error);
        }
    }
    
    /**
     * Update global context for backward compatibility
     */
    updateGlobalContext() {
        if (window.HealthContext && this.currentProfile) {
            window.HealthContext.context = this.currentProfile.toJSON();
        }
    }
    
    /**
     * Get health manager state
     * @returns {Object} - Current state
     */
    getState() {
        return {
            hasProfile: !!this.currentProfile,
            hasContext: this.hasHealthContext(),
            description: this.getHealthDescription(),
            completenessScore: this.currentProfile?.getCompletenessScore() || 0,
            lastUpdated: this.currentProfile?.lastUpdated,
            analysisCount: this.currentProfile?.analysisCount || 0
        };
    }
    
    /**
     * Export health data
     * @returns {Object} - Exported health data
     */
    exportData() {
        return {
            profile: this.currentProfile?.toJSON(),
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };
    }
    
    /**
     * Import health data
     * @param {Object} data - Health data to import
     * @returns {boolean} - Success status
     */
    importData(data) {
        try {
            if (data.profile) {
                this.currentProfile = HealthProfile.fromJSON(data.profile);
                this.profileService.saveProfile(this.currentProfile);
                this.modalManager.updateDisplay(this.currentProfile);
                this.updateGlobalContext();
                
                if (window.DebugStore) {
                    DebugStore.success('Health data imported', {
                        hasDescription: !!this.currentProfile.description,
                        hasAnalysis: !!this.currentProfile.analysis
                    }, 'HEALTHMANAGER');
                }
                
                return true;
            }
            return false;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Health data import failed', {
                    error: error.message
                }, 'HEALTHMANAGER');
            }
            return false;
        }
    }
}

// Export for use in other modules
window.HealthManager = HealthManager;