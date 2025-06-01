// Log Data Store - Secure persistence for raw log entries

class LogDataStore {
    constructor() {
        this.STORAGE_KEY = 'dots_raw_logs_v1';
        this.nextId = 1;
        this.logs = new Map(); // Use Map for O(1) lookups
        this.loadFromStorage();
    }

    // Generate next incremental ID
    generateId() {
        const id = this.nextId;
        this.nextId++;
        this.saveMetadata();
        return id;
    }

    // Create new log entry - IMMEDIATELY persisted
    createLogEntry(content) {
        const timestamp = new Date().toISOString();
        const id = this.generateId();
        
        const logEntry = {
            id: id,
            timestamp: timestamp,
            content: content.trim(),
            version: 1 // For future schema changes
        };

        // IMMEDIATE persistence - no waiting
        this.logs.set(id, logEntry);
        this.saveToStorage();
        
        console.log(`Raw log entry saved with ID: ${id}`);
        return logEntry;
    }

    // Get log entry by ID
    getLogEntry(id) {
        return this.logs.get(id) || null;
    }

    // Get all log entries sorted by timestamp (newest first)
    getAllLogEntries() {
        const entries = Array.from(this.logs.values());
        return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Get logs for a specific date
    getLogEntriesForDate(date) {
        const targetDate = new Date(date).toDateString();
        return this.getAllLogEntries().filter(entry => 
            new Date(entry.timestamp).toDateString() === targetDate
        );
    }

    // Get logs in date range
    getLogEntriesInRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.getAllLogEntries().filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= start && entryDate <= end;
        });
    }

    // Update log entry content (if needed)
    updateLogEntry(id, newContent) {
        const entry = this.logs.get(id);
        if (entry) {
            entry.content = newContent.trim();
            entry.lastModified = new Date().toISOString();
            this.saveToStorage();
            return entry;
        }
        return null;
    }

    // Delete log entry
    deleteLogEntry(id) {
        const deleted = this.logs.delete(id);
        if (deleted) {
            this.saveToStorage();
            console.log(`Raw log entry deleted: ${id}`);
        }
        return deleted;
    }

    // Get statistics
    getStats() {
        const entries = this.getAllLogEntries();
        const today = new Date().toDateString();
        const todayEntries = entries.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        );

        return {
            totalEntries: entries.length,
            todayEntries: todayEntries.length,
            firstEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
            lastEntry: entries.length > 0 ? entries[0].timestamp : null,
            nextId: this.nextId
        };
    }

    // Save to localStorage with error handling
    saveToStorage() {
        try {
            const data = {
                logs: Array.from(this.logs.entries()),
                nextId: this.nextId,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log(`Raw logs saved: ${this.logs.size} entries`);
        } catch (error) {
            console.error('Failed to save raw logs to storage:', error);
            // Try to free up space and retry once
            this.cleanupOldData();
            try {
                const data = {
                    logs: Array.from(this.logs.entries()),
                    nextId: this.nextId,
                    lastSaved: new Date().toISOString()
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
                console.log('Raw logs saved after cleanup');
            } catch (retryError) {
                console.error('Critical: Unable to save raw logs even after cleanup:', retryError);
                throw new Error('Storage failure - raw logs not saved');
            }
        }
    }

    // Load from localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                
                // Restore logs Map
                this.logs = new Map(parsed.logs || []);
                this.nextId = parsed.nextId || 1;
                
                console.log(`Raw logs loaded: ${this.logs.size} entries, next ID: ${this.nextId}`);
            } else {
                console.log('No existing raw logs found, starting fresh');
            }
        } catch (error) {
            console.error('Failed to load raw logs from storage:', error);
            // Don't throw - start fresh if corrupted
            this.logs = new Map();
            this.nextId = 1;
        }
    }

    // Save metadata (nextId) separately for extra safety
    saveMetadata() {
        try {
            localStorage.setItem('dots_log_metadata_v1', JSON.stringify({
                nextId: this.nextId,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Failed to save log metadata:', error);
        }
    }

    // Clean up old data if storage is full
    cleanupOldData() {
        try {
            // Remove old versions and other app data if needed
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.includes('dots_') && !key.includes('_v1')) {
                    localStorage.removeItem(key);
                    console.log(`Cleaned up old storage key: ${key}`);
                }
            });
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
        }
    }

    // Export data for backup
    exportData() {
        return {
            logs: Array.from(this.logs.entries()),
            nextId: this.nextId,
            exportedAt: new Date().toISOString(),
            version: 1
        };
    }

    // Import data from backup
    importData(data) {
        try {
            this.logs = new Map(data.logs || []);
            this.nextId = data.nextId || 1;
            this.saveToStorage();
            console.log(`Imported ${this.logs.size} raw log entries`);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Clear all data (dangerous!)
    clearAllData() {
        this.logs.clear();
        this.nextId = 1;
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('dots_log_metadata_v1');
        console.log('All raw log data cleared');
    }

    // Check data integrity
    checkIntegrity() {
        const issues = [];
        
        // Check for duplicate IDs
        const ids = Array.from(this.logs.keys());
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            issues.push('Duplicate IDs found');
        }

        // Check timestamp validity
        Array.from(this.logs.values()).forEach(entry => {
            if (!entry.timestamp || isNaN(new Date(entry.timestamp))) {
                issues.push(`Invalid timestamp in entry ${entry.id}`);
            }
            if (!entry.content || entry.content.trim() === '') {
                issues.push(`Empty content in entry ${entry.id}`);
            }
        });

        return {
            isValid: issues.length === 0,
            issues: issues,
            checkedAt: new Date().toISOString()
        };
    }
}

// Create singleton instance
const logDataStore = new LogDataStore();

// Export for use in other modules
window.LogDataStore = logDataStore;