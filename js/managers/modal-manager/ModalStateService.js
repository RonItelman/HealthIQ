// ModalStateService - Handles modal state management and coordination

class ModalStateService {
    constructor() {
        this.openModals = new Set();
        this.modalStack = [];
        this.modalData = new Map();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalStateService initialized', {}, 'MODALSTATE');
        }
    }
    
    /**
     * Initialize modal state service
     */
    init() {
        this.setupEventListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalStateService init completed', {}, 'MODALSTATE');
        }
    }
    
    /**
     * Setup event listeners for modal state management
     */
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Listen for modal open/close events
        EventBus.on('modal:opened', (data) => {
            this.handleModalOpened(data);
        });
        
        EventBus.on('modal:closed', (data) => {
            this.handleModalClosed(data);
        });
        
        // Listen for escape key to close top modal
        EventBus.on('keyboard:escapePressed', () => {
            this.closeTopModal();
        });
        
        if (window.DebugStore) {
            DebugStore.debug('ModalStateService event listeners setup', {}, 'MODALSTATE');
        }
    }
    
    /**
     * Open a modal
     * @param {string} modalType - Type of modal (log, health, think, debug)
     * @param {string} modalId - Modal element ID
     * @param {Object} data - Modal data
     */
    openModal(modalType, modalId, data = {}) {
        if (window.DebugStore) {
            DebugStore.info('Opening modal', {
                modalType: modalType,
                modalId: modalId,
                currentlyOpen: this.openModals.size
            }, 'MODALSTATE');
        }
        
        // Close other modals if needed (based on modal type)
        if (this.shouldCloseOthersOnOpen(modalType)) {
            this.closeAllModals();
        }
        
        // Add to tracking
        this.openModals.add(modalId);
        this.modalStack.push({ modalType, modalId, openedAt: new Date().toISOString() });
        this.modalData.set(modalId, data);
        
        // Apply body scroll lock
        this.updateBodyScrollLock();
        
        // Emit modal opened event
        if (window.EventBus) {
            EventBus.emit('modal:opened', {
                modalType: modalType,
                modalId: modalId,
                data: data,
                stackDepth: this.modalStack.length
            });
        }
        
        if (window.DebugStore) {
            DebugStore.success('Modal opened successfully', {
                modalType: modalType,
                modalId: modalId,
                stackDepth: this.modalStack.length
            }, 'MODALSTATE');
        }
    }
    
    /**
     * Close a modal
     * @param {string} modalId - Modal element ID
     */
    closeModal(modalId) {
        if (!this.openModals.has(modalId)) {
            if (window.DebugStore) {
                DebugStore.warn('Attempted to close modal that is not open', {
                    modalId: modalId
                }, 'MODALSTATE');
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.info('Closing modal', {
                modalId: modalId,
                currentlyOpen: this.openModals.size
            }, 'MODALSTATE');
        }
        
        // Remove from tracking
        this.openModals.delete(modalId);
        this.modalStack = this.modalStack.filter(modal => modal.modalId !== modalId);
        const modalData = this.modalData.get(modalId);
        this.modalData.delete(modalId);
        
        // Update body scroll lock
        this.updateBodyScrollLock();
        
        // Emit modal closed event
        if (window.EventBus) {
            EventBus.emit('modal:closed', {
                modalId: modalId,
                data: modalData,
                remainingOpen: this.openModals.size
            });
        }
        
        if (window.DebugStore) {
            DebugStore.success('Modal closed successfully', {
                modalId: modalId,
                remainingOpen: this.openModals.size
            }, 'MODALSTATE');
        }
    }
    
    /**
     * Close all open modals
     */
    closeAllModals() {
        const modalsToClose = Array.from(this.openModals);
        
        if (modalsToClose.length > 0) {
            if (window.DebugStore) {
                DebugStore.info('Closing all modals', {
                    modalCount: modalsToClose.length,
                    modals: modalsToClose
                }, 'MODALSTATE');
            }
            
            modalsToClose.forEach(modalId => {
                this.closeModal(modalId);
            });
        }
    }
    
    /**
     * Close the top modal in the stack
     */
    closeTopModal() {
        if (this.modalStack.length > 0) {
            const topModal = this.modalStack[this.modalStack.length - 1];
            this.closeModal(topModal.modalId);
        }
    }
    
    /**
     * Handle modal opened event
     * @param {Object} data - Modal data
     */
    handleModalOpened(data) {
        if (window.DebugStore) {
            DebugStore.debug('Modal opened event handled', {
                modalType: data.modalType,
                modalId: data.modalId
            }, 'MODALSTATE');
        }
        
        // Additional handling can be added here
    }
    
    /**
     * Handle modal closed event
     * @param {Object} data - Modal data
     */
    handleModalClosed(data) {
        if (window.DebugStore) {
            DebugStore.debug('Modal closed event handled', {
                modalId: data.modalId
            }, 'MODALSTATE');
        }
        
        // Additional handling can be added here
    }
    
    /**
     * Check if other modals should be closed when opening this type
     * @param {string} modalType - Modal type
     * @returns {boolean} - True if should close others
     */
    shouldCloseOthersOnOpen(modalType) {
        // Most modals should close others, except for certain types
        const allowMultiple = ['toast', 'tooltip', 'dropdown'];
        return !allowMultiple.includes(modalType);
    }
    
    /**
     * Update body scroll lock based on open modals
     */
    updateBodyScrollLock() {
        if (this.openModals.size > 0) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Body scroll lock updated', {
                locked: this.openModals.size > 0,
                openModals: this.openModals.size
            }, 'MODALSTATE');
        }
    }
    
    /**
     * Check if a modal is open
     * @param {string} modalId - Modal ID to check
     * @returns {boolean} - True if modal is open
     */
    isModalOpen(modalId) {
        return this.openModals.has(modalId);
    }
    
    /**
     * Check if any modal is open
     * @returns {boolean} - True if any modal is open
     */
    hasOpenModals() {
        return this.openModals.size > 0;
    }
    
    /**
     * Get list of open modals
     * @returns {Array} - Array of open modal IDs
     */
    getOpenModals() {
        return Array.from(this.openModals);
    }
    
    /**
     * Get top modal in stack
     * @returns {Object|null} - Top modal or null
     */
    getTopModal() {
        return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
    }
    
    /**
     * Get modal data
     * @param {string} modalId - Modal ID
     * @returns {Object|null} - Modal data or null
     */
    getModalData(modalId) {
        return this.modalData.get(modalId) || null;
    }
    
    /**
     * Set modal data
     * @param {string} modalId - Modal ID
     * @param {Object} data - Data to set
     */
    setModalData(modalId, data) {
        this.modalData.set(modalId, data);
        
        if (window.DebugStore) {
            DebugStore.debug('Modal data updated', {
                modalId: modalId,
                dataKeys: Object.keys(data)
            }, 'MODALSTATE');
        }
    }
    
    /**
     * Get modal stack information
     * @returns {Array} - Modal stack
     */
    getModalStack() {
        return [...this.modalStack];
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        return {
            openModals: this.getOpenModals(),
            openModalCount: this.openModals.size,
            modalStackDepth: this.modalStack.length,
            topModal: this.getTopModal(),
            bodyScrollLocked: document.body.style.overflow === 'hidden',
            modalDataCount: this.modalData.size
        };
    }
    
    /**
     * Reset modal state (for cleanup/testing)
     */
    reset() {
        this.closeAllModals();
        this.modalStack = [];
        this.modalData.clear();
        document.body.style.overflow = 'auto';
        
        if (window.DebugStore) {
            DebugStore.info('Modal state reset', {}, 'MODALSTATE');
        }
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        this.reset();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalStateService destroyed', {}, 'MODALSTATE');
        }
    }
}

// Export for use in other modules
window.ModalStateService = ModalStateService;