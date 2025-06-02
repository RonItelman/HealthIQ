// ModalManager - Main coordinator for all modal operations

class ModalManager {
    constructor() {
        // Initialize service components
        this.stateService = new ModalStateService();
        this.uiService = new ModalUIService();
        this.contentService = new ModalContentService();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalManager initialized', {}, 'MODALMANAGER');
        }
    }
    
    /**
     * Initialize modal manager
     */
    init() {
        if (window.DebugStore) {
            DebugStore.info('ModalManager initialization started', {}, 'MODALMANAGER');
        }
        
        // Initialize services
        this.stateService.init();
        this.uiService.init();
        this.contentService.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.success('ModalManager initialized successfully', {
                stateServiceReady: !!this.stateService,
                uiServiceReady: !!this.uiService,
                contentServiceReady: !!this.contentService,
                registeredModals: this.uiService.getRegisteredModals().length
            }, 'MODALMANAGER');
        }
        
        console.log('ModalManager initialized with coordinated modal services');
    }
    
    /**
     * Set up event bus listeners
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for modal requests from other components
        EventBus.on('modal:show', (data) => {
            this.showModal(data.modalId, data.modalType, data.options);
        });
        
        EventBus.on('modal:hide', (data) => {
            this.hideModal(data.modalId);
        });
        
        EventBus.on('modal:closeRequested', (data) => {
            this.handleCloseRequest(data);
        });
        
        // Listen for content updates
        EventBus.on('modal:updateContent', (data) => {
            this.updateModalContent(data.modalId, data.contentType, data.data);
        });
        
        EventBus.on('modal:contentGenerated', (data) => {
            this.handleContentGenerated(data);
        });
        
        // Listen for UI events
        EventBus.on('modal:uiShown', (data) => {
            // Additional coordination if needed
        });
        
        EventBus.on('modal:uiHidden', (data) => {
            // Additional coordination if needed
        });
        
        if (window.DebugStore) {
            DebugStore.debug('ModalManager event listeners setup', {}, 'MODALMANAGER');
        }
    }
    
    /**
     * Show a modal
     * @param {string} modalId - Modal ID (logModal, healthModal, etc.)
     * @param {string} modalType - Modal type (log, health, think, debug)
     * @param {Object} options - Display options
     */
    showModal(modalId, modalType, options = {}) {
        if (window.DebugStore) {
            DebugStore.info('Show modal requested', {
                modalId: modalId,
                modalType: modalType,
                options: options
            }, 'MODALMANAGER');
        }
        
        try {
            // Update state
            this.stateService.openModal(modalType, modalId, options.data);
            
            // Generate content if needed
            if (options.contentType && options.data) {
                const content = this.contentService.generateContent(modalType, options.contentType, options.data);
                this.uiService.updateModalContent(modalId, content);
            }
            
            // Show UI
            this.uiService.showModal(modalId, modalType, options);
            
            if (window.DebugStore) {
                DebugStore.success('Modal shown successfully', {
                    modalId: modalId,
                    modalType: modalType
                }, 'MODALMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to show modal', {
                    modalId: modalId,
                    modalType: modalType,
                    error: error.message
                }, 'MODALMANAGER');
            }
            
            // Emit error event
            if (window.EventBus) {
                EventBus.emit('modal:showError', {
                    modalId: modalId,
                    modalType: modalType,
                    error: error.message
                });
            }
        }
    }
    
    /**
     * Hide a modal
     * @param {string} modalId - Modal ID
     * @param {Object} options - Hide options
     */
    hideModal(modalId, options = {}) {
        if (window.DebugStore) {
            DebugStore.info('Hide modal requested', {
                modalId: modalId
            }, 'MODALMANAGER');
        }
        
        try {
            // Hide UI
            this.uiService.hideModal(modalId, options);
            
            // Update state
            this.stateService.closeModal(modalId);
            
            if (window.DebugStore) {
                DebugStore.success('Modal hidden successfully', {
                    modalId: modalId
                }, 'MODALMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to hide modal', {
                    modalId: modalId,
                    error: error.message
                }, 'MODALMANAGER');
            }
        }
    }
    
    /**
     * Handle close request from UI or keyboard
     * @param {Object} data - Close request data
     */
    handleCloseRequest(data) {
        if (window.DebugStore) {
            DebugStore.debug('Modal close request handled', {
                modalId: data.modalId,
                source: data.source
            }, 'MODALMANAGER');
        }
        
        this.hideModal(data.modalId);
    }
    
    /**
     * Update modal content
     * @param {string} modalId - Modal ID
     * @param {string} contentType - Content type
     * @param {Object} data - Content data
     */
    updateModalContent(modalId, contentType, data) {
        if (window.DebugStore) {
            DebugStore.info('Modal content update requested', {
                modalId: modalId,
                contentType: contentType
            }, 'MODALMANAGER');
        }
        
        try {
            // Get modal type from state
            const modalInfo = this.uiService.getModalInfo(modalId);
            if (!modalInfo) {
                throw new Error(`Modal ${modalId} not found`);
            }
            
            // Generate new content
            const content = this.contentService.generateContent(modalInfo.type, contentType, data);
            
            // Update UI
            this.uiService.updateModalContent(modalId, content);
            
            // Update state data
            this.stateService.setModalData(modalId, { ...data, contentType: contentType });
            
            if (window.DebugStore) {
                DebugStore.success('Modal content updated successfully', {
                    modalId: modalId,
                    contentType: contentType
                }, 'MODALMANAGER');
            }
            
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Failed to update modal content', {
                    modalId: modalId,
                    contentType: contentType,
                    error: error.message
                }, 'MODALMANAGER');
            }
        }
    }
    
    /**
     * Handle content generated event
     * @param {Object} data - Content data
     */
    handleContentGenerated(data) {
        // Update the modal with generated content
        this.uiService.updateModalContent(data.modalId, data.content);
    }
    
    /**
     * Show log modal with entries
     * @param {Array} entries - Log entries
     * @param {string} view - View type (entries, summary, markdown)
     */
    showLogModal(entries = [], view = 'entries') {
        this.showModal('logModal', 'log', {
            contentType: view,
            data: { entries: entries, view: view }
        });
    }
    
    /**
     * Show health modal with profile
     * @param {Object} profile - Health profile
     */
    showHealthModal(profile = null) {
        this.showModal('healthModal', 'health', {
            contentType: 'profile',
            data: { profile: profile }
        });
    }
    
    /**
     * Show think modal with analysis
     * @param {string} analysis - Analysis text
     * @param {Object} categorizedData - Categorized data
     */
    showThinkModal(analysis = null, categorizedData = null) {
        if (analysis) {
            this.showModal('thinkModal', 'think', {
                contentType: 'analysis',
                data: { analysis: analysis, categorizedData: categorizedData }
            });
        } else {
            this.showModal('thinkModal', 'think', {
                contentType: 'loading',
                data: {}
            });
        }
    }
    
    /**
     * Show debug modal with logs
     * @param {Array} logs - Debug logs
     * @param {string} filter - Log filter
     */
    showDebugModal(logs = [], filter = 'all') {
        this.showModal('debugModal', 'debug', {
            contentType: 'logs',
            data: { logs: logs, filter: filter }
        });
    }
    
    /**
     * Close all modals
     */
    closeAllModals() {
        this.stateService.closeAllModals();
    }
    
    /**
     * Check if any modal is open
     * @returns {boolean} - True if any modal is open
     */
    hasOpenModals() {
        return this.stateService.hasOpenModals();
    }
    
    /**
     * Check if specific modal is open
     * @param {string} modalId - Modal ID
     * @returns {boolean} - True if modal is open
     */
    isModalOpen(modalId) {
        return this.stateService.isModalOpen(modalId);
    }
    
    /**
     * Get list of open modals
     * @returns {Array} - Array of open modal IDs
     */
    getOpenModals() {
        return this.stateService.getOpenModals();
    }
    
    /**
     * Get top modal in stack
     * @returns {Object|null} - Top modal or null
     */
    getTopModal() {
        return this.stateService.getTopModal();
    }
    
    /**
     * Register custom content generator
     * @param {string} modalType - Modal type
     * @param {string} contentType - Content type
     * @param {Function} generator - Generator function
     */
    registerContentGenerator(modalType, contentType, generator) {
        this.contentService.registerContentGenerator(modalType, contentType, generator);
    }
    
    /**
     * Generate content
     * @param {string} modalType - Modal type
     * @param {string} contentType - Content type
     * @param {Object} data - Content data
     * @returns {string} - Generated content
     */
    generateContent(modalType, contentType, data) {
        return this.contentService.generateContent(modalType, contentType, data);
    }
    
    /**
     * Get comprehensive modal manager state
     * @returns {Object} - Complete state
     */
    getState() {
        return {
            state: this.stateService.getStats(),
            ui: this.uiService.getStats(),
            content: this.contentService.getStats(),
            manager: {
                initialized: true,
                servicesReady: {
                    state: !!this.stateService,
                    ui: !!this.uiService,
                    content: !!this.contentService
                }
            }
        };
    }
    
    /**
     * Check if modal manager is ready
     * @returns {boolean} - True if all services are ready
     */
    isReady() {
        return !!(this.stateService && 
                 this.uiService && 
                 this.contentService);
    }
    
    /**
     * Get modal statistics
     * @returns {Object} - Modal usage statistics
     */
    getStats() {
        return {
            openModals: this.getOpenModals().length,
            registeredModals: this.uiService.getRegisteredModals().length,
            hasOpenModals: this.hasOpenModals(),
            topModal: this.getTopModal(),
            contentGenerators: this.contentService.getStats().registeredGenerators,
            servicesInitialized: {
                state: !!this.stateService,
                ui: !!this.uiService,
                content: !!this.contentService
            }
        };
    }
    
    /**
     * Reset modal manager state
     */
    reset() {
        this.stateService.reset();
        this.uiService.reset();
        this.contentService.clearCache();
        
        if (window.DebugStore) {
            DebugStore.info('Modal manager reset', {}, 'MODALMANAGER');
        }
    }
    
    /**
     * Destroy modal manager (cleanup)
     */
    destroy() {
        // Clean up services
        if (this.stateService && this.stateService.destroy) {
            this.stateService.destroy();
        }
        
        if (this.uiService && this.uiService.destroy) {
            this.uiService.destroy();
        }
        
        if (this.contentService && this.contentService.destroy) {
            this.contentService.destroy();
        }
        
        if (window.DebugStore) {
            DebugStore.debug('ModalManager destroyed', {}, 'MODALMANAGER');
        }
    }
}

// Export for use in other modules
window.ModalManager = ModalManager;