// Spring Launch Physics Game - Core Logic
let canvas;
let projectile;
let spring;
let targets = [];
let isLaunched = false;
let isGameWon = false;
let trailPoints = [];
let trailParticles = []; // Added for enhanced trail effects
let bounceParticles = []; // Added for bounce animation
let launchCount = 0;
let hitCount = 0;
let missInfo = {
    show: false,
    x: 0,
    y: 0,
    alpha: 255,
    scale: 1
}; // New variable to track if the player missed all targets

// Physics constants
const PHYSICS = { SPRING: { K: 0.03, BASE_LENGTH: 75 }, GRAVITY: 0.15, DAMPING: 0.99, 
  FLOOR_Y: 412, LAUNCH: { X: 75, Y: 412 }, DEFAULT: { ANGLE: 45, TENSION: 15 } };

// Game setup
function setup() {
    // Create canvas inside the game-canvas div
    canvas = createCanvas(750, 487); // Reduced by 25% from 1000x650
    canvas.parent('game-canvas');
    
    // Initialize game objects
    resetGame();
    
    // Set up event listeners for UI controls
    document.getElementById('spring-tension').addEventListener('input', updateTension);
    document.getElementById('launch-angle').addEventListener('input', updateAngle);
    document.getElementById('launch-btn').addEventListener('click', launchProjectile);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    
    // Update initial UI values
    updateUIValues();
}

function resetGame(resetScore = true) {
    // Reset game state
    isLaunched = false;
    isGameWon = false;
    trailPoints = [];
    trailParticles = []; // Reset trail particles
    bounceParticles = []; // Reset bounce particles
    missInfo.show = false; // Reset miss message flag
    
    if (resetScore) {
        launchCount = 0;
        hitCount = 0;
    }
    
    // Create spring and projectile
    spring = {
        x: PHYSICS.LAUNCH.X,
        y: PHYSICS.LAUNCH.Y,
        tension: PHYSICS.DEFAULT.TENSION,
        angle: PHYSICS.DEFAULT.ANGLE, // Store angle in degrees for easier manipulation
        baseLength: PHYSICS.SPRING.BASE_LENGTH,
        currentLength: PHYSICS.SPRING.BASE_LENGTH - PHYSICS.DEFAULT.TENSION // Start with spring compressed
    };
    
    // Calculate projectile position based on spring
    const angleInRadians = spring.angle * (Math.PI / 180);
    const springEndX = PHYSICS.LAUNCH.X + spring.currentLength * Math.cos(angleInRadians);
    const springEndY = PHYSICS.LAUNCH.Y - spring.currentLength * Math.sin(angleInRadians);
    
    projectile = {
        x: springEndX,
        y: springEndY,
        vx: 0,
        vy: 0,
        radius: 11, // Reduced from 15
        isActive: true
    };
    
    // Reset targets if resetting score
    if (resetScore) {
        targets = [
            { x: 225, y: PHYSICS.FLOOR_Y, radius: 15, isHit: false, color: color(220, 50, 50) },    // Vibrant red
            { x: 375, y: PHYSICS.FLOOR_Y, radius: 15, isHit: false, color: color(50, 180, 50) },    // Rich green
            { x: 525, y: PHYSICS.FLOOR_Y, radius: 15, isHit: false, color: color(70, 90, 220) }     // Deep blue
        ];
    }
    
    // Reset UI controls
    document.getElementById('spring-tension').value = PHYSICS.DEFAULT.TENSION;
    document.getElementById('launch-angle').value = PHYSICS.DEFAULT.ANGLE;
    
    // Update UI displays
    document.getElementById('tension-value').textContent = PHYSICS.DEFAULT.TENSION;
    document.getElementById('angle-value').textContent = PHYSICS.DEFAULT.ANGLE + '°';
    if (resetScore) {
        document.getElementById('targets-hit').textContent = '0/3';
    }
    
    updateUIValues();
}

function updateTension() {
    if (!isLaunched) {
        spring.tension = parseInt(this.value);
        document.getElementById('tension-value').textContent = spring.tension;
        
        // Calculate spring compression based on tension
        spring.currentLength = spring.baseLength - spring.tension;
        
        // Update projectile position
        updateProjectilePosition();
        
        updateUIValues();
    }
}

function updateAngle() {
    if (!isLaunched) {
        // Invert the angle to make the slider work intuitively
        // 0 on slider = 0 degrees (horizontal), 90 on slider = 90 degrees (vertical)
        spring.angle = parseInt(this.value);
        document.getElementById('angle-value').textContent = spring.angle + '°';
        
        // Update projectile position
        updateProjectilePosition();
        
        updateUIValues();
    }
}

function updateProjectilePosition() {
    // Convert angle to radians for calculation
    // Use the angle directly instead of subtracting from 90
    const angleInRadians = spring.angle * (Math.PI / 180);
    
    // Calculate end point of spring
    projectile.x = PHYSICS.LAUNCH.X + spring.currentLength * Math.cos(angleInRadians);
    projectile.y = PHYSICS.LAUNCH.Y - spring.currentLength * Math.sin(angleInRadians);
}

function launchProjectile() {
    if (!isLaunched && !isGameWon) {
        isLaunched = true;
        launchCount++;
        
        // Apply Hooke's Law: F = -kx
        const compression = spring.baseLength - spring.currentLength;
        const force = PHYSICS.SPRING.K * compression * 7; // Changed multiplier from 5 to 7
        
        // Convert angle to radians for calculation
        // Use the angle directly instead of subtracting from 90
        const angleInRadians = spring.angle * (Math.PI / 180);
        
        // Calculate initial velocity components based on force and angle
        projectile.vx = force * Math.cos(angleInRadians);
        projectile.vy = -force * Math.sin(angleInRadians); // Negative for upward velocity
        
        // Log initial conditions for debugging
        console.log(`Launch angle: ${spring.angle}° (${angleInRadians.toFixed(2)} radians)`);
        console.log(`Launch velocity: ${projectile.vx.toFixed(2)}, ${projectile.vy.toFixed(2)}`);
        console.log(`Force: ${force.toFixed(2)} N`);
    }
}

function updateProjectile() {
    if (isLaunched && projectile.isActive) {
        // Apply physics: gravity and movement
        projectile.vy += PHYSICS.GRAVITY;
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        
        // Apply minimal air resistance
        projectile.vx *= PHYSICS.DAMPING;
        projectile.vy *= PHYSICS.DAMPING;
        
        // Add point to trajectory trail
        if (frameCount % 2 === 0) { // Increased frequency (was 3)
            trailPoints.push({ x: projectile.x, y: projectile.y });
            
            // Add trail particles with random offset for more dynamic effect
            for (let i = 0; i < 3; i++) { // Create multiple particles per position
                const offsetX = random(-3, 3);
                const offsetY = random(-3, 3);
                trailParticles.push({
                    x: projectile.x + offsetX,
                    y: projectile.y + offsetY,
                    size: random(3, 8),
                    alpha: 255,
                    vx: random(-0.5, 0.5),
                    vy: random(-0.5, 0.5)
                });
            }
        }
        
        // Check for floor collision
        if (projectile.y > PHYSICS.FLOOR_Y - projectile.radius) {
            // Set position to rest on the floor
            projectile.y = PHYSICS.FLOOR_Y - projectile.radius;
            
            // Create landing particles
            for (let i = 0; i < 20; i++) {
                bounceParticles.push({
                    x: projectile.x + random(-projectile.radius, projectile.radius),
                    y: PHYSICS.FLOOR_Y - random(0, 5),
                    size: random(2, 6),
                    alpha: 255,
                    vx: random(-3, 3),
                    vy: random(-5, -1),
                    life: 255
                });
            }
            
            // Stop the projectile immediately when it hits the ground
            projectile.vx = 0;
            projectile.vy = 0;
            projectile.isActive = false;
            
            // Check if player missed all targets
            const hitAnyTarget = targets.some(target => target.isHit);
            if (!hitAnyTarget) {
                // Set miss message info at the projectile's landing position
                missInfo = {
                    show: true,
                    x: projectile.x,
                    y: PHYSICS.FLOOR_Y - 30, // Position above the floor
                    alpha: 255,
                    scale: 1
                };
            }
            
            // Reset after 1 second, preserving score
            setTimeout(() => {
                resetGame(false);
            }, 1000);
        }
        
        // Update trail particles
        updateTrailParticles();
        
        // Update bounce particles
        updateBounceParticles();
        
        // Update miss message animation
        updateMissMessage();
        
        // Check for target collisions
        checkTargetCollisions();
    }
}

// New function to update the miss message animation
function updateMissMessage() {
    if (missInfo.show) {
        // Fade out gradually
        missInfo.alpha -= 2;
        
        // Increase scale slightly for a growing effect
        missInfo.scale += 0.005;
        
        // Hide when fully transparent
        if (missInfo.alpha <= 0) {
            missInfo.show = false;
        }
    }
}

// New function to update trail particles
function updateTrailParticles() {
    // Update existing particles
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        
        // Fade out
        p.alpha -= 5;
        
        // Move slightly
        p.x += p.vx;
        p.y += p.vy;
        
        // Remove if fully transparent
        if (p.alpha <= 0) {
            trailParticles.splice(i, 1);
        }
    }
    
    // Limit the number of particles for performance
    if (trailParticles.length > 300) {
        trailParticles.splice(0, trailParticles.length - 300);
    }
}

// New function to update bounce particles
function updateBounceParticles() {
    for (let i = bounceParticles.length - 1; i >= 0; i--) {
        const p = bounceParticles[i];
        
        // Apply gravity
        p.vy += 0.1;
        
        // Move
        p.x += p.vx;
        p.y += p.vy;
        
        // Fade out
        p.life -= 5;
        
        // Remove if fully transparent or below floor
        if (p.life <= 0 || p.y > PHYSICS.FLOOR_Y) {
            bounceParticles.splice(i, 1);
        }
    }
}

function checkTargetCollisions() {
    if (isLaunched && projectile.isActive) {
        targets.forEach(target => {
            if (!target.isHit) {
                const dx = projectile.x - target.x;
                const dy = projectile.y - target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < projectile.radius + target.radius) {
                    target.isHit = true;
                    hitCount++;
                    
                    // Create hit effect particles
                    createHitEffect(target.x, target.y, target.color);
                    
                    // Check if all targets are hit
                    const targetsHitCount = targets.filter(t => t.isHit).length;
                    document.getElementById('targets-hit').textContent = `${targetsHitCount}/3`;
                    
                    if (targetsHitCount === targets.length) {
                        isGameWon = true;
                        
                        // Display win message with animation
                        const winMessage = document.createElement('div');
                        winMessage.textContent = 'All Targets Hit! Great job!';
                        winMessage.className = 'win-message';
                        
                        // Add animation styles
                        winMessage.style.animation = 'winPulse 0.5s ease-in-out infinite alternate';
                        document.body.appendChild(winMessage);
                        
                        // Remove message after 3 seconds
                        setTimeout(() => {
                            document.body.removeChild(winMessage);
                        }, 3000);
                    }
                }
            }
        });
    }
}

// Create hit effect particles when a target is hit
function createHitEffect(x, y, targetColor) {
    // Create explosion particles
    for (let i = 0; i < 40; i++) {
        const angle = random(0, TWO_PI);
        const speed = random(1, 8);
        const size = random(3, 10);
        
        bounceParticles.push({
            x: x,
            y: y - 20, // Adjust for target position
            size: size,
            alpha: 255,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            life: 255,
            color: targetColor
        });
    }
    
    // Add screen shake effect
    canvas.style('transform', 'translate(5px, 5px)');
    setTimeout(() => {
        canvas.style('transform', 'translate(-5px, -5px)');
        setTimeout(() => {
            canvas.style('transform', 'translate(0, 0)');
        }, 50);
    }, 50);
}

function updateUIValues() {
    // Calculate current values
    const compression = spring.baseLength - spring.currentLength;
    const force = PHYSICS.SPRING.K * compression * 7; // Changed multiplier from 5 to 7
    
    // Update position display
    document.getElementById('position-value').textContent = 
        `X: ${projectile.x.toFixed(1)}m, Y: ${(487 - projectile.y).toFixed(1)}m`;
    
    // Update velocity display
    const velocity = Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy);
    document.getElementById('velocity-value').textContent = `${velocity.toFixed(2)} m/s`;
    
    // Update force display
    document.getElementById('force-value').textContent = `${force.toFixed(2)} N`;
}

function draw() {
    // Clear the canvas with dark background
    background(30); // Dark background instead of 240
    
    // Calculate camera offset to follow projectile when launched
    let offsetX = 0;
    let offsetY = 0;
    
    if (isLaunched && projectile.isActive) {
        // Center the view on the projectile, but only when it moves beyond a certain threshold
        if (projectile.x > width * 0.6) {
            offsetX = width * 0.6 - projectile.x;
        }
        if (projectile.y < height * 0.3) {
            offsetY = height * 0.3 - projectile.y;
        }
    }
    
    // Apply camera transformation
    push();
    translate(offsetX, offsetY);
    
    // Draw coordinate grid
    drawGrid();
    
    // Draw floor
    fill(100);
    rect(0, PHYSICS.FLOOR_Y, width, height - PHYSICS.FLOOR_Y);
    
    // Draw trajectory trail
    drawTrajectory();
    
    // Draw targets
    drawTargets();
    
    // Draw spring and launcher
    drawSpring();
    
    // Draw projectile
    if (projectile) {
        // Calculate rotation based on velocity or spring angle if not launched
        let rotation = 0;
        
        if (isLaunched) {
            // When launched, rotate based on velocity direction
            rotation = atan2(projectile.vy, projectile.vx);
        } else {
            // When not launched, align with spring angle
            // For the spring to go through the middle of the two flaps
            rotation = spring.angle * (Math.PI / 180) - PI/2;
        }
        
        // Draw the SVG projectile
        drawProjectile(projectile.x, projectile.y, projectile.radius, rotation);
    }
    
    // Draw tension and angle indicators on top of everything else
    if (!isLaunched) {
        drawTensionAndAngleIndicators();
    }
    
    pop(); // Restore transformation
    
    // Draw UI elements that should stay fixed on screen
    if (isGameWon) {
        textSize(40);
        textAlign(CENTER, CENTER);
        fill(0, 128, 0);
        text("You Win!", width/2, height/2);
    }
    
    // Draw MISS! message if needed
    if (missInfo.show) {
        drawMissMessage();
    }
    
    // Update projectile physics
    updateProjectile();
}

function drawGrid() {
    // Draw the floor
    stroke(100);
    strokeWeight(2);
    line(0, PHYSICS.FLOOR_Y, width, PHYSICS.FLOOR_Y);
    
    // Draw x-axis with distance markings
    stroke(70);
    strokeWeight(1);
    line(0, PHYSICS.FLOOR_Y + 30, width, PHYSICS.FLOOR_Y + 30);
    
    // Add x-axis distance markers (every 100m)
    for (let x = PHYSICS.LAUNCH.X; x <= PHYSICS.LAUNCH.X + 600; x += 100) {
        const distance = x - PHYSICS.LAUNCH.X;
        
        // Draw vertical tick mark
        stroke(200);
        strokeWeight(1);
        line(x, PHYSICS.FLOOR_Y + 25, x, PHYSICS.FLOOR_Y + 35);
        
        // Draw distance label
        fill(255);
        noStroke();
        textAlign(CENTER);
        textSize(12);
        text(`${distance}m`, x, PHYSICS.FLOOR_Y + 50);
    }
    
    // Draw grid
    stroke(50);
    strokeWeight(0.5);
    
    // Draw vertical grid lines
    for (let x = 0; x <= width; x += 50) {
        line(x, 0, x, PHYSICS.FLOOR_Y);
    }
    
    // Calculate pixel height that represents 50m
    const pixelsPerMeter = PHYSICS.FLOOR_Y / 400; // Assuming 400m is the max height
    const pixelsFor50m = pixelsPerMeter * 50;
    
    // Draw horizontal grid lines and y-axis labels in 50m increments
    for (let height = 0; height <= 400; height += 50) {
        const y = PHYSICS.FLOOR_Y - (height * pixelsPerMeter);
        
        // Only draw if within canvas bounds
        if (y >= 0 && y <= PHYSICS.FLOOR_Y) {
            // Major horizontal grid lines (every 50m)
            stroke(70);
            strokeWeight(0.8);
            line(0, y, width, y);
            
            // Add y-axis labels (height from ground in meters)
            // Only draw if there's enough space from the top of the canvas
            if (y >= 12) { // Ensure there's at least 12px from the top
                noStroke();
                fill(180);
                textAlign(RIGHT);
                textSize(10);
                
                // Create a small background rectangle to ensure label visibility
                fill(30, 30, 30, 200); // Semi-transparent dark background
                rect(0, y - 6, 40, 12, 0, 3, 3, 0);
                
                // Draw the text
                fill(180);
                text(`${height}m`, 35, y + 4);
            }
            
            // Add minor horizontal grid lines (every 10m)
            if (height < 400) {
                for (let minorHeight = height + 10; minorHeight < height + 50 && minorHeight <= 400; minorHeight += 10) {
                    const minorY = PHYSICS.FLOOR_Y - (minorHeight * pixelsPerMeter);
                    if (minorY >= 0) {
                        stroke(40);
                        strokeWeight(0.3);
                        line(0, minorY, width, minorY);
                    }
                }
            }
        }
    }
}

function drawTargets() {
    // Draw each target
    targets.forEach(target => {
        // Base position for the target
        const x = target.x;
        const y = target.y - target.radius;
        const r = target.radius;
        
        if (target.isHit) {
            // Draw as a hit target - grayscale bullseye with animation
            push();
            
            // Add subtle pulsing animation for hit targets
            const pulseScale = 1 + sin(frameCount * 0.1) * 0.05;
            translate(x, y);
            scale(pulseScale);
            
            // Outer ring
            noStroke();
            fill(100);
            circle(0, 0, r * 2);
            
            // Middle ring
            fill(150);
            circle(0, 0, r * 1.4);
            
            // Inner ring
            fill(200);
            circle(0, 0, r * 0.8);
            
            // Bullseye center
            fill(240);
            circle(0, 0, r * 0.3);
            
            // Add "HIT!" text - bigger and bolder
            fill(255, 50, 50);
            textAlign(CENTER);
            textSize(18); // Increased from 12
            textStyle(BOLD); // Added bold style
            stroke(0); // Add outline
            strokeWeight(1.5);
            text("HIT!", 0, 0);
            
            pop();
        } else {
            // Draw as a normal target - colored bullseye with subtle animation
            push();
            
            // Add subtle floating animation
            const floatOffset = sin(frameCount * 0.05 + target.x * 0.01) * 3;
            translate(x, y + floatOffset);
            
            // Outer ring - use target's base color
            noStroke();
            fill(target.color);
            circle(0, 0, r * 2);
            
            // Middle ring - lighter version of the color
            const middleColor = lerpColor(target.color, color(255), 0.3);
            fill(middleColor);
            circle(0, 0, r * 1.4);
            
            // Inner ring - even lighter
            const innerColor = lerpColor(target.color, color(255), 0.6);
            fill(innerColor);
            circle(0, 0, r * 0.8);
            
            // Bullseye center - white with slight color tint
            const centerColor = lerpColor(target.color, color(255), 0.9);
            fill(centerColor);
            circle(0, 0, r * 0.3);
            
            // Add thin rings for definition
            noFill();
            stroke(0, 80);
            strokeWeight(1);
            circle(0, 0, r * 2);
            circle(0, 0, r * 1.4);
            circle(0, 0, r * 0.8);
            circle(0, 0, r * 0.3);
            
            pop();
        }
        
        // Draw vertical line connecting target to x-axis
        stroke(200);
        strokeWeight(1);
        line(target.x, target.y, target.x, PHYSICS.FLOOR_Y + 30);
        
        // Draw distance text for targets
        const distance = target.x - PHYSICS.LAUNCH.X;
        fill(255);
        noStroke();
        textAlign(CENTER);
        textSize(14);
        text(`${distance}m`, target.x, PHYSICS.FLOOR_Y + 45);
    });
}

function drawSpring() {
    // Draw launcher base with 3D effect
    fill(120);
    stroke(80);
    strokeWeight(2);
    rect(PHYSICS.LAUNCH.X - 40, PHYSICS.FLOOR_Y - 20, 80, 20);
    
    // Add 3D effect to base
    fill(150);
    noStroke();
    rect(PHYSICS.LAUNCH.X - 38, PHYSICS.FLOOR_Y - 18, 76, 16);
    
    // Convert angle to radians for drawing
    const angleInRadians = spring.angle * (Math.PI / 180);
    
    if (!isLaunched) {
        // Draw compressed spring with 3D effect and gradient
        const pulseAmount = sin(frameCount * 0.1) * 0.2 + 0.8; // Value between 0.6 and 1.0
        
        // Calculate spring end point for projectile position
        const springEndX = projectile.x;
        const springEndY = projectile.y;
        
        // Calculate the spring's direction vector
        const dx = springEndX - PHYSICS.LAUNCH.X;
        const dy = springEndY - PHYSICS.LAUNCH.Y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the direction
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Calculate perpendicular vector
        const perpX = -dirY;
        const perpY = dirX;
        
        // Draw a more exaggerated zigzag line for the spring
        const coils = 8; // Number of coils
        const tensionRatio = spring.tension / 100; // Normalize tension to 0-1
        const amplitude = 15 + tensionRatio * 10; // Dynamic amplitude based on tension
        
        // 3D spring effect - draw multiple layers
        
        // 1. Draw shadow/background layer (darker)
        noFill();
        stroke(80);
        strokeWeight(5 + tensionRatio * 2);
        beginShape();
        vertex(PHYSICS.LAUNCH.X + 2, PHYSICS.LAUNCH.Y + 2); // Offset for shadow effect
        
        for (let i = 1; i <= coils; i++) {
            const t = i / (coils + 1);
            const x = PHYSICS.LAUNCH.X + t * dx + 2; // Offset for shadow
            const y = PHYSICS.LAUNCH.Y + t * dy + 2; // Offset for shadow
            const offset = amplitude * sin(i * PI) * pulseAmount;
            vertex(x + perpX * offset, y + perpY * offset);
        }
        
        vertex(springEndX + 2, springEndY + 2); // Offset for shadow
        endShape();
        
        // 2. Draw main spring with gradient effect
        for (let layer = 0; layer < 3; layer++) {
            // Create gradient from darker to lighter
            const gradientValue = 160 + layer * 30; // 160, 190, 220
            const springColor = color(gradientValue);
            
            // Adjust thickness for each layer
            const layerWeight = 4 - layer * 1.2;
            
            stroke(springColor);
            strokeWeight(layerWeight + tensionRatio * 1.5);
            
            beginShape();
            vertex(PHYSICS.LAUNCH.X, PHYSICS.LAUNCH.Y);
            
            for (let i = 1; i <= coils; i++) {
                const t = i / (coils + 1);
                const x = PHYSICS.LAUNCH.X + t * dx;
                const y = PHYSICS.LAUNCH.Y + t * dy;
                
                // Vary the offset slightly for each layer to create 3D effect
                const layerOffset = amplitude * sin(i * PI) * pulseAmount;
                vertex(x + perpX * layerOffset, y + perpY * layerOffset);
            }
            
            vertex(springEndX, springEndY);
            endShape();
        }
        
        // 3. Draw highlight layer (lightest)
        stroke(240);
        strokeWeight(1);
        beginShape();
        vertex(PHYSICS.LAUNCH.X - 1, PHYSICS.LAUNCH.Y - 1); // Slight offset for highlight
        
        for (let i = 1; i <= coils; i++) {
            const t = i / (coils + 1);
            const x = PHYSICS.LAUNCH.X + t * dx - 1; // Slight offset for highlight
            const y = PHYSICS.LAUNCH.Y + t * dy - 1; // Slight offset for highlight
            const offset = amplitude * sin(i * PI) * pulseAmount * 0.9; // Slightly smaller for highlight
            vertex(x + perpX * offset, y + perpY * offset);
        }
        
        vertex(springEndX - 1, springEndY - 1); // Slight offset for highlight
        endShape();
        
    } else {
        // Draw released spring with 3D effect
        
        // Calculate spring end point for the extended spring
        const springEndX = PHYSICS.LAUNCH.X + spring.baseLength * Math.cos(angleInRadians);
        const springEndY = PHYSICS.LAUNCH.Y - spring.baseLength * Math.sin(angleInRadians);
        
        // Calculate the spring's direction vector
        const dx = springEndX - PHYSICS.LAUNCH.X;
        const dy = springEndY - PHYSICS.LAUNCH.Y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the direction
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Calculate perpendicular vector
        const perpX = -dirY;
        const perpY = dirX;
        
        // Draw a zigzag line for the spring
        const coils = 8;
        const amplitude = 8;
        
        // 1. Draw shadow layer
        noFill();
        stroke(80);
        strokeWeight(4);
        beginShape();
        vertex(PHYSICS.LAUNCH.X + 2, PHYSICS.LAUNCH.Y + 2); // Offset for shadow
        
        for (let i = 1; i <= coils; i++) {
            const t = i / (coils + 1);
            const x = PHYSICS.LAUNCH.X + t * dx + 2; // Offset for shadow
            const y = PHYSICS.LAUNCH.Y + t * dy + 2; // Offset for shadow
            const offset = amplitude * ((i % 2) * 2 - 1);
            vertex(x + perpX * offset, y + perpY * offset);
        }
        
        vertex(springEndX + 2, springEndY + 2); // Offset for shadow
        endShape();
        
        // 2. Draw main spring with gradient effect
        for (let layer = 0; layer < 3; layer++) {
            // Create gradient from darker to lighter
            const gradientValue = 160 + layer * 30; // 160, 190, 220
            const springColor = color(gradientValue);
            
            // Adjust thickness for each layer
            const layerWeight = 3 - layer * 0.8;
            
            stroke(springColor);
            strokeWeight(layerWeight);
            
            beginShape();
            vertex(PHYSICS.LAUNCH.X, PHYSICS.LAUNCH.Y);
            
            for (let i = 1; i <= coils; i++) {
                const t = i / (coils + 1);
                const x = PHYSICS.LAUNCH.X + t * dx;
                const y = PHYSICS.LAUNCH.Y + t * dy;
                const offset = amplitude * ((i % 2) * 2 - 1);
                vertex(x + perpX * offset, y + perpY * offset);
            }
            
            vertex(springEndX, springEndY);
            endShape();
        }
        
        // 3. Draw highlight layer
        stroke(240);
        strokeWeight(1);
        beginShape();
        vertex(PHYSICS.LAUNCH.X - 1, PHYSICS.LAUNCH.Y - 1); // Offset for highlight
        
        for (let i = 1; i <= coils; i++) {
            const t = i / (coils + 1);
            const x = PHYSICS.LAUNCH.X + t * dx - 1; // Offset for highlight
            const y = PHYSICS.LAUNCH.Y + t * dy - 1; // Offset for highlight
            const offset = amplitude * ((i % 2) * 2 - 1) * 0.9; // Slightly smaller for highlight
            vertex(x + perpX * offset, y + perpY * offset);
        }
        
        vertex(springEndX - 1, springEndY - 1); // Offset for highlight
        endShape();
    }
}

function drawTensionAndAngleIndicators() {
    // Convert angle to radians for drawing
    const angleInRadians = spring.angle * (Math.PI / 180);
    
    // Draw tension indicator
    const tensionTextX = PHYSICS.LAUNCH.X + 70 * Math.cos(angleInRadians);
    const tensionTextY = PHYSICS.LAUNCH.Y - 70 * Math.sin(angleInRadians);
    
    // Draw tension line
    stroke(255, 100, 100, 150);
    strokeWeight(2);
    line(PHYSICS.LAUNCH.X, PHYSICS.LAUNCH.Y, tensionTextX, tensionTextY);
    
    // Draw tension value with background
    noStroke();
    // Background for text
    fill(0, 0, 0, 180);
    rectMode(CENTER);
    rect(tensionTextX, tensionTextY - 10, 45, 20, 5);
    
    // Text
    fill(255, 100, 100);
    textAlign(CENTER);
    textSize(12);
    text(`${spring.tension}N`, tensionTextX, tensionTextY - 6);
    
    // Draw angle indicator
    const angleArcRadius = 40;
    // Position the angle text further away from the spring
    const angleTextX = PHYSICS.LAUNCH.X + angleArcRadius * 1.8 * Math.cos(angleInRadians / 2);
    const angleTextY = PHYSICS.LAUNCH.Y - angleArcRadius * 1.8 * Math.sin(angleInRadians / 2);
    
    // Draw angle arc
    noFill();
    stroke(100, 200, 255, 150);
    strokeWeight(2);
    arc(PHYSICS.LAUNCH.X, PHYSICS.LAUNCH.Y, angleArcRadius * 2, angleArcRadius * 2, -HALF_PI, -HALF_PI + angleInRadians);
    
    // Draw angle value with background
    noStroke();
    // Background for text
    fill(0, 0, 0, 180);
    rectMode(CENTER);
    rect(angleTextX, angleTextY, 45, 20, 5);
    
    // Text
    fill(100, 200, 255);
    textAlign(CENTER);
    textSize(12);
    text(`${spring.angle}°`, angleTextX, angleTextY + 4);
}

function drawProjectile(x, y, radius, rotation) {
    push();
    translate(x, y);
    
    // Determine rotation based on game state
    if (isLaunched) {
        // When launched, rotate based on velocity direction
        rotation = atan2(projectile.vy, projectile.vx);
    } else {
        // When not launched, align with spring angle
        // For the spring to go through the middle of the two flaps
        // and keep the rocket right-side up
        rotation = spring.angle * (Math.PI / 180) - PI/2;
    }
    
    rotate(rotation);
    
    // Draw the SVG projectile
    noStroke();
    
    // Rocket body
    // Main body
    fill(220, 50, 50); // Red rocket body
    noStroke();
    ellipse(0, 0, radius * 2.5, radius * 2);
    
    // Nose cone - pointing right
    fill(240, 80, 80);
    beginShape();
    vertex(radius * 1.25, 0);
    vertex(radius * 0.5, -radius * 0.7);
    vertex(radius * 0.5, radius * 0.7);
    endShape(CLOSE);
    
    // Rocket window
    fill(200, 230, 255);
    stroke(30, 100, 200);
    strokeWeight(1);
    ellipse(-radius * 0.3, 0, radius * 0.8, radius * 0.8);
    
    // Window highlights
    noStroke();
    fill(255, 255, 255, 150);
    ellipse(-radius * 0.4, -radius * 0.1, radius * 0.3, radius * 0.3);
    
    // Fins - now pointing left (opposite to nose cone)
    fill(50, 50, 180); // Blue fins
    noStroke();
    
    // Top fin
    beginShape();
    vertex(-radius * 0.8, -radius * 0.5);
    vertex(-radius * 1.5, -radius * 1.2);
    vertex(-radius * 0.5, -radius * 0.5);
    endShape(CLOSE);
    
    // Bottom fin
    beginShape();
    vertex(-radius * 0.8, radius * 0.5);
    vertex(-radius * 1.5, radius * 1.2);
    vertex(-radius * 0.5, radius * 0.5);
    endShape(CLOSE);
    
    // Rocket exhaust/flame effect - only when moving
    if (isLaunched && (Math.abs(projectile.vx) > 0.5 || Math.abs(projectile.vy) > 0.5)) {
        // Outer flame
        fill(255, 150, 50, 150);
        beginShape();
        vertex(-radius * 1.2, 0);
        vertex(-radius * 2.5, -radius * 0.7);
        vertex(-radius * 3.0, 0);
        vertex(-radius * 2.5, radius * 0.7);
        endShape(CLOSE);
        
        // Inner flame
        fill(255, 255, 100, 200);
        beginShape();
        vertex(-radius * 1.2, 0);
        vertex(-radius * 2.0, -radius * 0.4);
        vertex(-radius * 2.5, 0);
        vertex(-radius * 2.0, radius * 0.4);
        endShape(CLOSE);
        
        // Center flame
        fill(255, 255, 255, 230);
        beginShape();
        vertex(-radius * 1.2, 0);
        vertex(-radius * 1.8, -radius * 0.2);
        vertex(-radius * 2.0, 0);
        vertex(-radius * 1.8, radius * 0.2);
        endShape(CLOSE);
    }
    
    // Decorative details
    // Rocket body stripe
    fill(255, 255, 255);
    rect(-radius * 0.8, -radius * 0.1, radius * 1.6, radius * 0.2);
    
    // Small decorative dots/rivets
    fill(50);
    for (let i = 0; i < 4; i++) {
        const angle = i * PI / 2;
        circle(radius * 0.7 * cos(angle), radius * 0.7 * sin(angle), radius * 0.1);
    }
    
    pop();
}

function drawTrajectory() {
    // Draw the trajectory path with gradient effect
    if (trailPoints.length > 1) {
        // Draw main trajectory line
        stroke(255, 50, 50, 200);
        strokeWeight(3);
        noFill();
        beginShape();
        trailPoints.forEach(point => {
            vertex(point.x, point.y);
        });
        endShape();
        
        // Draw glow effect
        stroke(255, 100, 100, 50);
        strokeWeight(6);
        beginShape();
        trailPoints.forEach(point => {
            vertex(point.x, point.y);
        });
        endShape();
    }
    
    // Draw trail particles
    noStroke();
    trailParticles.forEach(p => {
        fill(255, 100, 100, p.alpha);
        circle(p.x, p.y, p.size);
    });
    
    // Draw bounce particles
    bounceParticles.forEach(p => {
        fill(255, 200, 100, p.life);
        circle(p.x, p.y, p.size);
    });
}

// Updated function to draw the MISS! message
function drawMissMessage() {
    push();
    translate(missInfo.x, missInfo.y);
    scale(missInfo.scale);
    
    textAlign(CENTER, CENTER);
    textSize(24);
    textStyle(BOLD);
    
    // Draw text with outline for better visibility
    fill(255, 50, 50, missInfo.alpha);
    stroke(0, missInfo.alpha);
    strokeWeight(3);
    text("MISS!", 0, 0);
    
    pop();
}

// Initialize the p5.js environment
new p5();