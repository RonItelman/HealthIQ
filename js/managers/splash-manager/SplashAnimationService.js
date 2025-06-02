// SplashAnimationService - Handles canvas animation and dots

class SplashAnimationService {
    constructor() {
        this.config = {
            dotCount: 12,
            minSize: 15,
            maxSize: 35,
            bounceSpeed: 0.08,
            bounceHeight: 60,
            staggerDelay: 0.3,
            colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc']
        };
        
        this.canvas = null;
        this.ctx = null;
        this.dots = [];
        this.animationId = null;
        this.isAnimating = false;
        
        if (window.DebugStore) {
            DebugStore.debug('SplashAnimationService initialized', {
                dotCount: this.config.dotCount,
                colorCount: this.config.colors.length
            }, 'SPLASHANIM');
        }
    }
    
    /**
     * Initialize animation service
     */
    init() {
        if (window.DebugStore) {
            DebugStore.debug('SplashAnimationService init completed', {}, 'SPLASHANIM');
        }
    }
    
    /**
     * Setup canvas for animation
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    setupCanvas(canvas) {
        if (!canvas) {
            if (window.DebugStore) {
                DebugStore.error('Canvas element not provided', {}, 'SPLASHANIM');
            }
            return false;
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        if (window.DebugStore) {
            DebugStore.debug('Canvas setup completed', {
                width: this.canvas.width,
                height: this.canvas.height
            }, 'SPLASHANIM');
        }
        
        return true;
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = document.querySelector('.splash-content');
        if (container) {
            this.canvas.width = container.offsetWidth;
            this.canvas.height = 300; // Fixed height for animation area
            
            // Recreate dots with new canvas dimensions
            if (this.dots.length > 0) {
                this.createDots();
            }
            
            if (window.DebugStore) {
                DebugStore.debug('Canvas resized', {
                    width: this.canvas.width,
                    height: this.canvas.height,
                    dotCount: this.dots.length
                }, 'SPLASHANIM');
            }
        }
    }
    
    /**
     * Create dot objects arranged in logo formation
     */
    createDots() {
        if (!this.canvas) return;
        
        this.dots = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 80;
        
        // Create dots in circular formation like a logo
        for (let i = 0; i < this.config.dotCount; i++) {
            const angle = (i / this.config.dotCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            this.dots.push(this.createDot(x, y, i));
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Dots created', {
                dotCount: this.dots.length,
                centerX: centerX,
                centerY: centerY,
                radius: radius
            }, 'SPLASHANIM');
        }
    }
    
    /**
     * Create individual dot
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} index - Dot index
     * @returns {Object} - Dot object
     */
    createDot(x, y, index) {
        return {
            x: x,
            y: y,
            originalY: y, // Store original position
            size: this.config.minSize + (this.config.maxSize - this.config.minSize) * (0.5 + Math.random() * 0.5),
            color: this.config.colors[index % this.config.colors.length],
            bouncePhase: index * this.config.staggerDelay, // Staggered animation
            bounceOffset: 0,
            opacity: 0.9
        };
    }
    
    /**
     * Start animation
     */
    startAnimation() {
        if (!this.canvas || !this.ctx) {
            if (window.DebugStore) {
                DebugStore.error('Cannot start animation - canvas not setup', {}, 'SPLASHANIM');
            }
            return;
        }
        
        this.isAnimating = true;
        this.createDots();
        this.animate();
        
        if (window.DebugStore) {
            DebugStore.info('Animation started', {
                dotCount: this.dots.length
            }, 'SPLASHANIM');
        }
    }
    
    /**
     * Stop animation
     */
    stopAnimation() {
        this.isAnimating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (window.DebugStore) {
            DebugStore.info('Animation stopped', {}, 'SPLASHANIM');
        }
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw dots
        this.dots.forEach((dot, index) => {
            this.updateDot(dot, index);
            this.drawDot(dot);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Update dot position and properties
     * @param {Object} dot - Dot object
     * @param {number} index - Dot index
     */
    updateDot(dot, index) {
        // Update bounce phase
        dot.bouncePhase += this.config.bounceSpeed;
        
        // Calculate bounce offset (straight up and down)
        dot.bounceOffset = Math.sin(dot.bouncePhase) * this.config.bounceHeight;
        
        // Apply bounce to Y position only
        dot.y = dot.originalY + dot.bounceOffset;
        
        // Keep current size as original size (no pulsing)
        dot.currentSize = dot.size;
    }
    
    /**
     * Draw individual dot
     * @param {Object} dot - Dot object
     */
    drawDot(dot) {
        if (!this.ctx) return;
        
        this.ctx.save();
        
        // Create gradient for each dot
        const gradient = this.ctx.createRadialGradient(
            dot.x, dot.y, 0,
            dot.x, dot.y, dot.currentSize
        );
        gradient.addColorStop(0, dot.color);
        gradient.addColorStop(1, dot.color + '20'); // Add transparency
        
        this.ctx.globalAlpha = dot.opacity;
        this.ctx.fillStyle = gradient;
        
        // Draw dot with soft edges
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, dot.currentSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add inner highlight
        this.ctx.globalAlpha = dot.opacity * 0.6;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            dot.x - dot.currentSize * 0.3, 
            dot.y - dot.currentSize * 0.3, 
            dot.currentSize * 0.3, 
            0, Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * Update animation configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Recreate dots if count changed
        if (newConfig.dotCount !== undefined && this.canvas) {
            this.createDots();
        }
        
        if (window.DebugStore) {
            DebugStore.debug('Animation config updated', {
                newConfig: newConfig,
                currentConfig: this.config
            }, 'SPLASHANIM');
        }
    }
    
    /**
     * Check if animation is running
     * @returns {boolean} - True if animation is running
     */
    isRunning() {
        return this.isAnimating;
    }
    
    /**
     * Get animation statistics
     * @returns {Object} - Animation stats
     */
    getStats() {
        return {
            isAnimating: this.isAnimating,
            dotCount: this.dots.length,
            canvasSize: this.canvas ? { width: this.canvas.width, height: this.canvas.height } : null,
            config: this.config,
            hasCanvas: !!this.canvas,
            hasContext: !!this.ctx
        };
    }
    
    /**
     * Clean up animation resources
     */
    destroy() {
        this.stopAnimation();
        this.dots = [];
        this.canvas = null;
        this.ctx = null;
        
        if (window.DebugStore) {
            DebugStore.debug('SplashAnimationService destroyed', {}, 'SPLASHANIM');
        }
    }
}

// Export for use in other modules
window.SplashAnimationService = SplashAnimationService;