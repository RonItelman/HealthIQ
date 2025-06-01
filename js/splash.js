// Splash Screen Module - Animated dots during app initialization

const Splash = {
    // Configuration parameters
    config: {
        dotCount: 12,
        minSize: 15,
        maxSize: 35,
        bounceSpeed: 0.08,
        bounceHeight: 60,
        staggerDelay: 0.3,
        fadeInDuration: 800,
        fadeOutDuration: 600,
        colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'],
        logoFadeDuration: 1000
    },
    
    // State
    canvas: null,
    ctx: null,
    dots: [],
    animationId: null,
    isVisible: false,
    
    // Initialize splash screen
    init() {
        this.createSplashHTML();
        this.setupCanvas();
        this.createDots();
    },
    
    // Create splash screen HTML structure
    createSplashHTML() {
        const splashHTML = `
            <div id="splashScreen" class="splash-screen">
                <div class="splash-content">
                    <div class="splash-logo">
                        <img src="logo.svg" alt="Dots Logo" class="splash-logo-img">
                        <div class="splash-app-name">Dots</div>
                    </div>
                    <canvas id="splashCanvas" class="splash-canvas"></canvas>
                    <div class="splash-tagline">Connecting Your Health Patterns</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', splashHTML);
    },
    
    // Setup canvas for animation
    setupCanvas() {
        this.canvas = document.getElementById('splashCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    },
    
    // Resize canvas to fit container
    resizeCanvas() {
        const container = document.querySelector('.splash-content');
        if (container) {
            this.canvas.width = container.offsetWidth;
            this.canvas.height = 300; // Fixed height for animation area
            
            // Recreate dots with new canvas dimensions
            if (this.dots.length > 0) {
                this.createDots();
            }
        }
    },
    
    // Create dot objects arranged in logo formation
    createDots() {
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
    },
    
    // Create individual dot
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
    },
    
    // Animation loop
    animate() {
        if (!this.isVisible) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw dots
        this.dots.forEach((dot, index) => {
            this.updateDot(dot, index);
            this.drawDot(dot);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    // Update dot position and properties
    updateDot(dot, index) {
        // Update bounce phase
        dot.bouncePhase += this.config.bounceSpeed;
        
        // Calculate bounce offset (straight up and down)
        dot.bounceOffset = Math.sin(dot.bouncePhase) * this.config.bounceHeight;
        
        // Apply bounce to Y position only
        dot.y = dot.originalY + dot.bounceOffset;
        
        // Keep current size as original size (no pulsing)
        dot.currentSize = dot.size;
    },
    
    // Draw individual dot
    drawDot(dot) {
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
    },
    
    // Show splash screen
    show() {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            this.isVisible = true;
            splashScreen.style.display = 'flex';
            
            // Fade in animation
            setTimeout(() => {
                splashScreen.classList.add('splash-visible');
            }, 10);
            
            // Start animation
            this.resizeCanvas();
            this.animate();
            
            // Staggered logo animation
            setTimeout(() => {
                document.querySelector('.splash-logo').classList.add('logo-visible');
            }, 200);
            
            setTimeout(() => {
                document.querySelector('.splash-tagline').classList.add('tagline-visible');
            }, 800);
        }
    },
    
    // Hide splash screen
    hide() {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen && this.isVisible) {
            this.isVisible = false;
            
            // Cancel animation
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            // Fade out animation
            splashScreen.classList.add('splash-hiding');
            
            setTimeout(() => {
                splashScreen.style.display = 'none';
                splashScreen.remove(); // Clean up DOM
            }, this.config.fadeOutDuration);
        }
    },
    
    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Recreate dots if count changed
        if (newConfig.dotCount !== undefined) {
            this.createDots();
        }
    },
    
    // Get current state (for debugging)
    getState() {
        return {
            isVisible: this.isVisible,
            dotCount: this.dots.length,
            canvasSize: this.canvas ? { width: this.canvas.width, height: this.canvas.height } : null,
            config: this.config
        };
    }
};

// Export for use in other modules
window.Splash = Splash;