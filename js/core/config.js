// Application Configuration - Central configuration management

class AppConfig {
    constructor() {
        this.version = '2.0.0';
        this.buildDate = new Date().toISOString();
        
        // Application settings
        this.app = {
            name: 'Dots',
            description: 'AI-powered health tracking app',
            author: 'Health Intelligence',
            supportEmail: 'support@healthdots.app'
        };
        
        // Feature flags
        this.features = {
            healthAnalysis: true,
            offlineMode: true,
            debugLogging: true,
            exportImport: true,
            advancedFiltering: true,
            markdownExport: true,
            thinkModal: true,
            backgroundAnalysis: true
        };
        
        // UI configuration
        this.ui = {
            animationDuration: 300,
            toastDuration: 3000,
            maxPreviewLength: 150,
            maxContentLength: 10000,
            debounceDelay: 500,
            autoSaveDelay: 1000
        };
        
        // Analysis configuration
        this.analysis = {
            maxRetries: 3,
            retryDelay: 2000,
            batchSize: 5,
            minContentLength: 10,
            processingDelay: 500
        };
        
        // Storage configuration
        this.storage = {
            maxLogEntries: 1000,
            maxAnalyses: 1000,
            maxDebugLogs: 500,
            cleanupThreshold: 0.9,
            backupFrequency: 86400000 // 24 hours in ms
        };
        
        // Debug configuration
        this.debug = {
            logLevel: 'INFO', // ERROR, WARN, INFO, SUCCESS, DEBUG
            maxLogs: 500,
            enablePerformanceTracking: true,
            enableConsoleOutput: true,
            enableSystemHealthChecks: true
        };
        
        // API configuration
        this.api = {
            timeout: 30000, // 30 seconds
            maxRequestSize: 1048576, // 1MB
            retryAttempts: 3,
            baseURL: 'https://api.anthropic.com'
        };
        
        // PWA configuration
        this.pwa = {
            enableServiceWorker: true,
            enableInstallPrompt: true,
            cacheVersion: 'v2.0.0',
            offlineMessage: 'You are currently offline'
        };
        
        // Health tracking configuration
        this.health = {
            maxHealthDescriptionLength: 5000,
            minHealthDescriptionLength: 10,
            enableContextTracking: true,
            enableCategorization: true,
            enablePatternDetection: true
        };
        
        if (window.DebugStore) {
            DebugStore.debug('AppConfig initialized', {
                version: this.version,
                featuresEnabled: Object.keys(this.features).filter(key => this.features[key])
            }, 'CONFIG');
        }
    }
    
    /**
     * Get application version
     * @returns {string} - Application version
     */
    getVersion() {
        return this.version;
    }
    
    /**
     * Check if a feature is enabled
     * @param {string} featureName - Name of the feature
     * @returns {boolean} - True if feature is enabled
     */
    isFeatureEnabled(featureName) {
        return !!this.features[featureName];
    }
    
    /**
     * Enable or disable a feature
     * @param {string} featureName - Name of the feature
     * @param {boolean} enabled - Whether to enable the feature
     */
    setFeature(featureName, enabled) {
        if (this.features.hasOwnProperty(featureName)) {
            this.features[featureName] = enabled;
            
            if (window.DebugStore) {
                DebugStore.info('Feature toggled', {
                    feature: featureName,
                    enabled: enabled
                }, 'CONFIG');
            }
        }
    }
    
    /**
     * Get UI configuration value
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getUIConfig(key) {
        return this.ui[key];
    }
    
    /**
     * Get analysis configuration value
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getAnalysisConfig(key) {
        return this.analysis[key];
    }
    
    /**
     * Get storage configuration value
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getStorageConfig(key) {
        return this.storage[key];
    }
    
    /**
     * Get debug configuration value
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getDebugConfig(key) {
        return this.debug[key];
    }
    
    /**
     * Get API configuration value
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getAPIConfig(key) {
        return this.api[key];
    }
    
    /**
     * Get PWA configuration value
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getPWAConfig(key) {
        return this.pwa[key];
    }
    
    /**
     * Get health configuration value
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getHealthConfig(key) {
        return this.health[key];
    }
    
    /**
     * Update configuration values
     * @param {string} section - Configuration section
     * @param {Object} updates - Updates to apply
     */
    updateConfig(section, updates) {
        if (this[section] && typeof this[section] === 'object') {
            this[section] = { ...this[section], ...updates };
            
            if (window.DebugStore) {
                DebugStore.info('Configuration updated', {
                    section: section,
                    updates: Object.keys(updates)
                }, 'CONFIG');
            }
        }
    }
    
    /**
     * Reset configuration to defaults
     * @param {string} section - Section to reset (optional, resets all if not provided)
     */
    resetConfig(section = null) {
        if (section) {
            // Reset specific section (would need default values stored)
            if (window.DebugStore) {
                DebugStore.info('Configuration section reset', { section }, 'CONFIG');
            }
        } else {
            // Create new instance to reset all
            const newConfig = new AppConfig();
            Object.assign(this, newConfig);
            
            if (window.DebugStore) {
                DebugStore.info('All configuration reset to defaults', {}, 'CONFIG');
            }
        }
    }
    
    /**
     * Get environment-specific configuration
     * @returns {Object} - Environment configuration
     */
    getEnvironmentConfig() {
        const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        
        return {
            isDevelopment: isDevelopment,
            isProduction: !isDevelopment,
            enableDebugFeatures: isDevelopment,
            enableAnalytics: !isDevelopment,
            apiEndpoint: isDevelopment ? 'http://localhost:3000' : 'https://api.healthdots.app'
        };
    }
    
    /**
     * Get device-specific configuration
     * @returns {Object} - Device configuration
     */
    getDeviceConfig() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android|Tablet/i.test(navigator.userAgent);
        const isDesktop = !isMobile && !isTablet;
        
        return {
            isMobile: isMobile,
            isTablet: isTablet,
            isDesktop: isDesktop,
            hasTouch: 'ontouchstart' in window,
            supportsServiceWorker: 'serviceWorker' in navigator,
            supportsNotifications: 'Notification' in window,
            supportsClipboard: 'clipboard' in navigator
        };
    }
    
    /**
     * Get browser-specific configuration
     * @returns {Object} - Browser configuration
     */
    getBrowserConfig() {
        const userAgent = navigator.userAgent;
        
        return {
            isChrome: /Chrome/.test(userAgent),
            isFirefox: /Firefox/.test(userAgent),
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isEdge: /Edge/.test(userAgent),
            supportsLocalStorage: typeof Storage !== 'undefined',
            supportsIndexedDB: 'indexedDB' in window,
            supportsWebWorkers: typeof Worker !== 'undefined'
        };
    }
    
    /**
     * Validate configuration integrity
     * @returns {Object} - Validation result
     */
    validateConfig() {
        const errors = [];
        const warnings = [];
        
        // Check required configurations
        if (!this.version) errors.push('Version not specified');
        if (!this.app.name) errors.push('App name not specified');
        
        // Check numeric values
        if (this.ui.maxContentLength < 100) warnings.push('Max content length very low');
        if (this.storage.maxLogEntries < 10) warnings.push('Max log entries very low');
        if (this.api.timeout < 5000) warnings.push('API timeout very low');
        
        // Check feature consistency
        if (this.features.healthAnalysis && !this.features.backgroundAnalysis) {
            warnings.push('Health analysis enabled but background analysis disabled');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
    
    /**
     * Export configuration for backup
     * @returns {Object} - Configuration export
     */
    export() {
        return {
            version: this.version,
            buildDate: this.buildDate,
            exportedAt: new Date().toISOString(),
            config: {
                app: this.app,
                features: this.features,
                ui: this.ui,
                analysis: this.analysis,
                storage: this.storage,
                debug: this.debug,
                api: this.api,
                pwa: this.pwa,
                health: this.health
            }
        };
    }
    
    /**
     * Import configuration from backup
     * @param {Object} configData - Configuration data to import
     * @returns {boolean} - Import success
     */
    import(configData) {
        try {
            if (!configData || !configData.config) {
                throw new Error('Invalid configuration data');
            }
            
            // Import each section if it exists
            const sections = ['app', 'features', 'ui', 'analysis', 'storage', 'debug', 'api', 'pwa', 'health'];
            
            for (const section of sections) {
                if (configData.config[section]) {
                    this[section] = { ...this[section], ...configData.config[section] };
                }
            }
            
            if (window.DebugStore) {
                DebugStore.success('Configuration imported', {
                    fromVersion: configData.version,
                    sectionsImported: sections.filter(s => configData.config[s])
                }, 'CONFIG');
            }
            
            return true;
        } catch (error) {
            if (window.DebugStore) {
                DebugStore.error('Configuration import failed', {
                    error: error.message
                }, 'CONFIG');
            }
            return false;
        }
    }
    
    /**
     * Get full configuration object
     * @returns {Object} - Complete configuration
     */
    getAll() {
        return {
            version: this.version,
            buildDate: this.buildDate,
            app: this.app,
            features: this.features,
            ui: this.ui,
            analysis: this.analysis,
            storage: this.storage,
            debug: this.debug,
            api: this.api,
            pwa: this.pwa,
            health: this.health,
            environment: this.getEnvironmentConfig(),
            device: this.getDeviceConfig(),
            browser: this.getBrowserConfig()
        };
    }
}

// Create and export global configuration instance
window.AppConfig = new AppConfig();