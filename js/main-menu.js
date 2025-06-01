// Main Menu Module - Handles slide-out navigation menu

const MainMenu = {
    isOpen: false,
    
    // Initialize main menu
    init() {
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Header click to open menu
        const headerLeft = document.querySelector('.header-left');
        headerLeft.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // Close menu when clicking overlay
        document.getElementById('menuOverlay').addEventListener('click', () => {
            this.closeMenu();
        });
        
        // Health Issues menu item
        document.getElementById('menuHealthBtn').addEventListener('click', () => {
            this.closeMenu();
            // Use Health module's method to show modal
            if (Health && Health.showHealthModal) {
                Health.showHealthModal();
            }
        });
        
        // View Logs menu item
        document.getElementById('menuViewBtn').addEventListener('click', () => {
            this.closeMenu();
            LogManager.showLogModal();
        });
        
        // Think menu item
        document.getElementById('menuThinkBtn').addEventListener('click', () => {
            this.closeMenu();
            EventHandler.showThinkView();
        });
        
        // Close menu with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
    },
    
    // Toggle menu open/close
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    },
    
    // Open menu
    openMenu() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        document.getElementById('mainMenu').classList.add('menu-open');
        document.getElementById('menuOverlay').classList.add('overlay-visible');
        document.body.style.overflow = 'hidden';
        
        // Add visual feedback to header
        document.querySelector('.header-left').classList.add('menu-active');
    },
    
    // Close menu
    closeMenu() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        document.getElementById('mainMenu').classList.remove('menu-open');
        document.getElementById('menuOverlay').classList.remove('overlay-visible');
        document.body.style.overflow = 'auto';
        
        // Remove visual feedback from header
        document.querySelector('.header-left').classList.remove('menu-active');
    },
    
    // Get menu state (for debugging)
    getState() {
        return {
            isOpen: this.isOpen
        };
    }
};

// Export for use in other modules
window.MainMenu = MainMenu;