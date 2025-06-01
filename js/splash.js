// Splash Screen Module - Animated dots during app initialization

const Splash = {
    // Configuration parameters
    config: {
        dotCount: 25,
        minSize: 8,
        maxSize: 24,
        animationSpeed: 0.02,
        bounceHeight: 200,
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
        }
    },
    
    // Create dot objects
    createDots() {
        this.dots = [];
        for (let i = 0; i < this.config.dotCount; i++) {
            this.dots.push(this.createDot());
        }
    },
    
    // Create individual dot
    createDot() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * (this.config.maxSize - this.config.minSize) + this.config.minSize,
            color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
            vx: (Math.random() - 0.5) * 2, // Horizontal velocity
            vy: (Math.random() - 0.5) * 2, // Vertical velocity
            bounce: Math.random() * this.config.bounceHeight + 50,
            phase: Math.random() * Math.PI * 2, // For wave motion
            pulsePhase: Math.random() * Math.PI * 2, // For size pulsing
            opacity: 0.8 + Math.random() * 0.2
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
        // Floating motion with wave-like movement
        dot.phase += this.config.animationSpeed;
        dot.pulsePhase += this.config.animationSpeed * 1.5;
        
        // Wave motion
        dot.x += Math.sin(dot.phase) * 0.5;
        dot.y += Math.cos(dot.phase * 0.7) * 0.3;
        
        // Gentle drift
        dot.x += dot.vx * 0.5;
        dot.y += dot.vy * 0.5;
        
        // Pulse size
        const basePulse = Math.sin(dot.pulsePhase) * 0.3 + 1;
        dot.currentSize = dot.size * basePulse;
        
        // Wrap around edges
        if (dot.x < 0) dot.x = this.canvas.width;
        if (dot.x > this.canvas.width) dot.x = 0;
        if (dot.y < 0) dot.y = this.canvas.height;
        if (dot.y > this.canvas.height) dot.y = 0;
        
        // Occasional direction change
        if (Math.random() < 0.01) {
            dot.vx = (Math.random() - 0.5) * 2;
            dot.vy = (Math.random() - 0.5) * 2;
        }
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