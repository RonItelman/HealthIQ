// ModalUIService - Handles modal DOM manipulation and visual interactions

class ModalUIService {
    constructor() {
        this.modalElements = new Map();
        this.eventListeners = new Map();
        this.animations = new Map();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalUIService initialized', {}, 'MODALUI');
        }
    }
    
    /**
     * Initialize modal UI service
     */
    init() {
        this.findModalElements();
        this.setupGlobalModalListeners();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalUIService init completed', {
                modalsFound: this.modalElements.size
            }, 'MODALUI');
        }
    }
    
    /**
     * Find and register all modal elements
     */
    findModalElements() {
        const modalSelectors = [
            { id: 'logModal', type: 'log' },
            { id: 'healthModal', type: 'health' },
            { id: 'thinkModal', type: 'think' },
            { id: 'debugModal', type: 'debug' }
        ];
        
        modalSelectors.forEach(({ id, type }) => {
            const element = document.getElementById(id);
            if (element) {
                this.registerModal(id, type, element);
            } else {
                if (window.DebugStore) {
                    DebugStore.warn('Modal element not found', {
                        modalId: id,
                        modalType: type
                    }, 'MODALUI');
                }
            }
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Modal elements found and registered', {
                count: this.modalElements.size,
                modals: Array.from(this.modalElements.keys())
            }, 'MODALUI');
        }
    }
    
    /**
     * Register a modal element
     * @param {string} modalId - Modal ID
     * @param {string} modalType - Modal type
     * @param {HTMLElement} element - Modal element
     */
    registerModal(modalId, modalType, element) {
        const modalInfo = {
            id: modalId,
            type: modalType,
            element: element,
            content: element.querySelector('.modal-content'),
            body: element.querySelector('.modal-body'),
            header: element.querySelector('.modal-header'),
            closeBtn: element.querySelector('.modal-close-btn'),
            actions: element.querySelector('.modal-actions')
        };
        
        this.modalElements.set(modalId, modalInfo);
        this.setupModalListeners(modalInfo);
        
        if (window.DebugStore) {
            DebugStore.debug('Modal registered', {
                modalId: modalId,
                modalType: modalType,
                hasContent: !!modalInfo.content,
                hasBody: !!modalInfo.body,
                hasCloseBtn: !!modalInfo.closeBtn
            }, 'MODALUI');
        }
    }
    
    /**
     * Setup listeners for a specific modal
     * @param {Object} modalInfo - Modal information
     */
    setupModalListeners(modalInfo) {
        const { id, element, closeBtn } = modalInfo;
        
        // Close button listener
        if (closeBtn) {
            const closeHandler = (e) => {
                e.preventDefault();
                this.handleCloseClick(id);
            };
            closeBtn.addEventListener('click', closeHandler);
            this.eventListeners.set(`${id}_close`, closeHandler);
        }
        
        // Click outside to close
        const outsideClickHandler = (e) => {
            if (e.target === element) {
                this.handleOutsideClick(id);
            }
        };
        element.addEventListener('click', outsideClickHandler);
        this.eventListeners.set(`${id}_outside`, outsideClickHandler);
        
        if (window.DebugStore) {
            DebugStore.debug('Modal listeners setup', {
                modalId: id,
                hasCloseBtn: !!closeBtn
            }, 'MODALUI');
        }
    }
    
    /**
     * Setup global modal listeners
     */
    setupGlobalModalListeners() {
        if (!window.EventBus) return;
        
        // Listen for modal show/hide requests
        EventBus.on('modal:showRequested', (data) => {
            this.showModal(data.modalId, data.modalType, data.options);
        });
        
        EventBus.on('modal:hideRequested', (data) => {
            this.hideModal(data.modalId);
        });
        
        // Listen for modal content updates
        EventBus.on('modal:updateContent', (data) => {
            this.updateModalContent(data.modalId, data.content, data.contentType);
        });
        
        if (window.DebugStore) {
            DebugStore.debug('Global modal listeners setup', {}, 'MODALUI');
        }
    }
    
    /**
     * Show a modal visually
     * @param {string} modalId - Modal ID
     * @param {string} modalType - Modal type
     * @param {Object} options - Display options
     */
    showModal(modalId, modalType, options = {}) {
        const modalInfo = this.modalElements.get(modalId);
        if (!modalInfo) {
            if (window.DebugStore) {
                DebugStore.error('Modal not found for show', {
                    modalId: modalId
                }, 'MODALUI');
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.info('Showing modal', {
                modalId: modalId,
                modalType: modalType
            }, 'MODALUI');
        }
        
        // Apply show styles
        modalInfo.element.style.display = 'block';
        
        // Add animation if specified
        if (options.animate !== false) {
            this.animateModalIn(modalInfo, options.animation);
        }
        
        // Focus management
        this.manageFocus(modalInfo, 'show');
        
        // Emit UI show event
        if (window.EventBus) {
            EventBus.emit('modal:uiShown', {
                modalId: modalId,
                modalType: modalType
            });
        }
        
        if (window.DebugStore) {
            DebugStore.success('Modal shown successfully', {
                modalId: modalId
            }, 'MODALUI');
        }
    }
    
    /**
     * Hide a modal visually
     * @param {string} modalId - Modal ID
     * @param {Object} options - Hide options
     */
    hideModal(modalId, options = {}) {
        const modalInfo = this.modalElements.get(modalId);
        if (!modalInfo) {
            if (window.DebugStore) {
                DebugStore.error('Modal not found for hide', {
                    modalId: modalId
                }, 'MODALUI');
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.info('Hiding modal', {
                modalId: modalId
            }, 'MODALUI');
        }
        
        // Add animation if specified
        if (options.animate !== false) {
            this.animateModalOut(modalInfo, options.animation, () => {
                modalInfo.element.style.display = 'none';
            });
        } else {
            modalInfo.element.style.display = 'none';
        }
        
        // Focus management
        this.manageFocus(modalInfo, 'hide');
        
        // Emit UI hide event
        if (window.EventBus) {
            EventBus.emit('modal:uiHidden', {
                modalId: modalId
            });
        }
        
        if (window.DebugStore) {
            DebugStore.success('Modal hidden successfully', {
                modalId: modalId
            }, 'MODALUI');
        }
    }
    
    /**
     * Update modal content
     * @param {string} modalId - Modal ID
     * @param {string} content - New content
     * @param {string} contentType - Content type (html, text)
     */
    updateModalContent(modalId, content, contentType = 'html') {
        const modalInfo = this.modalElements.get(modalId);
        if (!modalInfo || !modalInfo.body) {
            if (window.DebugStore) {
                DebugStore.error('Modal body not found for content update', {
                    modalId: modalId
                }, 'MODALUI');
            }
            return;
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Updating modal content', {
                modalId: modalId,
                contentType: contentType,
                contentLength: content.length
            }, 'MODALUI');
        }
        
        if (contentType === 'html') {
            modalInfo.body.innerHTML = content;
        } else {
            modalInfo.body.textContent = content;
        }
        
        // Emit content updated event
        if (window.EventBus) {
            EventBus.emit('modal:contentUpdated', {
                modalId: modalId,
                contentType: contentType,
                contentLength: content.length
            });
        }
    }
    
    /**
     * Animate modal in
     * @param {Object} modalInfo - Modal information
     * @param {string} animationType - Animation type
     */
    animateModalIn(modalInfo, animationType = 'fade') {
        const { element, content } = modalInfo;
        
        // Add animation classes
        element.classList.add('modal-entering');
        if (content) {
            content.classList.add('modal-content-entering');
        }
        
        // Remove classes after animation
        setTimeout(() => {
            element.classList.remove('modal-entering');
            if (content) {
                content.classList.remove('modal-content-entering');
            }
        }, 300);
        
        if (window.DebugStore) {
            DebugStore.debug('Modal animation in applied', {
                modalId: modalInfo.id,
                animationType: animationType
            }, 'MODALUI');
        }
    }
    
    /**
     * Animate modal out
     * @param {Object} modalInfo - Modal information
     * @param {string} animationType - Animation type
     * @param {Function} callback - Callback after animation
     */
    animateModalOut(modalInfo, animationType = 'fade', callback) {
        const { element, content } = modalInfo;
        
        // Add animation classes
        element.classList.add('modal-exiting');
        if (content) {
            content.classList.add('modal-content-exiting');
        }
        
        // Execute callback after animation
        setTimeout(() => {
            element.classList.remove('modal-exiting');
            if (content) {
                content.classList.remove('modal-content-exiting');
            }
            if (callback) callback();
        }, 300);
        
        if (window.DebugStore) {
            DebugStore.debug('Modal animation out applied', {
                modalId: modalInfo.id,
                animationType: animationType
            }, 'MODALUI');
        }
    }
    
    /**
     * Manage focus for accessibility
     * @param {Object} modalInfo - Modal information
     * @param {string} action - Action (show, hide)
     */
    manageFocus(modalInfo, action) {
        if (action === 'show') {
            // Store previous focus
            modalInfo.previousFocus = document.activeElement;
            
            // Focus on first focusable element or close button
            const focusableElements = modalInfo.element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        } else if (action === 'hide') {
            // Restore previous focus
            if (modalInfo.previousFocus && modalInfo.previousFocus.focus) {
                modalInfo.previousFocus.focus();
            }
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Modal focus managed', {
                modalId: modalInfo.id,
                action: action
            }, 'MODALUI');
        }
    }
    
    /**
     * Handle close button click
     * @param {string} modalId - Modal ID
     */
    handleCloseClick(modalId) {
        if (window.DebugStore) {
            DebugStore.info('Modal close button clicked', {
                modalId: modalId
            }, 'MODALUI');
        }
        
        // Emit close request
        if (window.EventBus) {
            EventBus.emit('modal:closeRequested', {
                modalId: modalId,
                source: 'closeButton'
            });
        }
    }
    
    /**
     * Handle click outside modal
     * @param {string} modalId - Modal ID
     */
    handleOutsideClick(modalId) {
        if (window.DebugStore) {
            DebugStore.debug('Modal outside click detected', {
                modalId: modalId
            }, 'MODALUI');
        }
        
        // Emit close request
        if (window.EventBus) {
            EventBus.emit('modal:closeRequested', {
                modalId: modalId,
                source: 'outsideClick'
            });
        }
    }
    
    /**
     * Get modal element info
     * @param {string} modalId - Modal ID
     * @returns {Object|null} - Modal info or null
     */
    getModalInfo(modalId) {
        return this.modalElements.get(modalId) || null;
    }
    
    /**
     * Check if modal is visually displayed
     * @param {string} modalId - Modal ID
     * @returns {boolean} - True if displayed
     */
    isModalDisplayed(modalId) {
        const modalInfo = this.modalElements.get(modalId);
        return modalInfo ? modalInfo.element.style.display === 'block' : false;
    }
    
    /**
     * Get all registered modals
     * @returns {Array} - Array of modal IDs
     */
    getRegisteredModals() {
        return Array.from(this.modalElements.keys());
    }
    
    /**
     * Get service statistics
     * @returns {Object} - Service stats
     */
    getStats() {
        const displayedModals = this.getRegisteredModals().filter(id => this.isModalDisplayed(id));
        
        return {
            registeredModals: this.getRegisteredModals(),
            registeredCount: this.modalElements.size,
            displayedModals: displayedModals,
            displayedCount: displayedModals.length,
            eventListeners: this.eventListeners.size
        };
    }
    
    /**
     * Reset all modal displays
     */
    reset() {
        this.modalElements.forEach((modalInfo, modalId) => {
            modalInfo.element.style.display = 'none';
            modalInfo.element.classList.remove('modal-entering', 'modal-exiting');
            if (modalInfo.content) {
                modalInfo.content.classList.remove('modal-content-entering', 'modal-content-exiting');
            }
        });
        
        if (window.DebugStore) {
            DebugStore.info('Modal UI reset', {}, 'MODALUI');
        }
    }
    
    /**
     * Destroy service (cleanup)
     */
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach((handler, key) => {
            const [modalId, type] = key.split('_');
            const modalInfo = this.modalElements.get(modalId);
            
            if (modalInfo) {
                if (type === 'close' && modalInfo.closeBtn) {
                    modalInfo.closeBtn.removeEventListener('click', handler);
                } else if (type === 'outside') {
                    modalInfo.element.removeEventListener('click', handler);
                }
            }
        });
        
        this.eventListeners.clear();
        this.reset();
        
        if (window.DebugStore) {
            DebugStore.debug('ModalUIService destroyed', {}, 'MODALUI');
        }
    }
}

// Export for use in other modules
window.ModalUIService = ModalUIService;