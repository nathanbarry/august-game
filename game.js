// ==========================================
// VELOCITY - Parkour Game
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ==========================================
// GAME STATE
// ==========================================
const gameState = {
    currentLevel: 0,
    deaths: 0,
    levelDeaths: 0,
    startTime: 0,
    levelStartTime: 0,
    totalTime: 0,
    isPlaying: false,
    isPaused: false
};

// ==========================================
// PLAYER CUSTOMIZATION
// ==========================================
const playerCustomization = {
    color: '#00f5ff',
    trailColor: 'rgba(0, 245, 255, 0.3)'
};

// ==========================================
// COLORS & THEMES
// ==========================================
const themes = {
    neon: {
        name: 'neon',
        primary: '#00f5ff',
        secondary: '#ff00aa',
        accent: '#ffff00',
        danger: '#ff3344',
        success: '#00ff88',
        platform: '#1a1a2e',
        platformBorder: '#00f5ff',
        player: '#00f5ff',
        playerTrail: 'rgba(0, 245, 255, 0.3)',
        goal: '#00ff88',
        hazard: '#ff3344',
        bgTop: '#0a0a18',
        bgMid: '#141428',
        bgBottom: '#1a1a35',
        gridColor: 'rgba(0, 245, 255, 0.05)'
    },
    castle: {
        name: 'castle',
        primary: '#d4a84b',
        secondary: '#8b4513',
        accent: '#ff6b35',
        danger: '#8b0000',
        success: '#ffd700',
        platform: '#2d2d2d',
        platformBorder: '#6b6b6b',
        player: '#d4a84b',
        playerTrail: 'rgba(212, 168, 75, 0.3)',
        goal: '#ffd700',
        hazard: '#8b0000',
        bgTop: '#1a1a2e',
        bgMid: '#2d1f3d',
        bgBottom: '#3d2a4d',
        gridColor: 'rgba(139, 69, 19, 0.08)',
        decorations: 'castle'
    },
    mansion: {
        name: 'mansion',
        primary: '#c9a959',
        secondary: '#722f37',
        accent: '#daa520',
        danger: '#8b0000',
        success: '#c9a959',
        platform: '#2a1a1a',
        platformBorder: '#722f37',
        player: '#c9a959',
        playerTrail: 'rgba(201, 169, 89, 0.3)',
        goal: '#daa520',
        hazard: '#8b0000',
        bgTop: '#1a0a0a',
        bgMid: '#2a1515',
        bgBottom: '#3a2020',
        gridColor: 'rgba(114, 47, 55, 0.06)',
        decorations: 'mansion'
    },
    tropical: {
        name: 'tropical',
        primary: '#00d4aa',
        secondary: '#ff6b9d',
        accent: '#ffdd44',
        danger: '#ff4757',
        success: '#2ed573',
        platform: '#2d5a27',
        platformBorder: '#5a9b4f',
        player: '#00d4aa',
        playerTrail: 'rgba(0, 212, 170, 0.3)',
        goal: '#ffdd44',
        hazard: '#ff4757',
        bgTop: '#1a3a5c',
        bgMid: '#2a5a7c',
        bgBottom: '#4a8ab0',
        gridColor: 'rgba(0, 212, 170, 0.05)',
        decorations: 'tropical'
    }
};

let currentTheme = themes.neon;

// ==========================================
// PLAYER
// ==========================================
const player = {
    x: 100,
    y: 300,
    width: 30,
    height: 50,
    vx: 0,
    vy: 0,
    speed: 3,
    jumpPower: 14,
    gravity: 0.8,
    friction: 0.85,
    airFriction: 0.95,
    isGrounded: false,
    isSliding: false,
    canDoubleJump: true,
    isDashing: false,
    dashCooldown: 0,
    dashDuration: 0,
    facingRight: true,
    wallSliding: false,
    trail: [],
    spawnX: 100,
    spawnY: 300
};

// ==========================================
// INPUT HANDLING
// ==========================================
const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    dash: false
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;
    if (e.code === 'Space') {
        keys.jump = true;
        e.preventDefault();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.dash = true;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
    if (e.code === 'Space') keys.jump = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.dash = false;
});

// Jump press detection
let jumpPressed = false;
let dashPressed = false;

// ==========================================
// PARTICLES
// ==========================================
const particles = [];

function createParticle(x, y, color, count = 5, speed = 3) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * speed * 2,
            vy: (Math.random() - 0.5) * speed * 2,
            life: 1,
            decay: 0.02 + Math.random() * 0.03,
            size: 3 + Math.random() * 4,
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= p.decay;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ==========================================
// LEVEL DEFINITIONS
// ==========================================
const levels = [
    // Level 1 - Tutorial: Basic jumping
    {
        name: "FIRST STEPS",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 200, height: 30 },
            { x: 300, y: 450, width: 150, height: 30 },
            { x: 500, y: 400, width: 150, height: 30 },
            { x: 700, y: 350, width: 150, height: 30 },
            { x: 900, y: 300, width: 200, height: 30 }
        ],
        hazards: [],
        goal: { x: 1000, y: 240, width: 50, height: 60 },
        spawn: { x: 100, y: 400 }
    },
    // Level 2 - Gaps and longer jumps
    {
        name: "LEAP OF FAITH",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 150, height: 30 },
            { x: 300, y: 480, width: 100, height: 30 },
            { x: 500, y: 450, width: 80, height: 30 },
            { x: 700, y: 400, width: 80, height: 30 },
            { x: 550, y: 320, width: 80, height: 30 },
            { x: 750, y: 250, width: 150, height: 30 }
        ],
        hazards: [
            { x: 0, y: 600, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 800, y: 190, width: 50, height: 60 },
        spawn: { x: 100, y: 400 }
    },
    // Level 3 - Medieval Castle
    {
        name: "CASTLE SIEGE",
        theme: 'castle',
        platforms: [
            { x: 50, y: 500, width: 150, height: 40 },
            { x: 250, y: 500, width: 150, height: 40 },
            { x: 450, y: 500, width: 150, height: 40 },
            { x: 720, y: 430, width: 100, height: 40 },
            { x: 920, y: 340, width: 100, height: 40 },
            { x: 700, y: 250, width: 100, height: 40 },
            { x: 450, y: 180, width: 200, height: 40 }
        ],
        hazards: [
            { x: 200, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 400, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 600, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 500, y: 120, width: 50, height: 60 },
        spawn: { x: 100, y: 400 }
    },
    // Level 4 - Wall jumping introduction
    {
        name: "WALL RUNNER",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 150, height: 30 },
            { x: 250, y: 550, width: 30, height: 250, isWall: true },
            { x: 330, y: 450, width: 30, height: 200, isWall: true },
            { x: 280, y: 380, width: 80, height: 25 },
            { x: 250, y: 200, width: 150, height: 30 },
            { x: 450, y: 350, width: 150, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 500, y: 290, width: 50, height: 60 },
        spawn: { x: 100, y: 450 }
    },
    // Level 5 - Moving platforms
    {
        name: "KEEP MOVING",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 150, height: 30 },
            { x: 300, y: 450, width: 100, height: 30, moving: true, moveX: 150, speed: 2 },
            { x: 550, y: 380, width: 100, height: 30, moving: true, moveY: 100, speed: 1.5 },
            { x: 750, y: 300, width: 100, height: 30, moving: true, moveX: 100, speed: 2.5 },
            { x: 900, y: 250, width: 150, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 950, y: 190, width: 50, height: 60 },
        spawn: { x: 100, y: 400 }
    },
    // Level 6 - Haunted Mansion
    {
        name: "HAUNTED MANSION",
        theme: 'mansion',
        platforms: [
            { x: 50, y: 500, width: 100, height: 35 },
            { x: 200, y: 480, width: 60, height: 35 },
            { x: 310, y: 450, width: 60, height: 35 },
            { x: 420, y: 420, width: 60, height: 35 },
            { x: 530, y: 380, width: 60, height: 35 },
            { x: 640, y: 340, width: 60, height: 35 },
            { x: 750, y: 300, width: 150, height: 35 }
        ],
        hazards: [
            { x: 175, y: 465, width: 30, height: 15, type: 'spike' },
            { x: 285, y: 435, width: 30, height: 15, type: 'spike' },
            { x: 395, y: 405, width: 30, height: 15, type: 'spike' },
            { x: 505, y: 365, width: 30, height: 15, type: 'spike' },
            { x: 615, y: 325, width: 30, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 800, y: 240, width: 50, height: 60 },
        spawn: { x: 80, y: 400 }
    },
    // Level 7 - Moving platforms with bouncy walls
    {
        name: "BOUNCE HOUSE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 100, height: 30 },
            { x: 200, y: 500, width: 80, height: 25, moving: true, moveX: 100, speed: 2 },
            { x: 400, y: 420, width: 80, height: 25, moving: true, moveY: 80, speed: 1.5 },
            { x: 600, y: 350, width: 80, height: 25, moving: true, moveX: 120, speed: 2.5 },
            { x: 800, y: 280, width: 80, height: 25, moving: true, moveY: 100, speed: 2 },
            { x: 950, y: 200, width: 80, height: 25, moving: true, moveX: 80, speed: 3 },
            { x: 150, y: 300, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 550, y: 200, width: 25, height: 250, isWall: true, isBouncy: true },
            { x: 750, y: 150, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 1050, y: 100, width: 120, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1080, y: 40, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 8 - Tropical Island
    {
        name: "ISLAND ESCAPE",
        theme: 'tropical',
        platforms: [
            { x: 50, y: 400, width: 100, height: 30 },
            { x: 350, y: 400, width: 100, height: 30 },
            { x: 650, y: 400, width: 100, height: 30 },
            { x: 950, y: 400, width: 150, height: 30 }
        ],
        hazards: [
            { x: 150, y: 300, width: 200, height: 200, type: 'spike' },
            { x: 450, y: 300, width: 200, height: 200, type: 'spike' },
            { x: 750, y: 300, width: 200, height: 200, type: 'spike' },
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1000, y: 340, width: 50, height: 60 },
        spawn: { x: 80, y: 300 }
    },
    // Level 9 - Everything combined
    {
        name: "GAUNTLET",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 100, height: 30 },
            { x: 200, y: 500, width: 80, height: 30, moving: true, moveX: 80, speed: 2 },
            { x: 380, y: 300, width: 30, height: 250, isWall: true },
            { x: 480, y: 350, width: 30, height: 200, isWall: true },
            { x: 380, y: 150, width: 150, height: 30 },
            { x: 600, y: 200, width: 80, height: 30, moving: true, moveY: 150, speed: 1.5 },
            { x: 750, y: 150, width: 100, height: 30 }
        ],
        hazards: [
            { x: 280, y: 535, width: 100, height: 15, type: 'spike' },
            { x: 410, y: 505, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 770, y: 90, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 10 - The Ultimate Challenge
    {
        name: "VELOCITY MASTER",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 80, height: 30 },
            { x: 180, y: 520, width: 50, height: 30 },
            { x: 280, y: 480, width: 50, height: 30, moving: true, moveY: 80, speed: 2 },
            { x: 400, y: 300, width: 30, height: 230, isWall: true },
            { x: 500, y: 350, width: 30, height: 180, isWall: true },
            { x: 400, y: 180, width: 50, height: 30 },
            { x: 550, y: 150, width: 50, height: 30, moving: true, moveX: 100, speed: 3 },
            { x: 750, y: 200, width: 30, height: 150, isWall: true },
            { x: 850, y: 250, width: 30, height: 100, isWall: true },
            { x: 750, y: 80, width: 150, height: 30 }
        ],
        hazards: [
            { x: 130, y: 535, width: 50, height: 15, type: 'spike' },
            { x: 230, y: 505, width: 50, height: 15, type: 'spike' },
            { x: 330, y: 535, width: 70, height: 15, type: 'spike' },
            { x: 430, y: 485, width: 70, height: 15, type: 'spike' },
            { x: 600, y: 180, width: 150, height: 80, type: 'spike' },
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 800, y: 20, width: 50, height: 60 },
        spawn: { x: 70, y: 450 }
    }
];

let currentPlatforms = [];
let currentHazards = [];
let currentGoal = null;

// ==========================================
// LEVEL LOADING
// ==========================================
function loadLevel(levelIndex) {
    const level = levels[levelIndex];
    
    // Set the theme
    currentTheme = themes[level.theme] || themes.neon;
    
    // Deep copy platforms with initial positions for moving platforms
    currentPlatforms = level.platforms.map(p => ({
        ...p,
        startX: p.x,
        startY: p.y,
        moveProgress: 0
    }));
    
    currentHazards = [...level.hazards];
    currentGoal = { ...level.goal };
    
    // Set spawn point
    player.spawnX = level.spawn.x;
    player.spawnY = level.spawn.y;
    
    respawnPlayer();
    
    // Update UI
    document.getElementById('current-level').textContent = levelIndex + 1;
    
    // Reset level deaths
    gameState.levelDeaths = 0;
    gameState.levelStartTime = Date.now();
}

function respawnPlayer() {
    player.x = player.spawnX;
    player.y = player.spawnY;
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;
    player.canDoubleJump = true;
    player.isDashing = false;
    player.dashCooldown = 0;
    player.isSliding = false;
    player.trail = [];
}

// ==========================================
// COLLISION DETECTION
// ==========================================
function rectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function checkPlatformCollisions() {
    player.isGrounded = false;
    player.wallSliding = false;
    
    const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.isSliding ? player.height / 2 : player.height
    };
    
    for (const platform of currentPlatforms) {
        if (!rectCollision(playerRect, platform)) continue;
        
        // Calculate overlap on each axis
        const overlapLeft = (playerRect.x + playerRect.width) - platform.x;
        const overlapRight = (platform.x + platform.width) - playerRect.x;
        const overlapTop = (playerRect.y + playerRect.height) - platform.y;
        const overlapBottom = (platform.y + platform.height) - playerRect.y;
        
        // Find minimum overlap
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        
        if (minOverlapY < minOverlapX) {
            // Vertical collision
            if (overlapTop < overlapBottom) {
                // Landing on top
                player.y = platform.y - (player.isSliding ? player.height / 2 : player.height);
                player.vy = 0;
                player.isGrounded = true;
                player.canDoubleJump = true;
                
                // Move with moving platform
                if (platform.moving) {
                    if (platform.deltaX) {
                        player.x += platform.deltaX;
                    }
                    if (platform.deltaY) {
                        player.y += platform.deltaY;
                    }
                }
            } else {
                // Hitting from below
                player.y = platform.y + platform.height;
                player.vy = 0;
            }
        } else {
            // Horizontal collision (wall)
            if (overlapLeft < overlapRight) {
                player.x = platform.x - player.width;
                if (platform.isBouncy) {
                    // Bouncy wall - bounce back with force
                    player.vx = -Math.abs(player.vx) - 8;
                    player.vy = -10; // Give a little upward boost
                    player.canDoubleJump = true;
                    createParticle(platform.x, player.y + player.height / 2, '#00ff88', 10, 6);
                } else if (platform.isWall && player.vy > 0) {
                    player.wallSliding = true;
                    player.vy = Math.min(player.vy, 3);
                    player.canDoubleJump = true;
                    player.vx = 0;
                } else {
                    player.vx = 0;
                }
            } else {
                player.x = platform.x + platform.width;
                if (platform.isBouncy) {
                    // Bouncy wall - bounce back with force
                    player.vx = Math.abs(player.vx) + 8;
                    player.vy = -10; // Give a little upward boost
                    player.canDoubleJump = true;
                    createParticle(platform.x + platform.width, player.y + player.height / 2, '#00ff88', 10, 6);
                } else if (platform.isWall && player.vy > 0) {
                    player.wallSliding = true;
                    player.vy = Math.min(player.vy, 3);
                    player.canDoubleJump = true;
                    player.vx = 0;
                } else {
                    player.vx = 0;
                }
            }
        }
    }
}

function checkHazardCollisions() {
    const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.isSliding ? player.height / 2 : player.height
    };
    
    for (const hazard of currentHazards) {
        if (rectCollision(playerRect, hazard)) {
            killPlayer(hazard.type === 'void' ? 'Fell into the void' : 'Hit the spikes');
            return true;
        }
    }
    return false;
}

function checkGoalCollision() {
    const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
    };
    
    if (rectCollision(playerRect, currentGoal)) {
        levelComplete();
        return true;
    }
    return false;
}

// ==========================================
// GAME EVENTS
// ==========================================
function killPlayer(reason) {
    createParticle(player.x + player.width / 2, player.y + player.height / 2, currentTheme.danger, 20, 8);
    
    gameState.deaths++;
    gameState.levelDeaths++;
    document.getElementById('death-count').textContent = gameState.deaths;
    
    // Show death screen briefly
    const deathScreen = document.getElementById('game-over-screen');
    document.getElementById('death-message').textContent = reason;
    deathScreen.classList.remove('hidden');
    
    setTimeout(() => {
        deathScreen.classList.add('hidden');
        respawnPlayer();
    }, 800);
}

function levelComplete() {
    gameState.isPlaying = false;
    
    const levelTime = Date.now() - gameState.levelStartTime;
    const timeStr = formatTime(levelTime);
    
    document.getElementById('level-time').textContent = timeStr;
    document.getElementById('level-deaths').textContent = gameState.levelDeaths;
    
    // Check if this was the last level
    if (gameState.currentLevel >= levels.length - 1) {
        showVictoryScreen();
    } else {
        document.getElementById('level-complete-screen').classList.remove('hidden');
    }
    
    createParticle(player.x + player.width / 2, player.y + player.height / 2, currentTheme.success, 30, 10);
}

function showVictoryScreen() {
    const totalTime = Date.now() - gameState.startTime;
    document.getElementById('total-time').textContent = formatTime(totalTime);
    document.getElementById('total-deaths').textContent = gameState.deaths;
    document.getElementById('victory-screen').classList.remove('hidden');
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================
// UPDATE LOOP
// ==========================================
function updatePlayer() {
    // Horizontal movement
    if (keys.left) {
        player.vx -= player.speed * 0.2;
        player.facingRight = false;
    }
    if (keys.right) {
        player.vx += player.speed * 0.2;
        player.facingRight = true;
    }
    
    // Clamp horizontal speed
    const maxSpeed = player.isDashing ? player.speed * 3 : player.speed;
    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
    
    // Apply friction
    if (player.isGrounded) {
        player.vx *= player.friction;
    } else {
        player.vx *= player.airFriction;
    }
    
    // Jumping
    if (keys.jump && !jumpPressed) {
        jumpPressed = true;
        if (player.isGrounded) {
            player.vy = -player.jumpPower;
            player.isGrounded = false;
            createParticle(player.x + player.width / 2, player.y + player.height, currentTheme.primary, 8, 4);
        } else if (player.wallSliding) {
            // Wall jump
            player.vy = -player.jumpPower * 0.9;
            player.vx = player.facingRight ? -player.speed * 1.5 : player.speed * 1.5;
            player.wallSliding = false;
            createParticle(player.x + player.width / 2, player.y + player.height / 2, currentTheme.primary, 10, 5);
        } else if (player.canDoubleJump) {
            // Double jump
            player.vy = -player.jumpPower * 0.85;
            player.canDoubleJump = false;
            createParticle(player.x + player.width / 2, player.y + player.height, currentTheme.secondary, 10, 5);
        }
    }
    if (!keys.jump) jumpPressed = false;
    
    // Sliding
    player.isSliding = keys.down && player.isGrounded && Math.abs(player.vx) > 1;
    
    // Dashing
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.dashDuration > 0) player.dashDuration--;
    
    if (keys.dash && !dashPressed && player.dashCooldown === 0) {
        dashPressed = true;
        player.isDashing = true;
        player.dashDuration = 10;
        player.dashCooldown = 45;
        player.vx = player.facingRight ? player.speed * 3 : -player.speed * 3;
        player.vy = 0;
        createParticle(player.x + player.width / 2, player.y + player.height / 2, currentTheme.accent, 15, 6);
    }
    if (!keys.dash) dashPressed = false;
    if (player.dashDuration === 0) player.isDashing = false;
    
    // Apply gravity (reduced when holding jump to float)
    if (!player.isDashing) {
        if (player.wallSliding) {
            player.vy += player.gravity * 0.3;
        } else if (keys.jump && !player.isGrounded) {
            // Float/hover when holding space in the air
            player.vy += player.gravity * 0.1;
            // Cap upward velocity while floating
            if (player.vy < 0) {
                player.vy *= 0.95;
            }
            // Slow descent while floating
            if (player.vy > 2) {
                player.vy = 2;
            }
        } else {
            player.vy += player.gravity;
        }
    }
    
    // Terminal velocity
    player.vy = Math.min(player.vy, 20);
    
    // Update position
    player.x += player.vx;
    player.y += player.vy;
    
    // Trail effect
    if (Math.abs(player.vx) > 2 || Math.abs(player.vy) > 2) {
        player.trail.push({
            x: player.x,
            y: player.y,
            alpha: 0.5
        });
    }
    
    // Update trail
    player.trail = player.trail.filter(t => {
        t.alpha -= 0.05;
        return t.alpha > 0;
    });
    
    // Keep max trail length
    if (player.trail.length > 10) {
        player.trail.shift();
    }
}

function updateMovingPlatforms() {
    for (const platform of currentPlatforms) {
        if (!platform.moving) continue;
        
        // Store previous position
        platform.prevX = platform.x;
        platform.prevY = platform.y;
        
        platform.moveProgress += 0.02;
        
        if (platform.moveX) {
            platform.x = platform.startX + Math.sin(platform.moveProgress * platform.speed) * platform.moveX;
        }
        if (platform.moveY) {
            platform.y = platform.startY + Math.sin(platform.moveProgress * platform.speed) * platform.moveY;
        }
        
        // Calculate delta for player movement
        platform.deltaX = platform.x - platform.prevX;
        platform.deltaY = platform.y - platform.prevY;
    }
}

function updateTimer() {
    if (gameState.isPlaying) {
        const elapsed = Date.now() - gameState.levelStartTime;
        document.getElementById('current-time').textContent = formatTime(elapsed);
    }
}

// ==========================================
// RENDER LOOP
// ==========================================
function drawBackground() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, currentTheme.bgTop);
    gradient.addColorStop(0.5, currentTheme.bgMid);
    gradient.addColorStop(1, currentTheme.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Theme-specific decorations
    if (currentTheme.decorations === 'castle') {
        drawCastleBackground();
    } else if (currentTheme.decorations === 'mansion') {
        drawMansionBackground();
    } else if (currentTheme.decorations === 'tropical') {
        drawTropicalBackground();
    } else {
        // Default neon grid
        ctx.strokeStyle = currentTheme.gridColor;
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}

function drawCastleBackground() {
    // Stone wall texture pattern
    ctx.fillStyle = 'rgba(60, 60, 80, 0.15)';
    const brickW = 60, brickH = 30;
    for (let y = 0; y < canvas.height; y += brickH) {
        const offset = (Math.floor(y / brickH) % 2) * (brickW / 2);
        for (let x = -brickW + offset; x < canvas.width; x += brickW) {
            ctx.strokeStyle = 'rgba(100, 100, 120, 0.1)';
            ctx.strokeRect(x, y, brickW - 2, brickH - 2);
        }
    }
    
    // Castle towers in background
    ctx.fillStyle = 'rgba(30, 30, 50, 0.6)';
    // Left tower
    ctx.fillRect(50, 200, 80, 400);
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.lineTo(90, 120);
    ctx.lineTo(130, 200);
    ctx.fill();
    // Right tower
    ctx.fillRect(canvas.width - 130, 150, 80, 450);
    ctx.beginPath();
    ctx.moveTo(canvas.width - 130, 150);
    ctx.lineTo(canvas.width - 90, 70);
    ctx.lineTo(canvas.width - 50, 150);
    ctx.fill();
    
    // Torches (flickering)
    const flicker = Math.sin(Date.now() * 0.01) * 5 + 10;
    drawTorch(150, 350, flicker);
    drawTorch(canvas.width - 170, 300, flicker);
    drawTorch(canvas.width / 2, 250, flicker);
}

function drawTorch(x, y, flicker) {
    // Torch holder
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(x - 5, y, 10, 30);
    
    // Flame glow
    const gradient = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, 40 + flicker);
    gradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 20, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y - 10, 40 + flicker, 0, Math.PI * 2);
    ctx.fill();
    
    // Flame
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.quadraticCurveTo(x - 10, y - 20, x, y - 25 - flicker/2);
    ctx.quadraticCurveTo(x + 10, y - 20, x + 8, y);
    ctx.fill();
    
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.quadraticCurveTo(x - 5, y - 12, x, y - 18 - flicker/3);
    ctx.quadraticCurveTo(x + 5, y - 12, x + 4, y);
    ctx.fill();
}

function drawMansionBackground() {
    // Wallpaper pattern
    ctx.strokeStyle = 'rgba(114, 47, 55, 0.15)';
    ctx.lineWidth = 1;
    const patternSize = 40;
    for (let y = 0; y < canvas.height; y += patternSize) {
        for (let x = 0; x < canvas.width; x += patternSize) {
            // Diamond pattern
            ctx.beginPath();
            ctx.moveTo(x + patternSize/2, y);
            ctx.lineTo(x + patternSize, y + patternSize/2);
            ctx.lineTo(x + patternSize/2, y + patternSize);
            ctx.lineTo(x, y + patternSize/2);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    // Chandelier
    const chandX = canvas.width / 2;
    ctx.strokeStyle = '#c9a959';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chandX, 0);
    ctx.lineTo(chandX, 80);
    ctx.stroke();
    
    // Chandelier arms
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        const armX = chandX + i * 40;
        ctx.beginPath();
        ctx.moveTo(chandX, 80);
        ctx.quadraticCurveTo(chandX + i * 20, 100, armX, 110);
        ctx.stroke();
        
        // Candle glow
        const glow = ctx.createRadialGradient(armX, 100, 0, armX, 100, 30);
        glow.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        glow.addColorStop(1, 'rgba(255, 150, 50, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(armX, 100, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Window frames
    ctx.fillStyle = 'rgba(20, 10, 10, 0.5)';
    ctx.fillRect(100, 150, 120, 200);
    ctx.fillRect(canvas.width - 220, 150, 120, 200);
    
    ctx.strokeStyle = '#722f37';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 150, 120, 200);
    ctx.strokeRect(canvas.width - 220, 150, 120, 200);
    
    // Window cross
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(160, 150);
    ctx.lineTo(160, 350);
    ctx.moveTo(100, 250);
    ctx.lineTo(220, 250);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width - 160, 150);
    ctx.lineTo(canvas.width - 160, 350);
    ctx.moveTo(canvas.width - 220, 250);
    ctx.lineTo(canvas.width - 100, 250);
    ctx.stroke();
    
    // Moonlight through windows
    ctx.fillStyle = 'rgba(200, 200, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(100, 350);
    ctx.lineTo(50, canvas.height);
    ctx.lineTo(270, canvas.height);
    ctx.lineTo(220, 350);
    ctx.fill();
}

function drawTropicalBackground() {
    // Ocean waves at bottom
    const time = Date.now() * 0.002;
    ctx.fillStyle = 'rgba(30, 144, 180, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 20) {
        const y = canvas.height - 80 + Math.sin(x * 0.02 + time) * 15;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(50, 180, 220, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 20) {
        const y = canvas.height - 60 + Math.sin(x * 0.025 + time + 1) * 12;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
    
    // Sun
    const sunGradient = ctx.createRadialGradient(canvas.width - 150, 100, 0, canvas.width - 150, 100, 80);
    sunGradient.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
    sunGradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.5)');
    sunGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(canvas.width - 150, 100, 80, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(canvas.width - 150, 100, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Palm trees
    drawPalmTree(80, 480);
    drawPalmTree(canvas.width - 100, 450);
    drawPalmTree(canvas.width / 2 + 200, 520);
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    drawCloud(200, 80, 1);
    drawCloud(500, 120, 0.7);
    drawCloud(800, 60, 1.2);
}

function drawPalmTree(x, groundY) {
    // Trunk
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.moveTo(x - 12, groundY);
    ctx.quadraticCurveTo(x - 8, groundY - 80, x - 5, groundY - 150);
    ctx.lineTo(x + 5, groundY - 150);
    ctx.quadraticCurveTo(x + 8, groundY - 80, x + 12, groundY);
    ctx.fill();
    
    // Palm leaves
    ctx.fillStyle = '#228b22';
    const leafY = groundY - 150;
    
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        ctx.save();
        ctx.translate(x, leafY);
        ctx.rotate(angle + Math.sin(Date.now() * 0.002 + angle) * 0.05);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(40, -20, 80, 10);
        ctx.quadraticCurveTo(40, 0, 0, 0);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Coconuts
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(x - 8, leafY + 10, 8, 0, Math.PI * 2);
    ctx.arc(x + 8, leafY + 12, 7, 0, Math.PI * 2);
    ctx.fill();
}

function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(35, 5, 25, 0, Math.PI * 2);
    ctx.arc(-30, 5, 20, 0, Math.PI * 2);
    ctx.arc(15, -15, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawPlatforms() {
    for (const platform of currentPlatforms) {
        // Theme-specific platform rendering
        if (currentTheme.decorations === 'castle') {
            drawCastlePlatform(platform);
        } else if (currentTheme.decorations === 'mansion') {
            drawMansionPlatform(platform);
        } else if (currentTheme.decorations === 'tropical') {
            drawTropicalPlatform(platform);
        } else {
            drawNeonPlatform(platform);
        }
    }
}

function drawNeonPlatform(platform) {
    // Platform body
    ctx.fillStyle = currentTheme.platform;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Determine border color based on wall type
    let borderColor = currentTheme.platformBorder;
    if (platform.isBouncy) {
        // Bouncy walls pulse green
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        borderColor = '#00ff88';
        ctx.shadowBlur = 15 * pulse;
    } else if (platform.isWall) {
        borderColor = currentTheme.secondary;
    }
    
    // Glowing border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = platform.isBouncy ? 3 : 2;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // Glow effect
    ctx.shadowColor = borderColor;
    if (!platform.isBouncy) ctx.shadowBlur = 10;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    ctx.shadowBlur = 0;
    
    // Bouncy wall spring indicators
    if (platform.isBouncy) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        const springCount = Math.floor(platform.height / 30);
        for (let i = 1; i <= springCount; i++) {
            const sy = platform.y + (platform.height / (springCount + 1)) * i;
            ctx.beginPath();
            ctx.moveTo(platform.x + 5, sy - 5);
            ctx.lineTo(platform.x + platform.width / 2, sy + 5);
            ctx.lineTo(platform.x + platform.width - 5, sy - 5);
            ctx.stroke();
        }
    }
    
    // Moving platform indicator
    if (platform.moving) {
        ctx.fillStyle = currentTheme.accent;
        ctx.fillRect(platform.x + platform.width / 2 - 10, platform.y + 5, 20, 3);
    }
}

function drawCastlePlatform(platform) {
    // Stone block texture
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Stone brick pattern
    ctx.strokeStyle = '#3a3a4a';
    ctx.lineWidth = 2;
    const brickW = 25;
    const brickH = platform.height / 2;
    for (let row = 0; row < 2; row++) {
        const offset = row % 2 === 0 ? 0 : brickW / 2;
        for (let col = 0; col < Math.ceil(platform.width / brickW) + 1; col++) {
            const bx = platform.x + col * brickW - offset;
            const by = platform.y + row * brickH;
            if (bx < platform.x + platform.width && bx + brickW > platform.x) {
                ctx.strokeRect(
                    Math.max(bx, platform.x), 
                    by, 
                    Math.min(brickW, platform.x + platform.width - bx), 
                    brickH
                );
            }
        }
    }
    
    // Border
    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 3;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // Wall vines
    if (platform.isWall) {
        ctx.strokeStyle = '#2d5a27';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const vx = platform.x + 5 + i * 10;
            ctx.beginPath();
            ctx.moveTo(vx, platform.y);
            for (let y = platform.y; y < platform.y + platform.height; y += 20) {
                ctx.lineTo(vx + Math.sin(y * 0.1) * 5, y);
            }
            ctx.stroke();
        }
    }
}

function drawMansionPlatform(platform) {
    // Rich wood texture
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Wood grain
    ctx.strokeStyle = '#3a1a0a';
    ctx.lineWidth = 1;
    for (let i = 0; i < platform.height; i += 6) {
        ctx.beginPath();
        ctx.moveTo(platform.x, platform.y + i);
        ctx.lineTo(platform.x + platform.width, platform.y + i + Math.sin(i) * 2);
        ctx.stroke();
    }
    
    // Gold trim
    ctx.strokeStyle = '#c9a959';
    ctx.lineWidth = 3;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // Decorative corners
    ctx.fillStyle = '#c9a959';
    const cornerSize = 8;
    // Top-left
    ctx.fillRect(platform.x - 1, platform.y - 1, cornerSize, cornerSize);
    // Top-right
    ctx.fillRect(platform.x + platform.width - cornerSize + 1, platform.y - 1, cornerSize, cornerSize);
    // Bottom-left
    ctx.fillRect(platform.x - 1, platform.y + platform.height - cornerSize + 1, cornerSize, cornerSize);
    // Bottom-right
    ctx.fillRect(platform.x + platform.width - cornerSize + 1, platform.y + platform.height - cornerSize + 1, cornerSize, cornerSize);
    
    if (platform.isWall) {
        // Ornate pattern for walls
        ctx.strokeStyle = '#8a6939';
        ctx.lineWidth = 2;
        const patternH = 40;
        for (let y = platform.y + 20; y < platform.y + platform.height - 20; y += patternH) {
            ctx.beginPath();
            ctx.moveTo(platform.x + platform.width / 2, y);
            ctx.lineTo(platform.x + platform.width / 2 + 8, y + patternH / 2);
            ctx.lineTo(platform.x + platform.width / 2, y + patternH);
            ctx.lineTo(platform.x + platform.width / 2 - 8, y + patternH / 2);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

function drawTropicalPlatform(platform) {
    // Sandy/wooden platform
    if (platform.isWall) {
        // Bamboo wall
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Bamboo segments
        ctx.strokeStyle = '#6b5335';
        ctx.lineWidth = 2;
        for (let y = platform.y + 30; y < platform.y + platform.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(platform.x, y);
            ctx.lineTo(platform.x + platform.width, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#ab9375';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    } else {
        // Wooden dock platform
        ctx.fillStyle = '#a08060';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Wood planks
        ctx.strokeStyle = '#806040';
        ctx.lineWidth = 2;
        const plankW = 30;
        for (let x = platform.x; x < platform.x + platform.width; x += plankW) {
            ctx.beginPath();
            ctx.moveTo(x, platform.y);
            ctx.lineTo(x, platform.y + platform.height);
            ctx.stroke();
        }
        
        // Rope border
        ctx.strokeStyle = '#c4a574';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        ctx.setLineDash([]);
    }
    
    // Moving platform - wave indicator
    if (platform.moving) {
        ctx.fillStyle = '#00d4aa';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const wx = platform.x + platform.width / 2 - 15 + i * 15;
            ctx.moveTo(wx, platform.y + 8);
            ctx.quadraticCurveTo(wx + 5, platform.y + 4, wx + 10, platform.y + 8);
        }
        ctx.stroke();
    }
}

function drawHazards() {
    for (const hazard of currentHazards) {
        if (hazard.type === 'void') {
            // Void - gradient fade (themed)
            const gradient = ctx.createLinearGradient(0, hazard.y, 0, hazard.y + hazard.height);
            if (currentTheme.decorations === 'tropical') {
                gradient.addColorStop(0, 'rgba(0, 100, 150, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 50, 100, 0.9)');
            } else if (currentTheme.decorations === 'castle') {
                gradient.addColorStop(0, 'rgba(20, 10, 30, 0.5)');
                gradient.addColorStop(1, 'rgba(10, 5, 15, 0.95)');
            } else if (currentTheme.decorations === 'mansion') {
                gradient.addColorStop(0, 'rgba(30, 10, 10, 0.5)');
                gradient.addColorStop(1, 'rgba(15, 5, 5, 0.95)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 51, 68, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 51, 68, 0.8)');
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
        } else if (hazard.type === 'spike') {
            // Theme-specific spikes
            if (currentTheme.decorations === 'castle') {
                drawCastleSpikes(hazard);
            } else if (currentTheme.decorations === 'mansion') {
                drawMansionSpikes(hazard);
            } else if (currentTheme.decorations === 'tropical') {
                drawTropicalSpikes(hazard);
            } else {
                drawNeonSpikes(hazard);
            }
        }
    }
}

function drawNeonSpikes(hazard) {
    ctx.fillStyle = currentTheme.danger;
    ctx.shadowColor = currentTheme.danger;
    ctx.shadowBlur = 10;
    
    const spikeWidth = 15;
    const numSpikes = Math.floor(hazard.width / spikeWidth);
    
    for (let i = 0; i < numSpikes; i++) {
        ctx.beginPath();
        ctx.moveTo(hazard.x + i * spikeWidth, hazard.y + hazard.height);
        ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y);
        ctx.lineTo(hazard.x + (i + 1) * spikeWidth, hazard.y + hazard.height);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
}

function drawCastleSpikes(hazard) {
    // Medieval iron spikes
    ctx.fillStyle = '#4a4a5a';
    const spikeWidth = 12;
    const numSpikes = Math.floor(hazard.width / spikeWidth);
    
    for (let i = 0; i < numSpikes; i++) {
        // Spike body
        ctx.fillStyle = '#3a3a4a';
        ctx.beginPath();
        ctx.moveTo(hazard.x + i * spikeWidth + 2, hazard.y + hazard.height);
        ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y);
        ctx.lineTo(hazard.x + (i + 1) * spikeWidth - 2, hazard.y + hazard.height);
        ctx.closePath();
        ctx.fill();
        
        // Spike highlight
        ctx.fillStyle = '#5a5a6a';
        ctx.beginPath();
        ctx.moveTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y);
        ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2 + 2, hazard.y + hazard.height * 0.4);
        ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y + hazard.height * 0.3);
        ctx.fill();
    }
    
    // Blood stains
    ctx.fillStyle = 'rgba(139, 0, 0, 0.6)';
    for (let i = 0; i < numSpikes; i += 3) {
        ctx.beginPath();
        ctx.arc(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMansionSpikes(hazard) {
    // Ornate deadly spikes
    ctx.fillStyle = '#1a0a0a';
    const spikeWidth = 18;
    const numSpikes = Math.floor(hazard.width / spikeWidth);
    
    for (let i = 0; i < numSpikes; i++) {
        // Gothic spike design
        ctx.fillStyle = '#2a1515';
        ctx.beginPath();
        ctx.moveTo(hazard.x + i * spikeWidth + 3, hazard.y + hazard.height);
        ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y - 5);
        ctx.lineTo(hazard.x + (i + 1) * spikeWidth - 3, hazard.y + hazard.height);
        ctx.closePath();
        ctx.fill();
        
        // Gold accent
        ctx.strokeStyle = '#8a6939';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y);
        ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y + hazard.height * 0.5);
        ctx.stroke();
    }
}

function drawTropicalSpikes(hazard) {
    // Coral/sea urchin spikes
    const spikeWidth = 14;
    const numSpikes = Math.floor(hazard.width / spikeWidth);
    
    for (let i = 0; i < numSpikes; i++) {
        // Coral base
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(hazard.x + i * spikeWidth + 1, hazard.y + hazard.height);
        ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y + 2);
        ctx.lineTo(hazard.x + (i + 1) * spikeWidth - 1, hazard.y + hazard.height);
        ctx.closePath();
        ctx.fill();
        
        // Coral detail
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.arc(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y + hazard.height * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGoal() {
    const time = Date.now() * 0.003;
    const pulse = Math.sin(time) * 0.2 + 0.8;
    
    if (currentTheme.decorations === 'castle') {
        drawCastleGoal(pulse);
    } else if (currentTheme.decorations === 'mansion') {
        drawMansionGoal(pulse);
    } else if (currentTheme.decorations === 'tropical') {
        drawTropicalGoal(pulse);
    } else {
        drawNeonGoal(pulse);
    }
}

function drawNeonGoal(pulse) {
    // Goal glow
    ctx.shadowColor = currentTheme.success;
    ctx.shadowBlur = 20 * pulse;
    
    // Goal body
    ctx.fillStyle = currentTheme.success;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
    ctx.globalAlpha = 1;
    
    // Goal border
    ctx.strokeStyle = currentTheme.success;
    ctx.lineWidth = 3;
    ctx.strokeRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
    
    // Goal icon (flag-like)
    ctx.fillStyle = currentTheme.success;
    ctx.beginPath();
    ctx.moveTo(currentGoal.x + 10, currentGoal.y + 10);
    ctx.lineTo(currentGoal.x + currentGoal.width - 10, currentGoal.y + 20);
    ctx.lineTo(currentGoal.x + 10, currentGoal.y + 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawCastleGoal(pulse) {
    // Castle gate/portcullis
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
    
    // Gate arch
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(currentGoal.x + currentGoal.width / 2, currentGoal.y + 15, currentGoal.width / 2 - 5, Math.PI, 0);
    ctx.lineTo(currentGoal.x + currentGoal.width - 5, currentGoal.y + currentGoal.height);
    ctx.lineTo(currentGoal.x + 5, currentGoal.y + currentGoal.height);
    ctx.fill();
    
    // Golden glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15 * pulse;
    
    // Crown symbol
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(currentGoal.x + 10, currentGoal.y + 35);
    ctx.lineTo(currentGoal.x + 15, currentGoal.y + 20);
    ctx.lineTo(currentGoal.x + 25, currentGoal.y + 30);
    ctx.lineTo(currentGoal.x + 35, currentGoal.y + 20);
    ctx.lineTo(currentGoal.x + 40, currentGoal.y + 35);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Stone border
    ctx.strokeStyle = '#7a6a5a';
    ctx.lineWidth = 4;
    ctx.strokeRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
}

function drawMansionGoal(pulse) {
    // Ornate door
    ctx.fillStyle = '#3a1a1a';
    ctx.fillRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
    
    // Door panels
    ctx.strokeStyle = '#5a3a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(currentGoal.x + 5, currentGoal.y + 5, currentGoal.width - 10, 25);
    ctx.strokeRect(currentGoal.x + 5, currentGoal.y + 35, currentGoal.width - 10, 20);
    
    // Golden handle glow
    ctx.shadowColor = '#daa520';
    ctx.shadowBlur = 20 * pulse;
    
    // Door handle
    ctx.fillStyle = '#daa520';
    ctx.beginPath();
    ctx.arc(currentGoal.x + currentGoal.width - 12, currentGoal.y + currentGoal.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Keyhole
    ctx.fillStyle = '#1a0a0a';
    ctx.beginPath();
    ctx.arc(currentGoal.x + currentGoal.width - 12, currentGoal.y + currentGoal.height / 2 + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(currentGoal.x + currentGoal.width - 14, currentGoal.y + currentGoal.height / 2 + 12, 4, 8);
    
    ctx.shadowBlur = 0;
    
    // Gold frame
    ctx.strokeStyle = '#c9a959';
    ctx.lineWidth = 3;
    ctx.strokeRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
}

function drawTropicalGoal(pulse) {
    // Treasure chest!
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(currentGoal.x, currentGoal.y + 20, currentGoal.width, currentGoal.height - 20);
    
    // Chest lid
    ctx.fillStyle = '#a07818';
    ctx.beginPath();
    ctx.moveTo(currentGoal.x, currentGoal.y + 20);
    ctx.lineTo(currentGoal.x, currentGoal.y + 10);
    ctx.quadraticCurveTo(currentGoal.x + currentGoal.width / 2, currentGoal.y - 5, currentGoal.x + currentGoal.width, currentGoal.y + 10);
    ctx.lineTo(currentGoal.x + currentGoal.width, currentGoal.y + 20);
    ctx.fill();
    
    // Golden glow from inside
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 25 * pulse;
    
    // Gold coins peeking out
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(currentGoal.x + 15, currentGoal.y + 15, 6, 0, Math.PI * 2);
    ctx.arc(currentGoal.x + 28, currentGoal.y + 12, 5, 0, Math.PI * 2);
    ctx.arc(currentGoal.x + 38, currentGoal.y + 16, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Metal bands
    ctx.fillStyle = '#654321';
    ctx.fillRect(currentGoal.x, currentGoal.y + 30, currentGoal.width, 5);
    ctx.fillRect(currentGoal.x, currentGoal.y + currentGoal.height - 10, currentGoal.width, 5);
    
    // Lock
    ctx.fillStyle = '#c9a959';
    ctx.fillRect(currentGoal.x + currentGoal.width / 2 - 6, currentGoal.y + 25, 12, 15);
}

function drawPlayer() {
    // Use custom color or fall back to theme
    const playerColor = playerCustomization.color;
    const trailColor = playerCustomization.trailColor;
    
    // Draw trail
    for (const t of player.trail) {
        ctx.globalAlpha = t.alpha * 0.5;
        ctx.fillStyle = player.isDashing ? currentTheme.accent : trailColor;
        const trailHeight = player.isSliding ? player.height / 2 : player.height;
        ctx.fillRect(t.x, t.y, player.width, trailHeight);
    }
    ctx.globalAlpha = 1;
    
    // Player glow
    ctx.shadowColor = player.isDashing ? currentTheme.accent : playerColor;
    ctx.shadowBlur = player.isDashing ? 25 : 15;
    
    // Player body
    const height = player.isSliding ? player.height / 2 : player.height;
    const y = player.isSliding ? player.y + player.height / 2 : player.y;
    
    ctx.fillStyle = player.isDashing ? currentTheme.accent : playerColor;
    ctx.fillRect(player.x, y, player.width, height);
    
    // Player inner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(player.x + 4, y + 4, player.width - 8, height - 8);
    
    // Eyes
    const eyeY = y + 12;
    const eyeSize = 4;
    const eyeOffset = player.facingRight ? 6 : -2;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + player.width / 2 - 6 + eyeOffset, eyeY, eyeSize, eyeSize);
    ctx.fillRect(player.x + player.width / 2 + 2 + eyeOffset, eyeY, eyeSize, eyeSize);
    
    ctx.shadowBlur = 0;
}

function render() {
    drawBackground();
    drawPlatforms();
    drawHazards();
    drawGoal();
    drawParticles();
    drawPlayer();
}

// ==========================================
// GAME LOOP
// ==========================================
function gameLoop() {
    if (gameState.isPlaying) {
        updatePlayer();
        updateMovingPlatforms();
        checkPlatformCollisions();
        
        if (!checkHazardCollisions()) {
            checkGoalCollision();
        }
        
        // Check if player fell off screen
        if (player.y > canvas.height + 100) {
            killPlayer('Fell into the void');
        }
        
        updateTimer();
    }
    
    updateParticles();
    render();
    
    requestAnimationFrame(gameLoop);
}

// ==========================================
// UI EVENT HANDLERS
// ==========================================
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    gameState.currentLevel = selectedStartLevel;
    gameState.deaths = 0;
    gameState.startTime = Date.now();
    gameState.isPlaying = true;
    loadLevel(selectedStartLevel);
});

document.getElementById('next-level-btn').addEventListener('click', () => {
    document.getElementById('level-complete-screen').classList.add('hidden');
    gameState.currentLevel++;
    gameState.isPlaying = true;
    loadLevel(gameState.currentLevel);
});

document.getElementById('retry-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    respawnPlayer();
    gameState.isPlaying = true;
});

document.getElementById('replay-btn').addEventListener('click', () => {
    document.getElementById('victory-screen').classList.add('hidden');
    gameState.currentLevel = 0;
    gameState.deaths = 0;
    gameState.startTime = Date.now();
    gameState.isPlaying = true;
    loadLevel(0);
});

// ==========================================
// CHARACTER CUSTOMIZATION
// ==========================================
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');

function drawCharacterPreview() {
    const pCtx = previewCtx;
    const w = previewCanvas.width;
    const h = previewCanvas.height;
    
    // Clear
    pCtx.clearRect(0, 0, w, h);
    
    // Background
    pCtx.fillStyle = 'rgba(10, 10, 20, 0.8)';
    pCtx.fillRect(0, 0, w, h);
    
    // Character position
    const charX = w / 2 - 15;
    const charY = h / 2 - 25;
    const charW = 30;
    const charH = 50;
    
    // Glow
    pCtx.shadowColor = playerCustomization.color;
    pCtx.shadowBlur = 15;
    
    // Body
    pCtx.fillStyle = playerCustomization.color;
    pCtx.fillRect(charX, charY, charW, charH);
    
    // Inner
    pCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    pCtx.fillRect(charX + 4, charY + 4, charW - 8, charH - 8);
    
    // Eyes
    pCtx.shadowBlur = 0;
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(charX + 8, charY + 12, 4, 4);
    pCtx.fillRect(charX + 18, charY + 12, 4, 4);
    
    // Trail effect (decorative)
    pCtx.globalAlpha = 0.3;
    pCtx.fillStyle = playerCustomization.trailColor;
    pCtx.fillRect(charX - 10, charY + 5, charW, charH);
    pCtx.globalAlpha = 0.15;
    pCtx.fillRect(charX - 20, charY + 10, charW, charH);
    pCtx.globalAlpha = 1;
}

// Color button event listeners
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected from all
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        // Add selected to clicked
        btn.classList.add('selected');
        
        // Update customization
        playerCustomization.color = btn.dataset.color;
        playerCustomization.trailColor = btn.dataset.trail;
        
        // Redraw preview
        drawCharacterPreview();
    });
});

// Initial preview draw
drawCharacterPreview();

// ==========================================
// LEVEL SELECTOR
// ==========================================
let selectedStartLevel = 0;

// Level names for display
const levelNames = levels.map(level => level.name);

function updateLevelName() {
    document.getElementById('level-name').textContent = levelNames[selectedStartLevel];
}

// Level button event listeners
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected from all
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
        // Add selected to clicked
        btn.classList.add('selected');
        
        // Update selected level
        selectedStartLevel = parseInt(btn.dataset.level);
        
        // Update level name display
        updateLevelName();
    });
});

// Initial level name
updateLevelName();

// ==========================================
// START GAME
// ==========================================
loadLevel(0);
gameLoop();
