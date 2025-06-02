// HealthProfileService - Handles health profile storage and management

class HealthProfileService {
    constructor() {
        this.storageKey = 'healthProfile_v2';
        
        if (window.DebugStore) {
            DebugStore.debug('HealthProfileService initialized', {}, 'HEALTHPROFILE');
        }
    }
    
    /**
     * Initialize service
     */
    init() {
        // Migrate from old storage format if needed
        this.migrateFromLegacyStorage();
        
        if (window.DebugStore) {
            DebugStore.debug('HealthProfileService init completed', {}, 'HEALTHPROFILE');
        }
    }
    
    /**
     * Load health profile from storage
     * @returns {HealthProfile} - Health profile instance
     */
    loadProfile() {
        if (window.DebugStore) {
            DebugStore.debug('Loading health profile from storage', {}, 'HEALTHPROFILE');
        }
        
        try {
            const stored = localStorage.getItem(this.storageKey);
            
            if (stored) {
                const data = JSON.parse(stored);
                const profile = HealthProfile.fromJSON(data);
                
                if (window.DebugStore) {
                    DebugStore.success('Health profile loaded', {
                        hasDescription: !!profile.description,
                        hasAnalysis: !!profile.analysis,
                        lastUpdated: profile.lastUpdated,
                        completenessScore: profile.getCompletenessScore()
                    }, 'HEALTHPROFILE');
                }
                
                return profile;
            } else {
                // Return empty profile
                const profile = new HealthProfile();
                
                if (window.DebugStore) {
                    DebugStore.info('No stored profile found, created empty profile', {}, 'HEALTHPROFILE');
                }
                
                return profile;
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to load health profile', {
                    error: error.message
                }, 'HEALTHPROFILE');
            }
            
            console.error('Failed to load health profile:', error);
            return new HealthProfile(); // Return empty profile on error
        }
    }
    
    /**
     * Save health profile to storage
     * @param {HealthProfile} profile - Health profile to save
     * @returns {boolean} - Success status
     */
    saveProfile(profile) {
        if (!profile || !(profile instanceof HealthProfile)) {
            throw new Error('Invalid health profile provided');
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Saving health profile to storage', {
                hasDescription: !!profile.description,
                hasAnalysis: !!profile.analysis,
                completenessScore: profile.getCompletenessScore()
            }, 'HEALTHPROFILE');
        }
        
        try {
            const data = profile.toJSON();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            if (window.DebugStore) {
                DebugStore.success('Health profile saved successfully', {
                    profileId: profile.id,
                    dataSize: JSON.stringify(data).length
                }, 'HEALTHPROFILE');
            }
            
            // Emit storage updated event
            if (window.EventBus) {
                EventBus.emit('storage:updated', {
                    store: 'healthProfile',
                    operation: 'save',
                    itemCount: 1,
                    size: JSON.stringify(data).length
                });
            }
            
            return true;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to save health profile', {
                    error: error.message,
                    profileId: profile.id
                }, 'HEALTHPROFILE');
            }
            
            console.error('Failed to save health profile:', error);
            return false;
        }
    }
    
    /**
     * Clear health profile from storage
     */
    clearProfile() {
        if (window.DebugStore) {
            DebugStore.info('Clearing health profile from storage', {}, 'HEALTHPROFILE');
        }
        
        try {
            localStorage.removeItem(this.storageKey);
            
            // Also clear legacy storage
            localStorage.removeItem('healthIssues');
            localStorage.removeItem('healthContext');
            
            if (window.DebugStore) {
                DebugStore.success('Health profile cleared from storage', {}, 'HEALTHPROFILE');
            }
            
            // Emit storage updated event
            if (window.EventBus) {
                EventBus.emit('storage:updated', {
                    store: 'healthProfile',
                    operation: 'clear',
                    itemCount: 0,
                    size: 0
                });
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to clear health profile', {
                    error: error.message
                }, 'HEALTHPROFILE');
            }
            console.error('Failed to clear health profile:', error);
        }
    }
    
    /**
     * Export health profile data
     * @returns {Object} - Exported data
     */
    exportProfile() {
        const profile = this.loadProfile();
        
        return {
            profile: profile.toJSON(),
            exportedAt: new Date().toISOString(),
            version: '2.0',
            format: 'healthProfile'
        };
    }
    
    /**
     * Import health profile data
     * @param {Object} data - Data to import
     * @returns {boolean} - Success status
     */
    importProfile(data) {
        try {
            if (!data || !data.profile) {
                throw new Error('Invalid import data format');
            }
            
            const profile = HealthProfile.fromJSON(data.profile);
            
            // Validate imported profile
            const validation = HealthProfile.validate(data.profile);
            if (!validation.isValid) {
                throw new Error(`Invalid profile data: ${validation.error}`);
            }
            
            // Save imported profile
            const success = this.saveProfile(profile);
            
            if (success && window.DebugStore) {
                DebugStore.success('Health profile imported successfully', {
                    fromVersion: data.version,
                    hasDescription: !!profile.description,
                    hasAnalysis: !!profile.analysis
                }, 'HEALTHPROFILE');
            }
            
            return success;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Health profile import failed', {
                    error: error.message
                }, 'HEALTHPROFILE');
            }
            console.error('Failed to import health profile:', error);
            return false;
        }
    }
    
    /**
     * Migrate from legacy storage format
     */
    migrateFromLegacyStorage() {
        try {
            // Check if new format already exists
            if (localStorage.getItem(this.storageKey)) {
                return; // Already migrated
            }
            
            // Check for legacy health issues format
            const legacyHealthIssues = localStorage.getItem('healthIssues');
            if (legacyHealthIssues) {
                const oldData = JSON.parse(legacyHealthIssues);
                
                if (oldData.description || oldData.claudeAnalysis) {
                    const profile = new HealthProfile(
                        oldData.description || '',
                        oldData.claudeAnalysis || ''
                    );
                    
                    this.saveProfile(profile);
                    
                    if (window.DebugStore) {
                        DebugStore.success('Migrated legacy health issues to new format', {
                            hadDescription: !!oldData.description,
                            hadAnalysis: !!oldData.claudeAnalysis
                        }, 'HEALTHPROFILE');
                    }
                    
                    // Remove legacy data after successful migration
                    localStorage.removeItem('healthIssues');
                }
            }
            
            // Check for legacy health context format
            const legacyHealthContext = localStorage.getItem('healthContext');
            if (legacyHealthContext && !localStorage.getItem(this.storageKey)) {
                const oldContext = JSON.parse(legacyHealthContext);
                
                if (oldContext.userDescription || oldContext.claudeAnalysis) {
                    const profile = new HealthProfile(
                        oldContext.userDescription || '',
                        oldContext.claudeAnalysis || ''
                    );
                    
                    this.saveProfile(profile);
                    
                    if (window.DebugStore) {
                        DebugStore.success('Migrated legacy health context to new format', {
                            hadDescription: !!oldContext.userDescription,
                            hadAnalysis: !!oldContext.claudeAnalysis
                        }, 'HEALTHPROFILE');
                    }
                    
                    // Remove legacy data after successful migration
                    localStorage.removeItem('healthContext');
                }
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.warn('Legacy storage migration failed', {
                    error: error.message
                }, 'HEALTHPROFILE');
            }
            console.warn('Legacy health storage migration failed:', error);
        }
    }
    
    /**
     * Get storage statistics
     * @returns {Object} - Storage stats
     */
    getStorageStats() {
        try {
            const profile = this.loadProfile();
            const dataSize = localStorage.getItem(this.storageKey)?.length || 0;
            
            return {
                hasProfile: !!profile && profile.hasContext(),
                profileId: profile?.id,
                completenessScore: profile?.getCompletenessScore() || 0,
                descriptionWordCount: profile?.getDescriptionWordCount() || 0,
                analysisWordCount: profile?.getAnalysisWordCount() || 0,
                lastUpdated: profile?.lastUpdated,
                dataSize: dataSize,
                storageKey: this.storageKey
            };
        } catch (error) {
            return {
                error: error.message,
                hasProfile: false,
                dataSize: 0
            };
        }
    }
    
    /**
     * Backup profile to file
     * @returns {Promise<void>}
     */
    async backupToFile() {
        try {
            const exportData = this.exportProfile();
            const filename = `health-profile-backup-${DateFormatter.formatExportFilename()}`;
            
            await ExportHelper.downloadJSON(exportData, filename);
            
            if (window.DebugStore) {
                DebugStore.success('Health profile backup created', {
                    filename: filename
                }, 'HEALTHPROFILE');
            }
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Health profile backup failed', {
                    error: error.message
                }, 'HEALTHPROFILE');
            }
            throw error;
        }
    }
    
    /**
     * Restore profile from file
     * @param {File} file - File to restore from
     * @returns {Promise<boolean>} - Success status
     */
    async restoreFromFile(file) {
        try {
            const data = await ExportHelper.importJSON(file);
            const success = this.importProfile(data);
            
            if (success && window.DebugStore) {
                DebugStore.success('Health profile restored from file', {
                    filename: file.name
                }, 'HEALTHPROFILE');
            }
            
            return success;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Health profile restore failed', {
                    error: error.message,
                    filename: file?.name
                }, 'HEALTHPROFILE');
            }
            throw error;
        }
    }
}

// Export for use in other modules
window.HealthProfileService = HealthProfileService;