// Spring Launch Physics Game - Core Logic
let canvas;
let projectile;
let spring;
let targets = [];
let isLaunched = false;
let isGameWon = false;
let trailPoints = [];
let launchCount = 0;
let hitCount = 0;

// Physics constants
const SPRING_CONSTANT = 0.03; // Reduced from 0.05 to significantly lower the spring force
const GRAVITY = 0.2;
const MASS = 1;
const DAMPING = 0.99; // Air resistance factor
const FLOOR_Y = 550; // Increased from 450 to move grid down
const LAUNCH_X = 100;
const LAUNCH_Y = FLOOR_Y;
const DEFAULT_ANGLE = 45; // Default angle in degrees
const DEFAULT_TENSION = 15; // Default tension value

// Game setup
function setup() {
    // Create canvas inside the game-canvas div
    canvas = createCanvas(1000, 650); // Increased width to properly accommodate 800m
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
    
    // Add efficiency ratio display
    const efficiencyDisplay = document.createElement('div');
    efficiencyDisplay.id = 'efficiency-display';
    efficiencyDisplay.style.position = 'absolute';
    efficiencyDisplay.style.top = '20px';
    efficiencyDisplay.style.right = '20px';
    efficiencyDisplay.style.fontSize = '18px';
    efficiencyDisplay.style.color = 'white';
    efficiencyDisplay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    efficiencyDisplay.style.padding = '5px 10px';
    efficiencyDisplay.style.borderRadius = '5px';
    efficiencyDisplay.textContent = 'Efficiency: 0%';
    document.body.appendChild(efficiencyDisplay);
}

function resetGame(resetScore = true) {
    // Reset game state
    isLaunched = false;
    isGameWon = false;
    trailPoints = [];
    
    if (resetScore) {
        launchCount = 0;
        hitCount = 0;
        updateEfficiencyDisplay();
    }
    
    // Create spring and projectile
    spring = {
        x: LAUNCH_X,
        y: LAUNCH_Y,
        tension: DEFAULT_TENSION,
        angle: DEFAULT_ANGLE, // Store angle in degrees for easier manipulation
        baseLength: 100,
        currentLength: 100 - DEFAULT_TENSION // Start with spring compressed
    };
    
    // Calculate projectile position based on spring
    const angleInRadians = (90 - spring.angle) * (Math.PI / 180);
    const springEndX = LAUNCH_X + spring.currentLength * Math.cos(angleInRadians);
    const springEndY = LAUNCH_Y - spring.currentLength * Math.sin(angleInRadians);
    
    projectile = {
        x: springEndX,
        y: springEndY,
        vx: 0,
        vy: 0,
        radius: 15,
        isActive: true
    };
    
    // Reset targets if resetting score
    if (resetScore) {
        targets = [
            { x: 300, y: FLOOR_Y, radius: 20, isHit: false, color: color(255, 0, 0) },
            { x: 500, y: FLOOR_Y, radius: 20, isHit: false, color: color(0, 255, 0) },
            { x: 700, y: FLOOR_Y, radius: 20, isHit: false, color: color(0, 0, 255) }
        ];
    }
    
    // Reset UI controls
    document.getElementById('spring-tension').value = DEFAULT_TENSION;
    document.getElementById('launch-angle').value = DEFAULT_ANGLE;
    
    // Update UI displays
    document.getElementById('tension-value').textContent = DEFAULT_TENSION;
    document.getElementById('angle-value').textContent = DEFAULT_ANGLE + '°';
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
        spring.angle = parseInt(this.value);
        document.getElementById('angle-value').textContent = spring.angle + '°';
        
        // Update projectile position
        updateProjectilePosition();
        
        updateUIValues();
    }
}

function updateProjectilePosition() {
    // Convert angle to radians for calculation
    const angleInRadians = (90 - spring.angle) * (Math.PI / 180);
    
    // Calculate end point of spring
    projectile.x = LAUNCH_X + spring.currentLength * Math.cos(angleInRadians);
    projectile.y = LAUNCH_Y - spring.currentLength * Math.sin(angleInRadians);
}

function launchProjectile() {
    if (!isLaunched && !isGameWon) {
        isLaunched = true;
        launchCount++;
        updateEfficiencyDisplay();
        
        // Apply Hooke's Law: F = -kx
        const compression = spring.baseLength - spring.currentLength;
        const force = SPRING_CONSTANT * compression * 7; // Changed multiplier from 5 to 7
        
        // Convert angle to radians for calculation
        const angleInRadians = (90 - spring.angle) * (Math.PI / 180);
        
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
        projectile.vy += GRAVITY;
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        
        // Apply minimal air resistance
        projectile.vx *= DAMPING;
        projectile.vy *= DAMPING;
        
        // Add point to trajectory trail
        if (frameCount % 3 === 0) { // Only add a point every few frames
            trailPoints.push({ x: projectile.x, y: projectile.y });
        }
        
        // Check for floor collision
        if (projectile.y > FLOOR_Y - projectile.radius) {
            projectile.y = FLOOR_Y - projectile.radius;
            projectile.vy *= -0.6; // Bounce with energy loss
            
            // End simulation on floor collision
            projectile.isActive = false;
            
            // Reset after 1 second, preserving score
            setTimeout(() => {
                resetGame(false);
            }, 1000);
        }
        
        // Check for wall collisions (optional)
        if (projectile.x < projectile.radius || projectile.x > width - projectile.radius) {
            projectile.vx *= -0.6; // Bounce off walls
            projectile.x = constrain(projectile.x, projectile.radius, width - projectile.radius);
            
            // End simulation on wall collision
            projectile.isActive = false;
            
            // Reset after 1 second, preserving score
            setTimeout(() => {
                resetGame(false);
            }, 1000);
        }
        
        // Check for target collisions
        checkTargetCollisions();
        
        // Update UI with current values
        updateUIValues();
    }
}

function checkTargetCollisions() {
    // Skip collision detection if projectile is not active
    if (!projectile.isActive) return;
    
    let targetsHitCount = 0;
    
    // First count how many targets are already hit
    targets.forEach(t => { 
        if (t.isHit) targetsHitCount++; 
    });
    
    // Then check for new collisions
    targets.forEach((target, index) => {
        if (!target.isHit) {
            const distance = dist(projectile.x, projectile.y, target.x, target.y);
            if (distance < projectile.radius + target.radius) {
                target.isHit = true;
                targetsHitCount++;
                hitCount++;
                updateEfficiencyDisplay();
                
                // Update target hit counter
                document.getElementById('targets-hit').textContent = `${targetsHitCount}/3`;
                
                // End simulation on target collision
                projectile.isActive = false;
                
                // Check win condition
                if (targetsHitCount === 3) {
                    isGameWon = true;
                }
                
                // Reset after 1 second, preserving score
                setTimeout(() => {
                    resetGame(false);
                }, 1000);
            }
        }
    });
}

function updateUIValues() {
    // Calculate current values
    const compression = spring.baseLength - spring.currentLength;
    const force = SPRING_CONSTANT * compression * 7; // Changed multiplier from 5 to 7
    
    // Update position display
    document.getElementById('position-value').textContent = 
        `X: ${projectile.x.toFixed(1)}m, Y: ${(650 - projectile.y).toFixed(1)}m`;
    
    // Update velocity display
    const velocity = Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy);
    document.getElementById('velocity-value').textContent = `${velocity.toFixed(2)} m/s`;
    
    // Update force display
    document.getElementById('force-value').textContent = `${force.toFixed(2)} N`;
}

function updateEfficiencyDisplay() {
    const efficiency = launchCount > 0 ? Math.round((hitCount / launchCount) * 100) : 0;
    const efficiencyDisplay = document.getElementById('efficiency-display');
    if (efficiencyDisplay) {
        efficiencyDisplay.textContent = `Efficiency: ${efficiency}% (${hitCount}/${launchCount})`;
        
        // Change color based on efficiency
        if (efficiency >= 75) {
            efficiencyDisplay.style.color = '#00ff00'; // Green for high efficiency
        } else if (efficiency >= 50) {
            efficiencyDisplay.style.color = '#ffff00'; // Yellow for medium efficiency
        } else {
            efficiencyDisplay.style.color = '#ff9900'; // Orange for low efficiency
        }
    }
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
    rect(0, FLOOR_Y, width, height - FLOOR_Y);
    
    // Draw trajectory trail
    drawTrajectory();
    
    // Draw targets
    drawTargets();
    
    // Draw spring and launcher
    drawSpring();
    
    // Draw projectile
    drawProjectile();
    
    pop(); // Restore transformation
    
    // Draw UI elements that should stay fixed on screen
    if (isGameWon) {
        textSize(40);
        textAlign(CENTER, CENTER);
        fill(0, 128, 0);
        text("You Win!", width/2, height/2);
    }
    
    // Update projectile physics
    updateProjectile();
}

function drawGrid() {
    // Draw the floor
    stroke(100);
    strokeWeight(2);
    line(0, FLOOR_Y, width, FLOOR_Y);
    
    // Draw x-axis with distance markings
    stroke(70);
    strokeWeight(1);
    line(0, FLOOR_Y + 30, width, FLOOR_Y + 30);
    
    // Add x-axis distance markers (every 100m)
    for (let x = LAUNCH_X; x <= LAUNCH_X + 800; x += 100) {
        const distance = x - LAUNCH_X;
        
        // Draw vertical tick mark
        stroke(200);
        strokeWeight(1);
        line(x, FLOOR_Y + 25, x, FLOOR_Y + 35);
        
        // Draw distance label
        fill(255);
        noStroke();
        textAlign(CENTER);
        textSize(12);
        text(`${distance}m`, x, FLOOR_Y + 50);
    }
    
    // Draw grid
    stroke(50);
    strokeWeight(0.5);
    
    // Draw vertical grid lines
    for (let x = 0; x <= width; x += 50) {
        line(x, 0, x, FLOOR_Y);
    }
    
    // Draw horizontal grid lines and y-axis labels
    for (let y = 0; y <= FLOOR_Y; y += 50) {
        // Major horizontal grid lines (every 50 pixels)
        stroke(70);
        strokeWeight(0.8);
        line(0, y, width, y);
        
        // Add y-axis labels (height from ground)
        if (y < FLOOR_Y) {
            noStroke();
            fill(180);
            textAlign(RIGHT);
            textSize(10);
            let heightValue = FLOOR_Y - y;
            text(`${heightValue}m`, 35, y + 4); // Increased x-position from 25 to 35 for more left padding
            
            // Add minor horizontal grid lines (every 10 pixels)
            if (y < FLOOR_Y - 10) {
                for (let minorY = y + 10; minorY < y + 50 && minorY < FLOOR_Y; minorY += 10) {
                    stroke(40);
                    strokeWeight(0.3);
                    line(0, minorY, width, minorY);
                }
            }
        }
    }
    
    // Add y-axis title
    push();
    translate(15, FLOOR_Y / 2);
    rotate(-PI/2);
    fill(200);
    textAlign(CENTER);
    textSize(12);
    text("", 0, 0);
    pop();
}

function drawTargets() {
    // Draw each target
    targets.forEach(target => {
        if (target.isHit) {
            // Draw as a hit target
            stroke(50);
            strokeWeight(1);
            fill(150);
        } else {
            // Draw as a normal target
            stroke(0);
            strokeWeight(1);
            fill(target.color);
        }
        
        // Draw target
        circle(target.x, target.y - target.radius, target.radius * 2);
        
        // Draw crosshair inside target
        if (!target.isHit) {
            stroke(255);
            line(target.x - target.radius/2, target.y - target.radius, 
                 target.x + target.radius/2, target.y - target.radius);
            line(target.x, target.y - target.radius - target.radius/2, 
                 target.x, target.y - target.radius + target.radius/2);
        }
        
        // Draw vertical line connecting target to x-axis
        stroke(200);
        strokeWeight(1);
        line(target.x, target.y, target.x, FLOOR_Y + 30);
        
        // Draw distance text for targets
        const distance = target.x - LAUNCH_X;
        fill(255);
        noStroke();
        textAlign(CENTER);
        textSize(14);
        text(`${distance}m`, target.x, FLOOR_Y + 45);
    });
    
    // Draw launch point marker on x-axis
    stroke(200);
    strokeWeight(1);
    line(LAUNCH_X, FLOOR_Y, LAUNCH_X, FLOOR_Y + 30);
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(14);
    text("0m", LAUNCH_X, FLOOR_Y + 45);
}

function drawSpring() {
    // Draw launcher base
    fill(150);
    stroke(100);
    strokeWeight(1);
    rect(LAUNCH_X - 40, FLOOR_Y - 20, 80, 20);
    
    // Convert angle to radians for drawing
    const angleInRadians = (90 - spring.angle) * (Math.PI / 180);
    
    if (!isLaunched) {
        // Draw compressed spring
        stroke(50);
        strokeWeight(3);
        
        // Calculate spring end point for projectile position
        const springEndX = projectile.x;
        const springEndY = projectile.y;
        
        // Calculate the spring's direction vector
        const dx = springEndX - LAUNCH_X;
        const dy = springEndY - LAUNCH_Y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the direction
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Calculate perpendicular vector
        const perpX = -dirY;
        const perpY = dirX;
        
        // Draw a more exaggerated zigzag line for the spring
        const coils = 6; // Number of coils
        const amplitude = 15; // Increased zigzag amplitude
        
        // Start the spring drawing with no fill
        noFill();
        beginShape();
        
        // Add the start point (launcher)
        vertex(LAUNCH_X, LAUNCH_Y);
        
        // Draw zigzag coils between start and end
        for (let i = 1; i <= coils; i++) {
            const t = i / (coils + 1); // Position along the spring (0 to 1)
            
            // Calculate the point along the spring's main axis
            const x = LAUNCH_X + t * dx;
            const y = LAUNCH_Y + t * dy;
            
            // Add perpendicular offset to create zigzag
            // Use sine for smooth transitions
            const offset = amplitude * ((i % 2) * 2 - 1); // Alternating positive/negative
            
            vertex(x + perpX * offset, y + perpY * offset);
        }
        
        // Add the end point (projectile)
        vertex(springEndX, springEndY);
        
        endShape();
        
        // Draw angle indicator line
        stroke(200, 0, 0);
        strokeWeight(1);
        line(LAUNCH_X, LAUNCH_Y, LAUNCH_X + 50 * Math.cos(angleInRadians), LAUNCH_Y - 50 * Math.sin(angleInRadians));
    } else {
        // Draw released spring
        stroke(50);
        strokeWeight(3);
        
        // Calculate spring end point for the extended spring
        const springEndX = LAUNCH_X + spring.baseLength * Math.cos(angleInRadians);
        const springEndY = LAUNCH_Y - spring.baseLength * Math.sin(angleInRadians);
        
        // Calculate the spring's direction vector
        const dx = springEndX - LAUNCH_X;
        const dy = springEndY - LAUNCH_Y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the direction
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Calculate perpendicular vector
        const perpX = -dirY;
        const perpY = dirX;
        
        // Draw a more subtle zigzag line for the extended spring
        const coils = 8; // More coils for extended spring
        const amplitude = 8; // Smaller amplitude for extended spring
        
        // Start the spring drawing with no fill
        noFill();
        beginShape();
        
        // Add the start point (launcher)
        vertex(LAUNCH_X, LAUNCH_Y);
        
        // Draw zigzag coils between start and end
        for (let i = 1; i <= coils; i++) {
            const t = i / (coils + 1); // Position along the spring (0 to 1)
            
            // Calculate the point along the spring's main axis
            const x = LAUNCH_X + t * dx;
            const y = LAUNCH_Y + t * dy;
            
            // Add perpendicular offset to create zigzag
            const offset = amplitude * ((i % 2) * 2 - 1); // Alternating positive/negative
            
            vertex(x + perpX * offset, y + perpY * offset);
        }
        
        // Add the end point
        vertex(springEndX, springEndY);
        
        endShape();
    }
}

function drawProjectile() {
    // Draw the projectile
    fill(30, 144, 255);
    stroke(0);
    strokeWeight(1);
    circle(projectile.x, projectile.y, projectile.radius * 2);
}

function drawTrajectory() {
    // Draw the trajectory path
    if (trailPoints.length > 1) {
        stroke(200, 0, 0, 150);
        strokeWeight(2);
        noFill();
        beginShape();
        trailPoints.forEach(point => {
            vertex(point.x, point.y);
        });
        endShape();
    }
}

// Initialize the p5.js environment
new p5();