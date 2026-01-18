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
    isPaused: false,
    controlMode: 'keyboard' // 'keyboard' or 'touch'
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
    dash: false,
    fly: false
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;
    if (e.code === 'Space') {
        // Command + Space = fly cheat
        if (e.metaKey) {
            keys.fly = true;
            e.preventDefault();
        } else {
            keys.jump = true;
            e.preventDefault();
        }
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.dash = true;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
    if (e.code === 'Space') {
        keys.jump = false;
        keys.fly = false;
    }
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
    // Level 3 - Wall jumping introduction
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
    // Level 4 - Moving platforms
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
    // Level 5 - Moving platforms with bouncy walls
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
    // Level 6 - Everything combined
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
    // Level 7 - The Ultimate Challenge
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
    },
    // Level 8 - Castle Introduction
    {
        name: "STONE FORTRESS",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 150, height: 40 },
            { x: 250, y: 450, width: 120, height: 40 },
            { x: 420, y: 400, width: 120, height: 40 },
            { x: 600, y: 350, width: 120, height: 40 },
            { x: 780, y: 300, width: 150, height: 40 }
        ],
        hazards: [
            { x: 200, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 370, y: 435, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 600, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 830, y: 240, width: 50, height: 60 },
        spawn: { x: 100, y: 400 }
    },
    // Level 9 - Vertical Climb
    {
        name: "SKY TOWER",
        theme: 'neon',
        platforms: [
            { x: 100, y: 550, width: 100, height: 30 },
            { x: 50, y: 450, width: 30, height: 150, isWall: true },
            { x: 220, y: 400, width: 30, height: 200, isWall: true },
            { x: 50, y: 300, width: 100, height: 30 },
            { x: 220, y: 220, width: 100, height: 30 },
            { x: 50, y: 140, width: 100, height: 30 },
            { x: 220, y: 60, width: 150, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 400, height: 50, type: 'void' }
        ],
        goal: { x: 280, y: 0, width: 50, height: 60 },
        spawn: { x: 130, y: 450 }
    },
    // Level 10 - Mansion Mystery
    {
        name: "DARK MANOR",
        theme: 'neon',
        platforms: [
            { x: 50, y: 520, width: 100, height: 35 },
            { x: 200, y: 480, width: 80, height: 35 },
            { x: 350, y: 440, width: 80, height: 35 },
            { x: 500, y: 400, width: 80, height: 35 },
            { x: 650, y: 360, width: 80, height: 35 },
            { x: 800, y: 320, width: 80, height: 35 },
            { x: 950, y: 280, width: 120, height: 35 }
        ],
        hazards: [
            { x: 150, y: 505, width: 50, height: 15, type: 'spike' },
            { x: 300, y: 425, width: 50, height: 15, type: 'spike' },
            { x: 600, y: 345, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 600, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 980, y: 220, width: 50, height: 60 },
        spawn: { x: 80, y: 420 }
    },
    // Level 11 - Tropical Paradise
    {
        name: "PALM BEACH",
        theme: 'neon',
        platforms: [
            { x: 50, y: 450, width: 120, height: 30 },
            { x: 250, y: 400, width: 100, height: 30, moving: true, moveY: 80, speed: 1.5 },
            { x: 450, y: 350, width: 100, height: 30 },
            { x: 650, y: 300, width: 100, height: 30, moving: true, moveY: 80, speed: 2 },
            { x: 850, y: 250, width: 150, height: 30 }
        ],
        hazards: [
            { x: 0, y: 550, width: 1200, height: 100, type: 'void' }
        ],
        goal: { x: 900, y: 190, width: 50, height: 60 },
        spawn: { x: 80, y: 350 }
    },
    // Level 12 - The Pit
    {
        name: "DESCENT",
        theme: 'neon',
        platforms: [
            { x: 100, y: 100, width: 120, height: 30 },
            { x: 300, y: 180, width: 100, height: 30 },
            { x: 150, y: 260, width: 100, height: 30 },
            { x: 350, y: 340, width: 100, height: 30 },
            { x: 150, y: 420, width: 100, height: 30 },
            { x: 350, y: 500, width: 150, height: 30 }
        ],
        hazards: [
            { x: 0, y: 100, width: 100, height: 500, type: 'spike' },
            { x: 500, y: 100, width: 100, height: 500, type: 'spike' },
            { x: 0, y: 600, width: 600, height: 50, type: 'void' }
        ],
        goal: { x: 400, y: 440, width: 50, height: 60 },
        spawn: { x: 130, y: 0 }
    },
    // Level 13 - Bouncy Castle
    {
        name: "TRAMPOLINE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 100, height: 40 },
            { x: 200, y: 350, width: 25, height: 250, isWall: true, isBouncy: true },
            { x: 400, y: 300, width: 25, height: 300, isWall: true, isBouncy: true },
            { x: 600, y: 250, width: 25, height: 350, isWall: true, isBouncy: true },
            { x: 750, y: 150, width: 150, height: 40 }
        ],
        hazards: [
            { x: 0, y: 620, width: 1000, height: 50, type: 'void' }
        ],
        goal: { x: 800, y: 90, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 14 - Speed Run
    {
        name: "RUSH HOUR",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 80, height: 30 },
            { x: 180, y: 500, width: 80, height: 30 },
            { x: 310, y: 500, width: 80, height: 30 },
            { x: 440, y: 500, width: 80, height: 30 },
            { x: 570, y: 500, width: 80, height: 30 },
            { x: 700, y: 500, width: 80, height: 30 },
            { x: 830, y: 500, width: 80, height: 30 },
            { x: 960, y: 500, width: 120, height: 30 }
        ],
        hazards: [
            { x: 130, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 260, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 390, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 520, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 650, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 780, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 910, y: 485, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 600, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1000, y: 440, width: 50, height: 60 },
        spawn: { x: 70, y: 400 }
    },
    // Level 15 - Mansion Maze
    {
        name: "LABYRINTH",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 55, height: 25 },
            { x: 200, y: 400, width: 30, height: 200, isWall: true },
            { x: 200, y: 400, width: 80, height: 25 },
            { x: 420, y: 250, width: 30, height: 200, isWall: true },
            { x: 420, y: 250, width: 80, height: 25 },
            { x: 640, y: 100, width: 30, height: 200, isWall: true },
            { x: 640, y: 100, width: 100, height: 25 }
        ],
        hazards: [
            { x: 130, y: 535, width: 70, height: 15, type: 'spike' },
            { x: 320, y: 385, width: 100, height: 15, type: 'spike' },
            { x: 540, y: 235, width: 100, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 900, height: 50, type: 'void' }
        ],
        goal: { x: 720, y: 40, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 16 - Island Hopping
    {
        name: "ARCHIPELAGO",
        theme: 'neon',
        platforms: [
            { x: 50, y: 400, width: 60, height: 25 },
            { x: 200, y: 380, width: 45, height: 25, moving: true, moveX: 100, speed: 3.5 },
            { x: 580, y: 340, width: 45, height: 25, moving: true, moveX: 100, speed: 4 },
            { x: 960, y: 300, width: 45, height: 25, moving: true, moveY: 80, speed: 3.5 },
            { x: 1120, y: 280, width: 80, height: 25 }
        ],
        hazards: [
            { x: 0, y: 500, width: 1300, height: 150, type: 'void' }
        ],
        goal: { x: 1140, y: 220, width: 50, height: 60 },
        spawn: { x: 60, y: 300 }
    },
    // Level 17 - Double Trouble
    {
        name: "TWIN TOWERS",
        theme: 'neon',
        platforms: [
            { x: 100, y: 550, width: 100, height: 25 },
            { x: 80, y: 320, width: 30, height: 260, isWall: true },
            { x: 180, y: 320, width: 30, height: 260, isWall: true },
            { x: 300, y: 280, width: 100, height: 25, moving: true, moveX: 140, speed: 4.5 },
            { x: 560, y: 240, width: 30, height: 220, isWall: true },
            { x: 660, y: 240, width: 30, height: 220, isWall: true },
            { x: 560, y: 240, width: 130, height: 25 },
            { x: 590, y: 100, width: 80, height: 25 }
        ],
        hazards: [
            { x: 210, y: 535, width: 90, height: 15, type: 'spike' },
            { x: 440, y: 265, width: 120, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 900, height: 50, type: 'void' }
        ],
        goal: { x: 600, y: 40, width: 50, height: 60 },
        spawn: { x: 130, y: 450 }
    },
    // Level 18 - Castle Climb
    {
        name: "DRAGON'S KEEP",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 80, height: 30 },
            { x: 250, y: 480, width: 70, height: 30, moving: true, moveY: 100, speed: 3 },
            { x: 480, y: 400, width: 70, height: 30 },
            { x: 380, y: 280, width: 30, height: 170, isWall: true },
            { x: 580, y: 220, width: 30, height: 230, isWall: true },
            { x: 380, y: 130, width: 230, height: 30 },
            { x: 700, y: 80, width: 120, height: 30 }
        ],
        hazards: [
            { x: 130, y: 535, width: 120, height: 15, type: 'spike' },
            { x: 350, y: 385, width: 130, height: 15, type: 'spike' },
            { x: 610, y: 115, width: 90, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 900, height: 50, type: 'void' }
        ],
        goal: { x: 740, y: 20, width: 50, height: 60 },
        spawn: { x: 70, y: 450 }
    },
    // Level 19 - Precision Required
    {
        name: "NEEDLE THREAD",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 50, height: 25 },
            { x: 200, y: 450, width: 35, height: 20 },
            { x: 340, y: 400, width: 35, height: 20 },
            { x: 480, y: 350, width: 35, height: 20 },
            { x: 620, y: 300, width: 35, height: 20 },
            { x: 760, y: 250, width: 35, height: 20 },
            { x: 900, y: 200, width: 35, height: 20 },
            { x: 1040, y: 150, width: 80, height: 25 }
        ],
        hazards: [
            { x: 110, y: 435, width: 90, height: 15, type: 'spike' },
            { x: 250, y: 385, width: 90, height: 15, type: 'spike' },
            { x: 390, y: 335, width: 90, height: 15, type: 'spike' },
            { x: 530, y: 285, width: 90, height: 15, type: 'spike' },
            { x: 670, y: 235, width: 90, height: 15, type: 'spike' },
            { x: 810, y: 185, width: 90, height: 15, type: 'spike' },
            { x: 950, y: 135, width: 90, height: 15, type: 'spike' },
            { x: 0, y: 600, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1060, y: 90, width: 50, height: 60 },
        spawn: { x: 55, y: 400 }
    },
    // Level 20 - Tropical Storm
    {
        name: "TSUNAMI",
        theme: 'neon',
        platforms: [
            { x: 50, y: 350, width: 60, height: 25 },
            { x: 200, y: 320, width: 50, height: 25, moving: true, moveY: 140, speed: 3.5 },
            { x: 380, y: 280, width: 50, height: 25, moving: true, moveY: 160, speed: 4 },
            { x: 560, y: 240, width: 50, height: 25, moving: true, moveY: 140, speed: 3.5 },
            { x: 740, y: 200, width: 50, height: 25, moving: true, moveY: 120, speed: 4.5 },
            { x: 920, y: 160, width: 50, height: 25, moving: true, moveY: 100, speed: 5 },
            { x: 1100, y: 120, width: 100, height: 25 }
        ],
        hazards: [
            { x: 110, y: 335, width: 90, height: 15, type: 'spike' },
            { x: 430, y: 265, width: 130, height: 15, type: 'spike' },
            { x: 790, y: 185, width: 130, height: 15, type: 'spike' },
            { x: 0, y: 500, width: 1300, height: 150, type: 'void' }
        ],
        goal: { x: 1120, y: 60, width: 50, height: 60 },
        spawn: { x: 60, y: 250 }
    },
    // Level 21 - The Gauntlet Returns
    {
        name: "INFERNO",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 80, height: 35 },
            { x: 180, y: 520, width: 60, height: 35 },
            { x: 290, y: 480, width: 60, height: 35 },
            { x: 400, y: 440, width: 60, height: 35 },
            { x: 510, y: 400, width: 60, height: 35 },
            { x: 620, y: 360, width: 60, height: 35 },
            { x: 730, y: 320, width: 60, height: 35 },
            { x: 840, y: 280, width: 60, height: 35 },
            { x: 950, y: 240, width: 100, height: 35 }
        ],
        hazards: [
            { x: 130, y: 505, width: 50, height: 15, type: 'spike' },
            { x: 240, y: 465, width: 50, height: 15, type: 'spike' },
            { x: 350, y: 425, width: 50, height: 15, type: 'spike' },
            { x: 460, y: 385, width: 50, height: 15, type: 'spike' },
            { x: 570, y: 345, width: 50, height: 15, type: 'spike' },
            { x: 680, y: 305, width: 50, height: 15, type: 'spike' },
            { x: 790, y: 265, width: 50, height: 15, type: 'spike' },
            { x: 900, y: 225, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 970, y: 180, width: 50, height: 60 },
        spawn: { x: 70, y: 450 }
    },
    // Level 22 - Wall Master
    {
        name: "ASCENSION",
        theme: 'neon',
        platforms: [
            { x: 100, y: 580, width: 100, height: 30 },
            { x: 50, y: 350, width: 30, height: 260, isWall: true, isBouncy: true },
            { x: 250, y: 400, width: 30, height: 210, isWall: true, isBouncy: true },
            { x: 50, y: 200, width: 30, height: 180, isWall: true, isBouncy: true },
            { x: 250, y: 150, width: 30, height: 280, isWall: true, isBouncy: true },
            { x: 100, y: 50, width: 200, height: 30 }
        ],
        hazards: [
            { x: 0, y: 640, width: 350, height: 50, type: 'void' }
        ],
        goal: { x: 170, y: 20, width: 50, height: 30 },
        spawn: { x: 130, y: 480 }
    },
    // Level 23 - Bouncy Madness
    {
        name: "PINBALL",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 80, height: 30 },
            { x: 180, y: 400, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 350, y: 300, width: 25, height: 300, isWall: true, isBouncy: true },
            { x: 520, y: 200, width: 25, height: 400, isWall: true, isBouncy: true },
            { x: 690, y: 150, width: 25, height: 450, isWall: true, isBouncy: true },
            { x: 860, y: 100, width: 25, height: 500, isWall: true, isBouncy: true },
            { x: 950, y: 50, width: 120, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 980, y: -10, width: 50, height: 60 },
        spawn: { x: 70, y: 450 }
    },
    // Level 24 - Castle Siege
    {
        name: "SIEGE WARFARE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 100, height: 40 },
            { x: 200, y: 500, width: 80, height: 40, moving: true, moveX: 100, speed: 2 },
            { x: 400, y: 450, width: 100, height: 40 },
            { x: 550, y: 400, width: 80, height: 40, moving: true, moveY: 80, speed: 1.5 },
            { x: 700, y: 350, width: 100, height: 40 },
            { x: 850, y: 300, width: 80, height: 40, moving: true, moveX: 80, speed: 2.5 },
            { x: 1000, y: 250, width: 120, height: 40 }
        ],
        hazards: [
            { x: 150, y: 535, width: 50, height: 15, type: 'spike' },
            { x: 350, y: 435, width: 50, height: 15, type: 'spike' },
            { x: 650, y: 335, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1030, y: 190, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 25 - Tropical Treehouse
    {
        name: "CANOPY",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 100, height: 30 },
            { x: 100, y: 350, width: 30, height: 180, isWall: true },
            { x: 200, y: 300, width: 150, height: 30 },
            { x: 400, y: 250, width: 30, height: 150, isWall: true },
            { x: 500, y: 200, width: 150, height: 30 },
            { x: 700, y: 150, width: 30, height: 150, isWall: true },
            { x: 800, y: 100, width: 150, height: 30 }
        ],
        hazards: [
            { x: 0, y: 580, width: 1000, height: 70, type: 'void' }
        ],
        goal: { x: 870, y: 40, width: 50, height: 60 },
        spawn: { x: 80, y: 400 }
    },
    // Level 26 - The Maze
    {
        name: "COMPLEX",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 100, height: 35 },
            { x: 200, y: 450, width: 30, height: 150, isWall: true },
            { x: 200, y: 450, width: 200, height: 35 },
            { x: 450, y: 350, width: 30, height: 150, isWall: true },
            { x: 300, y: 350, width: 180, height: 35 },
            { x: 550, y: 250, width: 200, height: 35 },
            { x: 800, y: 150, width: 30, height: 150, isWall: true },
            { x: 700, y: 150, width: 130, height: 35 },
            { x: 900, y: 80, width: 150, height: 35 }
        ],
        hazards: [
            { x: 0, y: 620, width: 1100, height: 50, type: 'void' }
        ],
        goal: { x: 950, y: 20, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 27 - Final Challenge
    {
        name: "ULTIMATE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 60, height: 30 },
            { x: 160, y: 500, width: 50, height: 30, moving: true, moveY: 80, speed: 2 },
            { x: 280, y: 350, width: 30, height: 200, isWall: true },
            { x: 380, y: 400, width: 30, height: 150, isWall: true },
            { x: 280, y: 200, width: 130, height: 30 },
            { x: 480, y: 150, width: 50, height: 30, moving: true, moveX: 100, speed: 3 },
            { x: 680, y: 100, width: 30, height: 200, isWall: true, isBouncy: true },
            { x: 780, y: 50, width: 150, height: 30 }
        ],
        hazards: [
            { x: 110, y: 535, width: 50, height: 15, type: 'spike' },
            { x: 310, y: 505, width: 70, height: 15, type: 'spike' },
            { x: 550, y: 135, width: 130, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1000, height: 50, type: 'void' }
        ],
        goal: { x: 830, y: -10, width: 50, height: 60 },
        spawn: { x: 60, y: 450 }
    },
    // Level 28 - Stairway
    {
        name: "SPIRAL",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 100, height: 30 },
            { x: 200, y: 500, width: 80, height: 30 },
            { x: 350, y: 450, width: 80, height: 30 },
            { x: 500, y: 400, width: 80, height: 30 },
            { x: 350, y: 350, width: 80, height: 30 },
            { x: 200, y: 300, width: 80, height: 30 },
            { x: 350, y: 250, width: 80, height: 30 },
            { x: 500, y: 200, width: 80, height: 30 },
            { x: 350, y: 150, width: 80, height: 30 },
            { x: 200, y: 100, width: 120, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 700, height: 50, type: 'void' }
        ],
        goal: { x: 230, y: 40, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 29 - The Bounce Challenge
    {
        name: "SPRING FEVER",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 80, height: 30 },
            { x: 180, y: 300, width: 25, height: 250, isWall: true, isBouncy: true },
            { x: 320, y: 400, width: 80, height: 30 },
            { x: 450, y: 250, width: 25, height: 300, isWall: true, isBouncy: true },
            { x: 580, y: 350, width: 80, height: 30 },
            { x: 710, y: 200, width: 25, height: 350, isWall: true, isBouncy: true },
            { x: 850, y: 100, width: 120, height: 30 }
        ],
        hazards: [
            { x: 0, y: 600, width: 1000, height: 50, type: 'void' }
        ],
        goal: { x: 880, y: 40, width: 50, height: 60 },
        spawn: { x: 70, y: 400 }
    },
    // Level 30 - Moving Madness
    {
        name: "CHAOS THEORY",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 100, height: 30 },
            { x: 200, y: 480, width: 80, height: 30, moving: true, moveX: 100, speed: 3.5 },
            { x: 400, y: 400, width: 80, height: 30, moving: true, moveY: 100, speed: 3 },
            { x: 550, y: 320, width: 80, height: 30, moving: true, moveX: 80, speed: 4 },
            { x: 700, y: 240, width: 80, height: 30, moving: true, moveY: 80, speed: 3.5 },
            { x: 850, y: 160, width: 80, height: 30, moving: true, moveX: 60, speed: 5 },
            { x: 980, y: 100, width: 100, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1000, y: 40, width: 50, height: 60 },
        spawn: { x: 80, y: 450 }
    },
    // Level 31 - Precision Platforming
    {
        name: "RAZOR'S EDGE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 50, height: 30 },
            { x: 150, y: 450, width: 35, height: 25 },
            { x: 240, y: 400, width: 35, height: 25 },
            { x: 330, y: 350, width: 35, height: 25 },
            { x: 420, y: 300, width: 35, height: 25 },
            { x: 510, y: 250, width: 35, height: 25 },
            { x: 600, y: 200, width: 35, height: 25 },
            { x: 690, y: 150, width: 35, height: 25 },
            { x: 780, y: 100, width: 100, height: 30 }
        ],
        hazards: [
            { x: 100, y: 485, width: 680, height: 15, type: 'spike' },
            { x: 0, y: 600, width: 1000, height: 50, type: 'void' }
        ],
        goal: { x: 800, y: 40, width: 50, height: 60 },
        spawn: { x: 55, y: 400 }
    },
    // Level 32 - Wall City
    {
        name: "VERTICAL LIMIT",
        theme: 'neon',
        platforms: [
            { x: 100, y: 580, width: 80, height: 30 },
            { x: 50, y: 350, width: 30, height: 260, isWall: true },
            { x: 150, y: 400, width: 30, height: 210, isWall: true },
            { x: 250, y: 250, width: 30, height: 200, isWall: true },
            { x: 350, y: 300, width: 30, height: 150, isWall: true },
            { x: 250, y: 100, width: 130, height: 30 },
            { x: 450, y: 150, width: 100, height: 30, moving: true, moveX: 100, speed: 4 },
            { x: 650, y: 80, width: 120, height: 30 }
        ],
        hazards: [
            { x: 80, y: 565, width: 40, height: 15, type: 'spike' },
            { x: 180, y: 565, width: 40, height: 15, type: 'spike' },
            { x: 380, y: 135, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 640, width: 800, height: 50, type: 'void' }
        ],
        goal: { x: 680, y: 20, width: 50, height: 60 },
        spawn: { x: 120, y: 480 }
    },
    // Level 33 - The Gauntlet II
    {
        name: "ENDURANCE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 400, width: 50, height: 25 },
            { x: 1100, y: 400, width: 80, height: 25 },
            { x: 0, y: 200, width: 1200, height: 25, isWall: true, isBouncy: true }
        ],
        hazards: [
            { x: 100, y: 485, width: 1050, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1400, height: 50, type: 'void' }
        ],
        goal: { x: 1120, y: 340, width: 50, height: 60 },
        spawn: { x: 65, y: 300 }
    },
    // Level 34 - Bounce and Move
    {
        name: "HYBRID",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 80, height: 30 },
            { x: 180, y: 350, width: 25, height: 250, isWall: true, isBouncy: true },
            { x: 280, y: 400, width: 80, height: 30, moving: true, moveY: 100, speed: 4 },
            { x: 450, y: 300, width: 25, height: 250, isWall: true, isBouncy: true },
            { x: 550, y: 250, width: 80, height: 30, moving: true, moveX: 80, speed: 5 },
            { x: 750, y: 150, width: 120, height: 30 }
        ],
        hazards: [
            { x: 0, y: 620, width: 900, height: 50, type: 'void' }
        ],
        goal: { x: 780, y: 90, width: 50, height: 60 },
        spawn: { x: 70, y: 450 }
    },
    // Level 35 - The Drop
    {
        name: "FREEFALL",
        theme: 'neon',
        platforms: [
            { x: 400, y: 50, width: 100, height: 30 },
            { x: 550, y: 150, width: 80, height: 30 },
            { x: 400, y: 250, width: 80, height: 30 },
            { x: 250, y: 350, width: 80, height: 30 },
            { x: 400, y: 450, width: 80, height: 30 },
            { x: 550, y: 550, width: 120, height: 30 }
        ],
        hazards: [
            { x: 200, y: 50, width: 50, height: 530, type: 'spike' },
            { x: 650, y: 50, width: 50, height: 530, type: 'spike' },
            { x: 0, y: 620, width: 800, height: 50, type: 'void' }
        ],
        goal: { x: 580, y: 490, width: 50, height: 60 },
        spawn: { x: 420, y: -50 }
    },
    // Level 36 - Triple Threat
    {
        name: "TRIFECTA",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 80, height: 30 },
            { x: 180, y: 450, width: 30, height: 130, isWall: true },
            { x: 280, y: 450, width: 30, height: 130, isWall: true },
            { x: 180, y: 350, width: 80, height: 30, moving: true, moveX: 50, speed: 4 },
            { x: 380, y: 300, width: 30, height: 150, isWall: true, isBouncy: true },
            { x: 480, y: 250, width: 80, height: 30 },
            { x: 600, y: 200, width: 80, height: 30, moving: true, moveY: 60, speed: 5 },
            { x: 750, y: 150, width: 120, height: 30 }
        ],
        hazards: [
            { x: 310, y: 535, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 900, height: 50, type: 'void' }
        ],
        goal: { x: 780, y: 90, width: 50, height: 60 },
        spawn: { x: 70, y: 450 }
    },
    // Level 37 - The Final Test (EXTREME)
    {
        name: "APEX NIGHTMARE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 40, height: 25 },
            { x: 130, y: 520, width: 80, height: 25, moving: true, moveY: 100, speed: 4 },
            { x: 220, y: 450, width: 25, height: 180, isWall: true, isBouncy: true },
            { x: 320, y: 500, width: 25, height: 130, isWall: true, isBouncy: true },
            { x: 220, y: 320, width: 35, height: 20 },
            { x: 350, y: 270, width: 80, height: 25, moving: true, moveX: 120, speed: 4.5 },
            { x: 520, y: 220, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 620, y: 280, width: 25, height: 140, isWall: true, isBouncy: true },
            { x: 520, y: 120, width: 35, height: 20 },
            { x: 650, y: 80, width: 80, height: 25, moving: true, moveY: 80, speed: 5 },
            { x: 780, y: 50, width: 25, height: 150, isWall: true, isBouncy: true },
            { x: 880, y: 100, width: 25, height: 100, isWall: true, isBouncy: true },
            { x: 780, y: -30, width: 35, height: 20 },
            { x: 900, y: -80, width: 80, height: 25, moving: true, moveX: 80, speed: 5.5 },
            { x: 1050, y: -120, width: 60, height: 25 }
        ],
        hazards: [
            { x: 90, y: 565, width: 40, height: 15, type: 'spike' },
            { x: 170, y: 565, width: 50, height: 15, type: 'spike' },
            { x: 255, y: 435, width: 65, height: 15, type: 'spike' },
            { x: 255, y: 305, width: 95, height: 15, type: 'spike' },
            { x: 470, y: 255, width: 50, height: 15, type: 'spike' },
            { x: 555, y: 205, width: 65, height: 15, type: 'spike' },
            { x: 555, y: 105, width: 95, height: 15, type: 'spike' },
            { x: 690, y: 65, width: 90, height: 15, type: 'spike' },
            { x: 815, y: 35, width: 65, height: 15, type: 'spike' },
            { x: 815, y: -45, width: 85, height: 15, type: 'spike' },
            { x: 980, y: -95, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1060, y: -180, width: 50, height: 60 },
        spawn: { x: 55, y: 480 }
    },
    // Level 38 - Beyond the Apex
    {
        name: "OBLIVION",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 35, height: 20 },
            { x: 120, y: 520, width: 70, height: 20, moving: true, moveY: 120, speed: 5 },
            { x: 240, y: 420, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 340, y: 480, width: 25, height: 150, isWall: true, isBouncy: true },
            { x: 240, y: 280, width: 30, height: 20 },
            { x: 380, y: 220, width: 70, height: 20, moving: true, moveX: 140, speed: 5.5 },
            { x: 580, y: 160, width: 25, height: 220, isWall: true, isBouncy: true },
            { x: 680, y: 220, width: 25, height: 160, isWall: true, isBouncy: true },
            { x: 580, y: 60, width: 30, height: 20 },
            { x: 720, y: 0, width: 70, height: 20, moving: true, moveY: 100, speed: 6 },
            { x: 850, y: -60, width: 25, height: 180, isWall: true, isBouncy: true },
            { x: 950, y: -20, width: 25, height: 140, isWall: true, isBouncy: true },
            { x: 850, y: -140, width: 30, height: 20 },
            { x: 1000, y: -200, width: 60, height: 25 }
        ],
        hazards: [
            { x: 85, y: 565, width: 35, height: 15, type: 'spike' },
            { x: 190, y: 565, width: 50, height: 15, type: 'spike' },
            { x: 275, y: 405, width: 65, height: 15, type: 'spike' },
            { x: 275, y: 265, width: 105, height: 15, type: 'spike' },
            { x: 520, y: 205, width: 60, height: 15, type: 'spike' },
            { x: 615, y: 145, width: 65, height: 15, type: 'spike' },
            { x: 615, y: 45, width: 105, height: 15, type: 'spike' },
            { x: 790, y: -15, width: 60, height: 15, type: 'spike' },
            { x: 885, y: -75, width: 65, height: 15, type: 'spike' },
            { x: 885, y: -155, width: 115, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1010, y: -260, width: 50, height: 60 },
        spawn: { x: 55, y: 480 }
    },
    // Level 39 - Speed Demon
    {
        name: "VELOCITY X",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 30, height: 20 },
            { x: 150, y: 480, width: 60, height: 20, moving: true, moveX: 100, speed: 7 },
            { x: 320, y: 450, width: 60, height: 20, moving: true, moveY: 80, speed: 7 },
            { x: 450, y: 400, width: 60, height: 20, moving: true, moveX: 90, speed: 8 },
            { x: 600, y: 350, width: 60, height: 20, moving: true, moveY: 70, speed: 8 },
            { x: 730, y: 300, width: 60, height: 20, moving: true, moveX: 80, speed: 9 },
            { x: 880, y: 250, width: 80, height: 25 }
        ],
        hazards: [
            { x: 80, y: 485, width: 70, height: 15, type: 'spike' },
            { x: 250, y: 435, width: 70, height: 15, type: 'spike' },
            { x: 380, y: 385, width: 70, height: 15, type: 'spike' },
            { x: 530, y: 335, width: 70, height: 15, type: 'spike' },
            { x: 660, y: 285, width: 70, height: 15, type: 'spike' },
            { x: 810, y: 235, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 600, width: 1100, height: 50, type: 'void' }
        ],
        goal: { x: 900, y: 190, width: 50, height: 60 },
        spawn: { x: 55, y: 400 }
    },
    // Level 40 - The Gauntlet III
    {
        name: "PURGATORY",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 30, height: 20 },
            { x: 130, y: 500, width: 25, height: 20 },
            { x: 200, y: 450, width: 25, height: 20 },
            { x: 270, y: 400, width: 25, height: 20 },
            { x: 340, y: 350, width: 25, height: 20 },
            { x: 410, y: 300, width: 25, height: 20 },
            { x: 480, y: 250, width: 25, height: 20 },
            { x: 550, y: 200, width: 25, height: 20 },
            { x: 620, y: 150, width: 25, height: 20 },
            { x: 690, y: 100, width: 80, height: 25 }
        ],
        hazards: [
            { x: 80, y: 535, width: 50, height: 15, type: 'spike' },
            { x: 155, y: 485, width: 45, height: 15, type: 'spike' },
            { x: 225, y: 435, width: 45, height: 15, type: 'spike' },
            { x: 295, y: 385, width: 45, height: 15, type: 'spike' },
            { x: 365, y: 335, width: 45, height: 15, type: 'spike' },
            { x: 435, y: 285, width: 45, height: 15, type: 'spike' },
            { x: 505, y: 235, width: 45, height: 15, type: 'spike' },
            { x: 575, y: 185, width: 45, height: 15, type: 'spike' },
            { x: 645, y: 135, width: 45, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 900, height: 50, type: 'void' }
        ],
        goal: { x: 710, y: 40, width: 50, height: 60 },
        spawn: { x: 55, y: 450 }
    },
    // Level 41 - Bouncy Hell
    {
        name: "RICOCHET",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 30, height: 20 },
            { x: 130, y: 350, width: 25, height: 280, isWall: true, isBouncy: true },
            { x: 250, y: 400, width: 25, height: 230, isWall: true, isBouncy: true },
            { x: 370, y: 300, width: 25, height: 330, isWall: true, isBouncy: true },
            { x: 490, y: 250, width: 25, height: 380, isWall: true, isBouncy: true },
            { x: 610, y: 200, width: 25, height: 430, isWall: true, isBouncy: true },
            { x: 730, y: 150, width: 25, height: 480, isWall: true, isBouncy: true },
            { x: 850, y: 80, width: 100, height: 25 }
        ],
        hazards: [
            { x: 155, y: 565, width: 95, height: 15, type: 'spike' },
            { x: 275, y: 565, width: 95, height: 15, type: 'spike' },
            { x: 395, y: 565, width: 95, height: 15, type: 'spike' },
            { x: 515, y: 565, width: 95, height: 15, type: 'spike' },
            { x: 635, y: 565, width: 95, height: 15, type: 'spike' },
            { x: 755, y: 565, width: 95, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1000, height: 50, type: 'void' }
        ],
        goal: { x: 870, y: 20, width: 50, height: 60 },
        spawn: { x: 55, y: 480 }
    },
    // Level 42 - The Climb
    {
        name: "EVEREST",
        theme: 'neon',
        platforms: [
            { x: 100, y: 580, width: 30, height: 20 },
            { x: 50, y: 450, width: 25, height: 160, isWall: true },
            { x: 150, y: 500, width: 25, height: 110, isWall: true },
            { x: 50, y: 350, width: 60, height: 20 },
            { x: 150, y: 280, width: 60, height: 20, moving: true, moveX: 80, speed: 5 },
            { x: 50, y: 200, width: 25, height: 110, isWall: true },
            { x: 150, y: 150, width: 25, height: 160, isWall: true },
            { x: 50, y: 50, width: 60, height: 20 },
            { x: 150, y: -20, width: 60, height: 20, moving: true, moveX: 80, speed: 6 },
            { x: 280, y: -100, width: 80, height: 25 }
        ],
        hazards: [
            { x: 75, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 110, y: 335, width: 40, height: 15, type: 'spike' },
            { x: 110, y: 35, width: 40, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 400, height: 50, type: 'void' }
        ],
        goal: { x: 300, y: -160, width: 50, height: 60 },
        spawn: { x: 105, y: 480 }
    },
    // Level 43 - Chaos
    {
        name: "ENTROPY",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 30, height: 20 },
            { x: 130, y: 500, width: 50, height: 20, moving: true, moveY: 100, speed: 6 },
            { x: 250, y: 400, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 350, y: 350, width: 50, height: 20, moving: true, moveX: 100, speed: 7 },
            { x: 520, y: 280, width: 25, height: 220, isWall: true, isBouncy: true },
            { x: 620, y: 230, width: 50, height: 20, moving: true, moveY: 80, speed: 8 },
            { x: 750, y: 160, width: 25, height: 180, isWall: true, isBouncy: true },
            { x: 850, y: 100, width: 50, height: 20, moving: true, moveX: 70, speed: 9 },
            { x: 1000, y: 50, width: 80, height: 25 }
        ],
        hazards: [
            { x: 80, y: 535, width: 50, height: 15, type: 'spike' },
            { x: 180, y: 485, width: 70, height: 15, type: 'spike' },
            { x: 275, y: 385, width: 75, height: 15, type: 'spike' },
            { x: 450, y: 335, width: 70, height: 15, type: 'spike' },
            { x: 545, y: 265, width: 75, height: 15, type: 'spike' },
            { x: 670, y: 215, width: 80, height: 15, type: 'spike' },
            { x: 775, y: 145, width: 75, height: 15, type: 'spike' },
            { x: 920, y: 85, width: 80, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1150, height: 50, type: 'void' }
        ],
        goal: { x: 1020, y: -10, width: 50, height: 60 },
        spawn: { x: 55, y: 450 }
    },
    // Level 44 - Precision Master
    {
        name: "SURGEON",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 25, height: 20 },
            { x: 150, y: 460, width: 20, height: 15 },
            { x: 240, y: 420, width: 20, height: 15 },
            { x: 330, y: 380, width: 20, height: 15 },
            { x: 420, y: 340, width: 20, height: 15 },
            { x: 510, y: 300, width: 20, height: 15 },
            { x: 600, y: 260, width: 20, height: 15 },
            { x: 690, y: 220, width: 20, height: 15 },
            { x: 780, y: 180, width: 20, height: 15 },
            { x: 870, y: 140, width: 20, height: 15 },
            { x: 960, y: 100, width: 70, height: 25 }
        ],
        hazards: [
            { x: 75, y: 485, width: 75, height: 15, type: 'spike' },
            { x: 170, y: 445, width: 70, height: 15, type: 'spike' },
            { x: 260, y: 405, width: 70, height: 15, type: 'spike' },
            { x: 350, y: 365, width: 70, height: 15, type: 'spike' },
            { x: 440, y: 325, width: 70, height: 15, type: 'spike' },
            { x: 530, y: 285, width: 70, height: 15, type: 'spike' },
            { x: 620, y: 245, width: 70, height: 15, type: 'spike' },
            { x: 710, y: 205, width: 70, height: 15, type: 'spike' },
            { x: 800, y: 165, width: 70, height: 15, type: 'spike' },
            { x: 890, y: 125, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 580, width: 1100, height: 70, type: 'void' }
        ],
        goal: { x: 975, y: 40, width: 50, height: 60 },
        spawn: { x: 52, y: 400 }
    },
    // Level 45 - Wall Madness
    {
        name: "LABYRINTH II",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 30, height: 20 },
            { x: 120, y: 400, width: 25, height: 210, isWall: true },
            { x: 200, y: 450, width: 25, height: 160, isWall: true },
            { x: 120, y: 250, width: 110, height: 20 },
            { x: 280, y: 200, width: 25, height: 180, isWall: true, isBouncy: true },
            { x: 360, y: 250, width: 25, height: 130, isWall: true, isBouncy: true },
            { x: 280, y: 80, width: 110, height: 20 },
            { x: 440, y: 30, width: 25, height: 180, isWall: true },
            { x: 520, y: 80, width: 25, height: 130, isWall: true },
            { x: 440, y: -80, width: 110, height: 20 },
            { x: 600, y: -150, width: 80, height: 25 }
        ],
        hazards: [
            { x: 80, y: 565, width: 40, height: 15, type: 'spike' },
            { x: 145, y: 565, width: 55, height: 15, type: 'spike' },
            { x: 230, y: 235, width: 50, height: 15, type: 'spike' },
            { x: 305, y: 365, width: 55, height: 15, type: 'spike' },
            { x: 390, y: 65, width: 50, height: 15, type: 'spike' },
            { x: 465, y: 195, width: 55, height: 15, type: 'spike' },
            { x: 550, y: -95, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 700, height: 50, type: 'void' }
        ],
        goal: { x: 620, y: -210, width: 50, height: 60 },
        spawn: { x: 55, y: 480 }
    },
    // Level 46 - Speed Run II
    {
        name: "HYPERDRIVE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 450, width: 25, height: 20 },
            { x: 150, y: 420, width: 50, height: 20, moving: true, moveX: 120, speed: 8 },
            { x: 350, y: 380, width: 50, height: 20, moving: true, moveY: 100, speed: 9 },
            { x: 500, y: 330, width: 50, height: 20, moving: true, moveX: 100, speed: 10 },
            { x: 700, y: 280, width: 50, height: 20, moving: true, moveY: 80, speed: 10 },
            { x: 850, y: 230, width: 50, height: 20, moving: true, moveX: 80, speed: 11 },
            { x: 1000, y: 180, width: 70, height: 25 }
        ],
        hazards: [
            { x: 75, y: 435, width: 75, height: 15, type: 'spike' },
            { x: 270, y: 365, width: 80, height: 15, type: 'spike' },
            { x: 430, y: 315, width: 70, height: 15, type: 'spike' },
            { x: 620, y: 265, width: 80, height: 15, type: 'spike' },
            { x: 780, y: 215, width: 70, height: 15, type: 'spike' },
            { x: 930, y: 165, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 550, width: 1150, height: 100, type: 'void' }
        ],
        goal: { x: 1015, y: 120, width: 50, height: 60 },
        spawn: { x: 52, y: 350 }
    },
    // Level 47 - The Pit II
    {
        name: "ABYSS",
        theme: 'neon',
        platforms: [
            { x: 300, y: 50, width: 80, height: 25 },
            { x: 450, y: 130, width: 50, height: 20, moving: true, moveX: 80, speed: 6 },
            { x: 300, y: 220, width: 50, height: 20 },
            { x: 150, y: 310, width: 50, height: 20, moving: true, moveX: 80, speed: 7 },
            { x: 300, y: 400, width: 50, height: 20 },
            { x: 450, y: 490, width: 50, height: 20, moving: true, moveX: 80, speed: 8 },
            { x: 300, y: 580, width: 80, height: 25 }
        ],
        hazards: [
            { x: 100, y: 50, width: 50, height: 560, type: 'spike' },
            { x: 550, y: 50, width: 50, height: 560, type: 'spike' },
            { x: 0, y: 650, width: 700, height: 50, type: 'void' }
        ],
        goal: { x: 320, y: 520, width: 50, height: 60 },
        spawn: { x: 320, y: -50 }
    },
    // Level 48 - Combo Master
    {
        name: "SYNTHESIS",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 30, height: 20 },
            { x: 130, y: 520, width: 50, height: 20, moving: true, moveY: 80, speed: 5 },
            { x: 230, y: 400, width: 25, height: 180, isWall: true, isBouncy: true },
            { x: 310, y: 350, width: 50, height: 20, moving: true, moveX: 80, speed: 6 },
            { x: 450, y: 280, width: 25, height: 150, isWall: true },
            { x: 530, y: 330, width: 25, height: 100, isWall: true },
            { x: 450, y: 180, width: 50, height: 20 },
            { x: 570, y: 120, width: 50, height: 20, moving: true, moveY: 60, speed: 7 },
            { x: 680, y: 60, width: 25, height: 140, isWall: true, isBouncy: true },
            { x: 760, y: 0, width: 50, height: 20, moving: true, moveX: 60, speed: 8 },
            { x: 900, y: -60, width: 70, height: 25 }
        ],
        hazards: [
            { x: 80, y: 565, width: 50, height: 15, type: 'spike' },
            { x: 180, y: 505, width: 50, height: 15, type: 'spike' },
            { x: 255, y: 385, width: 55, height: 15, type: 'spike' },
            { x: 390, y: 335, width: 60, height: 15, type: 'spike' },
            { x: 475, y: 265, width: 55, height: 15, type: 'spike' },
            { x: 500, y: 165, width: 70, height: 15, type: 'spike' },
            { x: 620, y: 105, width: 60, height: 15, type: 'spike' },
            { x: 705, y: 45, width: 55, height: 15, type: 'spike' },
            { x: 830, y: -15, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1050, height: 50, type: 'void' }
        ],
        goal: { x: 915, y: -120, width: 50, height: 60 },
        spawn: { x: 55, y: 480 }
    },
    // Level 49 - Tiny Platforms
    {
        name: "MICROSCOPE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 500, width: 20, height: 15 },
            { x: 130, y: 460, width: 18, height: 15 },
            { x: 210, y: 420, width: 18, height: 15 },
            { x: 290, y: 380, width: 18, height: 15 },
            { x: 370, y: 340, width: 18, height: 15 },
            { x: 450, y: 300, width: 18, height: 15 },
            { x: 530, y: 260, width: 18, height: 15 },
            { x: 610, y: 220, width: 18, height: 15 },
            { x: 690, y: 180, width: 18, height: 15 },
            { x: 770, y: 140, width: 18, height: 15 },
            { x: 850, y: 100, width: 18, height: 15 },
            { x: 930, y: 60, width: 60, height: 25 }
        ],
        hazards: [
            { x: 70, y: 485, width: 60, height: 15, type: 'spike' },
            { x: 148, y: 445, width: 62, height: 15, type: 'spike' },
            { x: 228, y: 405, width: 62, height: 15, type: 'spike' },
            { x: 308, y: 365, width: 62, height: 15, type: 'spike' },
            { x: 388, y: 325, width: 62, height: 15, type: 'spike' },
            { x: 468, y: 285, width: 62, height: 15, type: 'spike' },
            { x: 548, y: 245, width: 62, height: 15, type: 'spike' },
            { x: 628, y: 205, width: 62, height: 15, type: 'spike' },
            { x: 708, y: 165, width: 62, height: 15, type: 'spike' },
            { x: 788, y: 125, width: 62, height: 15, type: 'spike' },
            { x: 868, y: 85, width: 62, height: 15, type: 'spike' },
            { x: 0, y: 580, width: 1050, height: 70, type: 'void' }
        ],
        goal: { x: 945, y: 0, width: 50, height: 60 },
        spawn: { x: 50, y: 400 }
    },
    // Level 50 - Ultimate Bounce
    {
        name: "TRAMPOLINE HELL",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 25, height: 20 },
            { x: 120, y: 350, width: 25, height: 280, isWall: true, isBouncy: true },
            { x: 220, y: 400, width: 25, height: 230, isWall: true, isBouncy: true },
            { x: 320, y: 300, width: 25, height: 330, isWall: true, isBouncy: true },
            { x: 420, y: 250, width: 25, height: 380, isWall: true, isBouncy: true },
            { x: 520, y: 200, width: 25, height: 430, isWall: true, isBouncy: true },
            { x: 620, y: 150, width: 25, height: 480, isWall: true, isBouncy: true },
            { x: 720, y: 100, width: 25, height: 530, isWall: true, isBouncy: true },
            { x: 820, y: 50, width: 25, height: 580, isWall: true, isBouncy: true },
            { x: 920, y: 0, width: 80, height: 25 }
        ],
        hazards: [
            { x: 145, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 245, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 345, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 445, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 545, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 645, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 745, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 845, y: 565, width: 75, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1050, height: 50, type: 'void' }
        ],
        goal: { x: 935, y: -60, width: 50, height: 60 },
        spawn: { x: 55, y: 480 }
    },
    // Level 51 - Insanity
    {
        name: "DELIRIUM",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 25, height: 20 },
            { x: 120, y: 480, width: 40, height: 20, moving: true, moveY: 100, speed: 8 },
            { x: 220, y: 380, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 300, y: 420, width: 25, height: 160, isWall: true, isBouncy: true },
            { x: 220, y: 250, width: 25, height: 20 },
            { x: 350, y: 200, width: 40, height: 20, moving: true, moveX: 100, speed: 9 },
            { x: 500, y: 140, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 580, y: 180, width: 25, height: 160, isWall: true, isBouncy: true },
            { x: 500, y: 40, width: 25, height: 20 },
            { x: 630, y: -20, width: 40, height: 20, moving: true, moveY: 80, speed: 10 },
            { x: 750, y: -100, width: 25, height: 180, isWall: true, isBouncy: true },
            { x: 830, y: -60, width: 25, height: 140, isWall: true, isBouncy: true },
            { x: 750, y: -180, width: 25, height: 20 },
            { x: 880, y: -240, width: 60, height: 25 }
        ],
        hazards: [
            { x: 75, y: 535, width: 45, height: 15, type: 'spike' },
            { x: 160, y: 465, width: 60, height: 15, type: 'spike' },
            { x: 245, y: 365, width: 55, height: 15, type: 'spike' },
            { x: 245, y: 235, width: 105, height: 15, type: 'spike' },
            { x: 450, y: 185, width: 50, height: 15, type: 'spike' },
            { x: 525, y: 125, width: 55, height: 15, type: 'spike' },
            { x: 525, y: 25, width: 105, height: 15, type: 'spike' },
            { x: 680, y: -35, width: 70, height: 15, type: 'spike' },
            { x: 775, y: -115, width: 55, height: 15, type: 'spike' },
            { x: 775, y: -195, width: 105, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1000, height: 50, type: 'void' }
        ],
        goal: { x: 895, y: -300, width: 50, height: 60 },
        spawn: { x: 55, y: 450 }
    },
    // Level 52 - The Wall
    {
        name: "FORTRESS",
        theme: 'neon',
        platforms: [
            { x: 100, y: 580, width: 25, height: 20 },
            { x: 50, y: 380, width: 25, height: 230, isWall: true },
            { x: 130, y: 430, width: 25, height: 180, isWall: true },
            { x: 50, y: 250, width: 80, height: 20 },
            { x: 180, y: 180, width: 25, height: 150, isWall: true, isBouncy: true },
            { x: 260, y: 230, width: 25, height: 100, isWall: true, isBouncy: true },
            { x: 180, y: 80, width: 80, height: 20 },
            { x: 340, y: 30, width: 25, height: 130, isWall: true },
            { x: 420, y: 80, width: 25, height: 80, isWall: true },
            { x: 340, y: -50, width: 80, height: 20 },
            { x: 480, y: -120, width: 25, height: 150, isWall: true, isBouncy: true },
            { x: 560, y: -70, width: 25, height: 100, isWall: true, isBouncy: true },
            { x: 480, y: -200, width: 120, height: 25 }
        ],
        hazards: [
            { x: 75, y: 565, width: 55, height: 15, type: 'spike' },
            { x: 130, y: 235, width: 50, height: 15, type: 'spike' },
            { x: 205, y: 315, width: 55, height: 15, type: 'spike' },
            { x: 260, y: 65, width: 80, height: 15, type: 'spike' },
            { x: 365, y: 165, width: 55, height: 15, type: 'spike' },
            { x: 420, y: -65, width: 60, height: 15, type: 'spike' },
            { x: 505, y: 15, width: 55, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 650, height: 50, type: 'void' }
        ],
        goal: { x: 510, y: -260, width: 50, height: 60 },
        spawn: { x: 105, y: 480 }
    },
    // Level 53 - Nightmare Mode
    {
        name: "TORMENT",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 20, height: 15 },
            { x: 110, y: 520, width: 35, height: 15, moving: true, moveY: 100, speed: 9 },
            { x: 200, y: 420, width: 20, height: 200, isWall: true, isBouncy: true },
            { x: 280, y: 470, width: 20, height: 150, isWall: true, isBouncy: true },
            { x: 200, y: 300, width: 20, height: 15 },
            { x: 320, y: 250, width: 35, height: 15, moving: true, moveX: 100, speed: 10 },
            { x: 470, y: 180, width: 20, height: 180, isWall: true, isBouncy: true },
            { x: 550, y: 230, width: 20, height: 130, isWall: true, isBouncy: true },
            { x: 470, y: 80, width: 20, height: 15 },
            { x: 590, y: 30, width: 35, height: 15, moving: true, moveY: 80, speed: 11 },
            { x: 700, y: -40, width: 20, height: 150, isWall: true, isBouncy: true },
            { x: 780, y: 10, width: 20, height: 100, isWall: true, isBouncy: true },
            { x: 700, y: -120, width: 20, height: 15 },
            { x: 820, y: -180, width: 35, height: 15, moving: true, moveX: 70, speed: 12 },
            { x: 960, y: -250, width: 50, height: 20 }
        ],
        hazards: [
            { x: 70, y: 565, width: 40, height: 15, type: 'spike' },
            { x: 145, y: 505, width: 55, height: 15, type: 'spike' },
            { x: 220, y: 405, width: 60, height: 15, type: 'spike' },
            { x: 220, y: 285, width: 100, height: 15, type: 'spike' },
            { x: 420, y: 235, width: 50, height: 15, type: 'spike' },
            { x: 490, y: 165, width: 60, height: 15, type: 'spike' },
            { x: 490, y: 65, width: 100, height: 15, type: 'spike' },
            { x: 640, y: 15, width: 60, height: 15, type: 'spike' },
            { x: 720, y: -55, width: 60, height: 15, type: 'spike' },
            { x: 720, y: -135, width: 100, height: 15, type: 'spike' },
            { x: 890, y: -195, width: 70, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1100, height: 50, type: 'void' }
        ],
        goal: { x: 970, y: -310, width: 50, height: 60 },
        spawn: { x: 52, y: 480 }
    },
    // Level 54 - The Final Final Test
    {
        name: "ABSOLUTE ZERO",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 18, height: 15 },
            { x: 100, y: 520, width: 30, height: 15, moving: true, moveY: 120, speed: 10 },
            { x: 180, y: 400, width: 18, height: 220, isWall: true, isBouncy: true },
            { x: 260, y: 460, width: 18, height: 160, isWall: true, isBouncy: true },
            { x: 180, y: 260, width: 18, height: 15 },
            { x: 300, y: 200, width: 30, height: 15, moving: true, moveX: 120, speed: 11 },
            { x: 470, y: 120, width: 18, height: 200, isWall: true, isBouncy: true },
            { x: 550, y: 180, width: 18, height: 140, isWall: true, isBouncy: true },
            { x: 470, y: 20, width: 18, height: 15 },
            { x: 590, y: -40, width: 30, height: 15, moving: true, moveY: 100, speed: 12 },
            { x: 720, y: -120, width: 18, height: 180, isWall: true, isBouncy: true },
            { x: 800, y: -60, width: 18, height: 120, isWall: true, isBouncy: true },
            { x: 720, y: -200, width: 18, height: 15 },
            { x: 840, y: -260, width: 30, height: 15, moving: true, moveX: 100, speed: 13 },
            { x: 1000, y: -340, width: 18, height: 160, isWall: true, isBouncy: true },
            { x: 1080, y: -280, width: 18, height: 100, isWall: true, isBouncy: true },
            { x: 1000, y: -400, width: 18, height: 15 },
            { x: 1120, y: -460, width: 50, height: 20 }
        ],
        hazards: [
            { x: 68, y: 565, width: 32, height: 15, type: 'spike' },
            { x: 130, y: 505, width: 50, height: 15, type: 'spike' },
            { x: 198, y: 385, width: 62, height: 15, type: 'spike' },
            { x: 198, y: 245, width: 102, height: 15, type: 'spike' },
            { x: 420, y: 185, width: 50, height: 15, type: 'spike' },
            { x: 488, y: 105, width: 62, height: 15, type: 'spike' },
            { x: 488, y: 5, width: 102, height: 15, type: 'spike' },
            { x: 640, y: -55, width: 80, height: 15, type: 'spike' },
            { x: 738, y: -135, width: 62, height: 15, type: 'spike' },
            { x: 738, y: -215, width: 102, height: 15, type: 'spike' },
            { x: 940, y: -275, width: 60, height: 15, type: 'spike' },
            { x: 1018, y: -355, width: 62, height: 15, type: 'spike' },
            { x: 1018, y: -415, width: 102, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1250, height: 50, type: 'void' }
        ],
        goal: { x: 1130, y: -520, width: 50, height: 60 },
        spawn: { x: 52, y: 480 }
    },
    // Level 55
    {
        name: "FROZEN WASTE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 80, height: 25 },
            { x: 180, y: 480, width: 35, height: 25, moving: true, moveY: 80, speed: 6 },
            { x: 320, y: 400, width: 25, height: 200, isWall: true, isBouncy: true },
            { x: 420, y: 450, width: 25, height: 150, isWall: true, isBouncy: true },
            { x: 320, y: 280, width: 60, height: 25 },
            { x: 480, y: 220, width: 35, height: 25, moving: true, moveX: 80, speed: 7 },
            { x: 650, y: 150, width: 25, height: 180, isWall: true, isBouncy: true },
            { x: 750, y: 200, width: 25, height: 130, isWall: true, isBouncy: true },
            { x: 650, y: 50, width: 60, height: 25 },
            { x: 800, y: 0, width: 35, height: 25, moving: true, moveY: 60, speed: 8 },
            { x: 950, y: -50, width: 100, height: 30 }
        ],
        hazards: [
            { x: 250, y: 465, width: 70, height: 15, type: 'spike' },
            { x: 370, y: 385, width: 50, height: 15, type: 'spike' },
            { x: 370, y: 265, width: 80, height: 15, type: 'spike' },
            { x: 550, y: 205, width: 60, height: 15, type: 'spike' },
            { x: 700, y: 135, width: 50, height: 15, type: 'spike' },
            { x: 700, y: 35, width: 60, height: 15, type: 'spike' },
            { x: 870, y: -15, width: 80, height: 15, type: 'spike' },
            { x: 950, y: -65, width: 50, height: 15, type: 'spike' },
            { x: 1000, y: -65, width: 50, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 1100, height: 50, type: 'void' }
        ],
        goal: { x: 970, y: -110, width: 50, height: 60 },
        spawn: { x: 70, y: 450 }
    },
    // Level 56
    {
        name: "DARK MATTER",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 40, height: 15, moving: true, moveX: 60, speed: 2 },
            { x: 180, y: 450, width: 17, height: 15, moving: true, moveY: 50, speed: 2.5 },
            { x: 310, y: 350, width: 17, height: 15, moving: true, moveX: 40, speed: 3 },
            { x: 440, y: 250, width: 17, height: 15, moving: true, moveY: 60, speed: 2 },
            { x: 570, y: 150, width: 17, height: 15, moving: true, moveX: 50, speed: 2.5 },
            { x: 700, y: 50, width: 17, height: 15, moving: true, moveY: 40, speed: 3 },
            { x: 830, y: -50, width: 17, height: 15, moving: true, moveX: 45, speed: 2 },
            { x: 960, y: -150, width: 17, height: 15, moving: true, moveY: 55, speed: 2.5 },
            { x: 1090, y: -250, width: 50, height: 20, moving: true, moveX: 70, speed: 2, isGoalPlatform: true }
        ],
        hazards: [
            { x: 0, y: 620, width: 1200, height: 50, type: 'void' }
        ],
        goal: { x: 1100, y: -310, width: 50, height: 60 },
        spawn: { x: 52, y: 450 }
    },
    // Level 57
    {
        name: "NEUTRON STAR",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 32, height: 15 },
            { x: 110, y: 500, width: 40, height: 15, moving: true, moveY: 140, speed: 5 },
            { x: 200, y: 380, width: 35, height: 240, isWall: true, isBouncy: true },
            { x: 290, y: 440, width: 35, height: 180, isWall: true, isBouncy: true },
            { x: 200, y: 220, width: 32, height: 15 },
            { x: 340, y: 150, width: 40, height: 15, moving: true, moveX: 140, speed: 6 },
            { x: 540, y: 60, width: 35, height: 220, isWall: true, isBouncy: true },
            { x: 630, y: 120, width: 35, height: 160, isWall: true, isBouncy: true },
            { x: 540, y: -60, width: 32, height: 15 },
            { x: 680, y: -130, width: 90, height: 20 }
        ],
        hazards: [
            { x: 169, y: 485, width: 64, height: 15, type: 'spike' },
            { x: 249, y: 365, width: 74, height: 15, type: 'spike' },
            { x: 249, y: 205, width: 124, height: 15, type: 'spike' },
            { x: 513, y: 135, width: 60, height: 15, type: 'spike' },
            { x: 589, y: 45, width: 74, height: 15, type: 'spike' },
            { x: 589, y: -75, width: 124, height: 15, type: 'spike' },
            { x: 0, y: 650, width: 800, height: 50, type: 'void' }
        ],
        goal: { x: 690, y: -190, width: 50, height: 60 },
        spawn: { x: 52, y: 480 }
    },
    // Level 58
    {
        name: "BLACK HOLE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 35, height: 15, moving: true, moveX: 40, speed: 2 },
            { x: 150, y: 465, width: 16, height: 15, moving: true, moveY: 35, speed: 2.5 },
            { x: 250, y: 380, width: 16, height: 15, moving: true, moveX: 45, speed: 3 },
            { x: 350, y: 295, width: 16, height: 15, moving: true, moveY: 40, speed: 2 },
            { x: 450, y: 210, width: 16, height: 15, moving: true, moveX: 35, speed: 2.5 },
            { x: 550, y: 125, width: 16, height: 15, moving: true, moveY: 45, speed: 3 },
            { x: 650, y: 40, width: 16, height: 15, moving: true, moveX: 40, speed: 2 },
            { x: 750, y: -45, width: 16, height: 15, moving: true, moveY: 35, speed: 2.5 },
            { x: 850, y: -130, width: 16, height: 15, moving: true, moveX: 45, speed: 3 },
            { x: 950, y: -215, width: 45, height: 20, moving: true, moveX: 50, speed: 2, isGoalPlatform: true }
        ],
        hazards: [
            { x: 96, y: 535, width: 49, height: 15, type: 'spike' },
            { x: 196, y: 450, width: 49, height: 15, type: 'spike' },
            { x: 296, y: 365, width: 49, height: 15, type: 'spike' },
            { x: 396, y: 280, width: 49, height: 15, type: 'spike' },
            { x: 496, y: 195, width: 49, height: 15, type: 'spike' },
            { x: 596, y: 110, width: 49, height: 15, type: 'spike' },
            { x: 696, y: 25, width: 49, height: 15, type: 'spike' },
            { x: 796, y: -60, width: 49, height: 15, type: 'spike' },
            { x: 896, y: -145, width: 49, height: 15, type: 'spike' },
            { x: 0, y: 620, width: 1100, height: 50, type: 'void' }
        ],
        goal: { x: 960, y: -275, width: 50, height: 60 },
        spawn: { x: 52, y: 450 }
    },
    // Level 59
    {
        name: "SUPERNOVA",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 45, height: 14 },
            { x: 105, y: 490, width: 40, height: 14, moving: true, moveY: 150, speed: 5 },
            { x: 190, y: 360, width: 25, height: 250, isWall: true, isBouncy: true },
            { x: 280, y: 420, width: 25, height: 190, isWall: true, isBouncy: true },
            { x: 190, y: 190, width: 25, height: 14 },
            { x: 330, y: 120, width: 40, height: 14, moving: true, moveX: 150, speed: 6 },
            { x: 540, y: 20, width: 25, height: 230, isWall: true, isBouncy: true },
            { x: 630, y: 80, width: 25, height: 170, isWall: true, isBouncy: true },
            { x: 540, y: -110, width: 25, height: 14 },
            { x: 680, y: -190, width: 42, height: 18 }
        ],
        hazards: [
            { x: 145, y: 476, width: 60, height: 14, type: 'spike' },
            { x: 220, y: 346, width: 75, height: 14, type: 'spike' },
            { x: 220, y: 176, width: 125, height: 14, type: 'spike' },
            { x: 495, y: 106, width: 60, height: 14, type: 'spike' },
            { x: 570, y: 6, width: 75, height: 14, type: 'spike' },
            { x: 570, y: -124, width: 125, height: 14, type: 'spike' },
            { x: 0, y: 650, width: 800, height: 50, type: 'void' }
        ],
        goal: { x: 690, y: -250, width: 50, height: 60 },
        spawn: { x: 52, y: 480 }
    },
    // Level 60
    {
        name: "QUANTUM LEAP",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 15, height: 14 },
            { x: 285, y: 450, width: 15, height: 14 },
            { x: 520, y: 350, width: 15, height: 14 },
            { x: 755, y: 250, width: 15, height: 14 },
            { x: 990, y: 150, width: 15, height: 14 },
            { x: 1225, y: 50, width: 15, height: 14 },
            { x: 1460, y: -50, width: 15, height: 14 },
            { x: 1695, y: -150, width: 15, height: 14 },
            { x: 1930, y: -250, width: 15, height: 14 },
            { x: 2165, y: -350, width: 40, height: 18 }
        ],
        hazards: [
            { x: 50, y: -540, width: 2155, height: 14, type: 'spike' },
            { x: 85, y: 536, width: 50, height: 14, type: 'spike' },
            { x: 320, y: 436, width: 50, height: 14, type: 'spike' },
            { x: 555, y: 336, width: 50, height: 14, type: 'spike' },
            { x: 790, y: 236, width: 50, height: 14, type: 'spike' },
            { x: 1025, y: 136, width: 50, height: 14, type: 'spike' },
            { x: 1260, y: 36, width: 50, height: 14, type: 'spike' },
            { x: 1495, y: -64, width: 50, height: 14, type: 'spike' },
            { x: 1730, y: -164, width: 50, height: 14, type: 'spike' },
            { x: 1965, y: -264, width: 50, height: 14, type: 'spike' },
            { x: 0, y: 620, width: 2300, height: 50, type: 'void' }
        ],
        goal: { x: 2175, y: -410, width: 50, height: 60 },
        spawn: { x: 52, y: 450 }
    },
    // Level 61-100 continuing with increasing difficulty
    // Level 61
    {
        name: "WARP DRIVE",
        theme: 'neon',
        platforms: [
            { x: 50, y: 580, width: 19, height: 14 },
            { x: 100, y: 500, width: 31, height: 14, moving: true, moveY: 160, speed: 5 },
            { x: 180, y: 350, width: 19, height: 260, isWall: true, isBouncy: true },
            { x: 270, y: 410, width: 19, height: 200, isWall: true, isBouncy: true },
            { x: 180, y: 170, width: 19, height: 14 },
            { x: 320, y: 100, width: 31, height: 14, moving: true, moveX: 160, speed: 6 },
            { x: 540, y: -10, width: 19, height: 240, isWall: true, isBouncy: true },
            { x: 630, y: 50, width: 19, height: 180, isWall: true, isBouncy: true },
            { x: 540, y: -150, width: 19, height: 14 },
            { x: 680, y: -230, width: 45, height: 18 }
        ],
        hazards: [
            { x: 141, y: 486, width: 56, height: 14, type: 'spike' },
            { x: 211, y: 336, width: 76, height: 14, type: 'spike' },
            { x: 211, y: 156, width: 126, height: 14, type: 'spike' },
            { x: 497, y: 86, width: 60, height: 14, type: 'spike' },
            { x: 571, y: -24, width: 76, height: 14, type: 'spike' },
            { x: 571, y: -164, width: 126, height: 14, type: 'spike' },
            { x: 17, y: 600, width: 50, height: 14, type: 'spike' },
            { x: 86, y: 600, width: 731, height: 14, type: 'spike' },
            { x: 0, y: 650, width: 800, height: 50, type: 'void' }
        ],
        goal: { x: 690, y: -290, width: 50, height: 60 },
        spawn: { x: 52, y: 480 }
    },
    // Level 62
    {
        name: "SINGULARITY",
        theme: 'neon',
        platforms: [
            { x: 50, y: 550, width: 9, height: 14 },
            { x: 105, y: 475, width: 9, height: 14 },
            { x: 160, y: 400, width: 9, height: 14 },
            { x: 215, y: 325, width: 9, height: 14 },
            { x: 270, y: 250, width: 9, height: 14 },
            { x: 325, y: 175, width: 9, height: 14 },
            { x: 380, y: 100, width: 9, height: 14 },
            { x: 435, y: 25, width: 9, height: 14 },
            { x: 490, y: -50, width: 9, height: 14 },
            { x: 545, y: -125, width: 33, height: 18 }
        ],
        hazards: [
            { x: 0, y: 620, width: 650, height: 50, type: 'void' }
        ],
        goal: { x: 555, y: -185, width: 50, height: 60 },
        spawn: { x: 52, y: 450 }
    },
    // Levels 63-100 with progressive difficulty
    { name: "VOID WALKER", theme: 'neon', platforms: [{ x: 50, y: 580, width: 14, height: 14 },{ x: 95, y: 490, width: 23, height: 14, moving: true, moveY: 170, speed: 7.5 },{ x: 175, y: 340, width: 14, height: 270, isWall: true, isBouncy: true },{ x: 265, y: 400, width: 14, height: 210, isWall: true, isBouncy: true },{ x: 175, y: 150, width: 14, height: 14 },{ x: 315, y: 80, width: 23, height: 14, moving: true, moveX: 170, speed: 8 },{ x: 545, y: -30, width: 14, height: 250, isWall: true, isBouncy: true },{ x: 635, y: 30, width: 14, height: 190, isWall: true, isBouncy: true },{ x: 545, y: -180, width: 14, height: 14 },{ x: 685, y: -260, width: 38, height: 18 }], hazards: [{ x: 118, y: 476, width: 57, height: 14, type: 'spike' },{ x: 189, y: 326, width: 76, height: 14, type: 'spike' },{ x: 189, y: 136, width: 126, height: 14, type: 'spike' },{ x: 485, y: 66, width: 60, height: 14, type: 'spike' },{ x: 559, y: -44, width: 76, height: 14, type: 'spike' },{ x: 559, y: -194, width: 126, height: 14, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 695, y: -320, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "DEATH SPIRAL", theme: 'neon', platforms: [{ x: 50, y: 550, width: 13, height: 13 },{ x: 100, y: 470, width: 13, height: 13 },{ x: 150, y: 390, width: 13, height: 13 },{ x: 200, y: 310, width: 13, height: 13 },{ x: 250, y: 230, width: 13, height: 13 },{ x: 300, y: 150, width: 13, height: 13 },{ x: 350, y: 70, width: 13, height: 13 },{ x: 400, y: -10, width: 13, height: 13 },{ x: 450, y: -90, width: 13, height: 13 },{ x: 500, y: -170, width: 36, height: 18 }], hazards: [{ x: 63, y: 537, width: 37, height: 13, type: 'spike' },{ x: 113, y: 457, width: 37, height: 13, type: 'spike' },{ x: 163, y: 377, width: 37, height: 13, type: 'spike' },{ x: 213, y: 297, width: 37, height: 13, type: 'spike' },{ x: 263, y: 217, width: 37, height: 13, type: 'spike' },{ x: 313, y: 137, width: 37, height: 13, type: 'spike' },{ x: 363, y: 57, width: 37, height: 13, type: 'spike' },{ x: 413, y: -23, width: 37, height: 13, type: 'spike' },{ x: 463, y: -103, width: 37, height: 13, type: 'spike' },{ x: 0, y: 620, width: 600, height: 50, type: 'void' }], goal: { x: 510, y: -230, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "HELLFIRE", theme: 'neon', platforms: [{ x: 50, y: 580, width: 13, height: 13 },{ x: 90, y: 480, width: 22, height: 13, moving: true, moveY: 180, speed: 16 },{ x: 170, y: 320, width: 13, height: 280, isWall: true, isBouncy: true },{ x: 260, y: 380, width: 13, height: 220, isWall: true, isBouncy: true },{ x: 170, y: 120, width: 13, height: 13 },{ x: 310, y: 50, width: 22, height: 13, moving: true, moveX: 180, speed: 17 },{ x: 550, y: -60, width: 13, height: 260, isWall: true, isBouncy: true },{ x: 640, y: 0, width: 13, height: 200, isWall: true, isBouncy: true },{ x: 550, y: -220, width: 13, height: 13 },{ x: 690, y: -300, width: 36, height: 18 }], hazards: [{ x: 63, y: 567, width: 27, height: 13, type: 'spike' },{ x: 112, y: 467, width: 58, height: 13, type: 'spike' },{ x: 183, y: 307, width: 77, height: 13, type: 'spike' },{ x: 183, y: 107, width: 127, height: 13, type: 'spike' },{ x: 490, y: 37, width: 60, height: 13, type: 'spike' },{ x: 563, y: -73, width: 77, height: 13, type: 'spike' },{ x: 563, y: -233, width: 127, height: 13, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 700, y: -360, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "DEMON'S GATE", theme: 'neon', platforms: [{ x: 50, y: 550, width: 13, height: 13 },{ x: 95, y: 465, width: 13, height: 13 },{ x: 140, y: 380, width: 13, height: 13 },{ x: 185, y: 295, width: 13, height: 13 },{ x: 230, y: 210, width: 13, height: 13 },{ x: 275, y: 125, width: 13, height: 13 },{ x: 320, y: 40, width: 13, height: 13 },{ x: 365, y: -45, width: 13, height: 13 },{ x: 410, y: -130, width: 13, height: 13 },{ x: 455, y: -215, width: 34, height: 18 }], hazards: [{ x: 63, y: 537, width: 32, height: 13, type: 'spike' },{ x: 108, y: 452, width: 32, height: 13, type: 'spike' },{ x: 153, y: 367, width: 32, height: 13, type: 'spike' },{ x: 198, y: 282, width: 32, height: 13, type: 'spike' },{ x: 243, y: 197, width: 32, height: 13, type: 'spike' },{ x: 288, y: 112, width: 32, height: 13, type: 'spike' },{ x: 333, y: 27, width: 32, height: 13, type: 'spike' },{ x: 378, y: -58, width: 32, height: 13, type: 'spike' },{ x: 423, y: -143, width: 32, height: 13, type: 'spike' },{ x: 0, y: 620, width: 550, height: 50, type: 'void' }], goal: { x: 465, y: -275, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "INFERNAL", theme: 'neon', platforms: [{ x: 50, y: 580, width: 12, height: 12 },{ x: 85, y: 470, width: 21, height: 12, moving: true, moveY: 190, speed: 17 },{ x: 165, y: 300, width: 12, height: 290, isWall: true, isBouncy: true },{ x: 255, y: 360, width: 12, height: 230, isWall: true, isBouncy: true },{ x: 165, y: 90, width: 12, height: 12 },{ x: 305, y: 20, width: 21, height: 12, moving: true, moveX: 190, speed: 18 },{ x: 555, y: -100, width: 12, height: 270, isWall: true, isBouncy: true },{ x: 645, y: -40, width: 12, height: 210, isWall: true, isBouncy: true },{ x: 555, y: -270, width: 12, height: 12 },{ x: 695, y: -350, width: 34, height: 18 }], hazards: [{ x: 62, y: 568, width: 23, height: 12, type: 'spike' },{ x: 106, y: 458, width: 59, height: 12, type: 'spike' },{ x: 177, y: 288, width: 78, height: 12, type: 'spike' },{ x: 177, y: 78, width: 128, height: 12, type: 'spike' },{ x: 495, y: 8, width: 60, height: 12, type: 'spike' },{ x: 567, y: -112, width: 78, height: 12, type: 'spike' },{ x: 567, y: -282, width: 128, height: 12, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 705, y: -410, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "CHAOS REALM", theme: 'neon', platforms: [{ x: 50, y: 550, width: 12, height: 12 },{ x: 90, y: 460, width: 12, height: 12 },{ x: 130, y: 370, width: 12, height: 12 },{ x: 170, y: 280, width: 12, height: 12 },{ x: 210, y: 190, width: 12, height: 12 },{ x: 250, y: 100, width: 12, height: 12 },{ x: 290, y: 10, width: 12, height: 12 },{ x: 330, y: -80, width: 12, height: 12 },{ x: 370, y: -170, width: 12, height: 12 },{ x: 410, y: -260, width: 32, height: 18 }], hazards: [{ x: 62, y: 538, width: 28, height: 12, type: 'spike' },{ x: 102, y: 448, width: 28, height: 12, type: 'spike' },{ x: 142, y: 358, width: 28, height: 12, type: 'spike' },{ x: 182, y: 268, width: 28, height: 12, type: 'spike' },{ x: 222, y: 178, width: 28, height: 12, type: 'spike' },{ x: 262, y: 88, width: 28, height: 12, type: 'spike' },{ x: 302, y: -2, width: 28, height: 12, type: 'spike' },{ x: 342, y: -92, width: 28, height: 12, type: 'spike' },{ x: 382, y: -182, width: 28, height: 12, type: 'spike' },{ x: 0, y: 620, width: 500, height: 50, type: 'void' }], goal: { x: 420, y: -320, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "PERDITION", theme: 'neon', platforms: [{ x: 50, y: 580, width: 12, height: 12 },{ x: 80, y: 460, width: 20, height: 12, moving: true, moveY: 200, speed: 18 },{ x: 160, y: 280, width: 12, height: 300, isWall: true, isBouncy: true },{ x: 250, y: 340, width: 12, height: 240, isWall: true, isBouncy: true },{ x: 160, y: 60, width: 12, height: 12 },{ x: 300, y: -10, width: 20, height: 12, moving: true, moveX: 200, speed: 19 },{ x: 560, y: -140, width: 12, height: 280, isWall: true, isBouncy: true },{ x: 650, y: -80, width: 12, height: 220, isWall: true, isBouncy: true },{ x: 560, y: -320, width: 12, height: 12 },{ x: 700, y: -400, width: 32, height: 18 }], hazards: [{ x: 62, y: 568, width: 18, height: 12, type: 'spike' },{ x: 100, y: 448, width: 60, height: 12, type: 'spike' },{ x: 172, y: 268, width: 78, height: 12, type: 'spike' },{ x: 172, y: 48, width: 128, height: 12, type: 'spike' },{ x: 500, y: -22, width: 60, height: 12, type: 'spike' },{ x: 572, y: -152, width: 78, height: 12, type: 'spike' },{ x: 572, y: -332, width: 128, height: 12, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 710, y: -460, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "DAMNATION", theme: 'neon', platforms: [{ x: 50, y: 550, width: 11, height: 11 },{ x: 85, y: 455, width: 11, height: 11 },{ x: 120, y: 360, width: 11, height: 11 },{ x: 155, y: 265, width: 11, height: 11 },{ x: 190, y: 170, width: 11, height: 11 },{ x: 225, y: 75, width: 11, height: 11 },{ x: 260, y: -20, width: 11, height: 11 },{ x: 295, y: -115, width: 11, height: 11 },{ x: 330, y: -210, width: 11, height: 11 },{ x: 365, y: -305, width: 30, height: 18 }], hazards: [{ x: 61, y: 539, width: 24, height: 11, type: 'spike' },{ x: 96, y: 444, width: 24, height: 11, type: 'spike' },{ x: 131, y: 349, width: 24, height: 11, type: 'spike' },{ x: 166, y: 254, width: 24, height: 11, type: 'spike' },{ x: 201, y: 159, width: 24, height: 11, type: 'spike' },{ x: 236, y: 64, width: 24, height: 11, type: 'spike' },{ x: 271, y: -31, width: 24, height: 11, type: 'spike' },{ x: 306, y: -126, width: 24, height: 11, type: 'spike' },{ x: 341, y: -221, width: 24, height: 11, type: 'spike' },{ x: 0, y: 620, width: 450, height: 50, type: 'void' }], goal: { x: 375, y: -365, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "ETERNAL VOID", theme: 'neon', platforms: [{ x: 50, y: 580, width: 11, height: 11 },{ x: 75, y: 450, width: 19, height: 11, moving: true, moveY: 210, speed: 19 },{ x: 155, y: 260, width: 11, height: 310, isWall: true, isBouncy: true },{ x: 245, y: 320, width: 11, height: 250, isWall: true, isBouncy: true },{ x: 155, y: 30, width: 11, height: 11 },{ x: 295, y: -40, width: 19, height: 11, moving: true, moveX: 210, speed: 20 },{ x: 565, y: -180, width: 11, height: 290, isWall: true, isBouncy: true },{ x: 655, y: -120, width: 11, height: 230, isWall: true, isBouncy: true },{ x: 565, y: -370, width: 11, height: 11 },{ x: 705, y: -450, width: 30, height: 18 }], hazards: [{ x: 61, y: 569, width: 14, height: 11, type: 'spike' },{ x: 94, y: 439, width: 61, height: 11, type: 'spike' },{ x: 166, y: 249, width: 79, height: 11, type: 'spike' },{ x: 166, y: 19, width: 129, height: 11, type: 'spike' },{ x: 505, y: -51, width: 60, height: 11, type: 'spike' },{ x: 576, y: -191, width: 79, height: 11, type: 'spike' },{ x: 576, y: -381, width: 129, height: 11, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 715, y: -510, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "OMEGA", theme: 'neon', platforms: [{ x: 50, y: 550, width: 11, height: 11 },{ x: 80, y: 450, width: 11, height: 11 },{ x: 110, y: 350, width: 11, height: 11 },{ x: 140, y: 250, width: 11, height: 11 },{ x: 170, y: 150, width: 11, height: 11 },{ x: 200, y: 50, width: 11, height: 11 },{ x: 230, y: -50, width: 11, height: 11 },{ x: 260, y: -150, width: 11, height: 11 },{ x: 290, y: -250, width: 11, height: 11 },{ x: 320, y: -350, width: 28, height: 18 }], hazards: [{ x: 61, y: 539, width: 19, height: 11, type: 'spike' },{ x: 91, y: 439, width: 19, height: 11, type: 'spike' },{ x: 121, y: 339, width: 19, height: 11, type: 'spike' },{ x: 151, y: 239, width: 19, height: 11, type: 'spike' },{ x: 181, y: 139, width: 19, height: 11, type: 'spike' },{ x: 211, y: 39, width: 19, height: 11, type: 'spike' },{ x: 241, y: -61, width: 19, height: 11, type: 'spike' },{ x: 271, y: -161, width: 19, height: 11, type: 'spike' },{ x: 301, y: -261, width: 19, height: 11, type: 'spike' },{ x: 0, y: 620, width: 400, height: 50, type: 'void' }], goal: { x: 330, y: -410, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "TERMINUS", theme: 'neon', platforms: [{ x: 50, y: 580, width: 10, height: 10 },{ x: 70, y: 440, width: 18, height: 10, moving: true, moveY: 220, speed: 20 },{ x: 150, y: 240, width: 10, height: 320, isWall: true, isBouncy: true },{ x: 240, y: 300, width: 10, height: 260, isWall: true, isBouncy: true },{ x: 150, y: 0, width: 10, height: 10 },{ x: 290, y: -70, width: 18, height: 10, moving: true, moveX: 220, speed: 21 },{ x: 570, y: -220, width: 10, height: 300, isWall: true, isBouncy: true },{ x: 660, y: -160, width: 10, height: 240, isWall: true, isBouncy: true },{ x: 570, y: -420, width: 10, height: 10 },{ x: 710, y: -500, width: 28, height: 18 }], hazards: [{ x: 60, y: 570, width: 10, height: 10, type: 'spike' },{ x: 88, y: 430, width: 62, height: 10, type: 'spike' },{ x: 160, y: 230, width: 80, height: 10, type: 'spike' },{ x: 160, y: -10, width: 130, height: 10, type: 'spike' },{ x: 510, y: -80, width: 60, height: 10, type: 'spike' },{ x: 580, y: -230, width: 80, height: 10, type: 'spike' },{ x: 580, y: -430, width: 130, height: 10, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 720, y: -560, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "RAGNAROK", theme: 'neon', platforms: [{ x: 50, y: 550, width: 10, height: 10 },{ x: 75, y: 445, width: 10, height: 10 },{ x: 100, y: 340, width: 10, height: 10 },{ x: 125, y: 235, width: 10, height: 10 },{ x: 150, y: 130, width: 10, height: 10 },{ x: 175, y: 25, width: 10, height: 10 },{ x: 200, y: -80, width: 10, height: 10 },{ x: 225, y: -185, width: 10, height: 10 },{ x: 250, y: -290, width: 10, height: 10 },{ x: 275, y: -395, width: 26, height: 18 }], hazards: [{ x: 60, y: 540, width: 15, height: 10, type: 'spike' },{ x: 85, y: 435, width: 15, height: 10, type: 'spike' },{ x: 110, y: 330, width: 15, height: 10, type: 'spike' },{ x: 135, y: 225, width: 15, height: 10, type: 'spike' },{ x: 160, y: 120, width: 15, height: 10, type: 'spike' },{ x: 185, y: 15, width: 15, height: 10, type: 'spike' },{ x: 210, y: -90, width: 15, height: 10, type: 'spike' },{ x: 235, y: -195, width: 15, height: 10, type: 'spike' },{ x: 260, y: -300, width: 15, height: 10, type: 'spike' },{ x: 0, y: 620, width: 350, height: 50, type: 'void' }], goal: { x: 285, y: -455, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "APOCALYPSE", theme: 'neon', platforms: [{ x: 50, y: 580, width: 10, height: 10 },{ x: 65, y: 430, width: 17, height: 10, moving: true, moveY: 230, speed: 21 },{ x: 145, y: 220, width: 10, height: 330, isWall: true, isBouncy: true },{ x: 235, y: 280, width: 10, height: 270, isWall: true, isBouncy: true },{ x: 145, y: -30, width: 10, height: 10 },{ x: 285, y: -100, width: 17, height: 10, moving: true, moveX: 230, speed: 22 },{ x: 575, y: -260, width: 10, height: 310, isWall: true, isBouncy: true },{ x: 665, y: -200, width: 10, height: 250, isWall: true, isBouncy: true },{ x: 575, y: -470, width: 10, height: 10 },{ x: 715, y: -550, width: 26, height: 18 }], hazards: [{ x: 60, y: 570, width: 5, height: 10, type: 'spike' },{ x: 82, y: 420, width: 63, height: 10, type: 'spike' },{ x: 155, y: 210, width: 80, height: 10, type: 'spike' },{ x: 155, y: -40, width: 130, height: 10, type: 'spike' },{ x: 515, y: -110, width: 60, height: 10, type: 'spike' },{ x: 585, y: -270, width: 80, height: 10, type: 'spike' },{ x: 585, y: -480, width: 130, height: 10, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 725, y: -610, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "ARMAGEDDON", theme: 'neon', platforms: [{ x: 50, y: 550, width: 10, height: 10 },{ x: 70, y: 440, width: 10, height: 10 },{ x: 90, y: 330, width: 10, height: 10 },{ x: 110, y: 220, width: 10, height: 10 },{ x: 130, y: 110, width: 10, height: 10 },{ x: 150, y: 0, width: 10, height: 10 },{ x: 170, y: -110, width: 10, height: 10 },{ x: 190, y: -220, width: 10, height: 10 },{ x: 210, y: -330, width: 10, height: 10 },{ x: 230, y: -440, width: 24, height: 18 }], hazards: [{ x: 60, y: 540, width: 10, height: 10, type: 'spike' },{ x: 80, y: 430, width: 10, height: 10, type: 'spike' },{ x: 100, y: 320, width: 10, height: 10, type: 'spike' },{ x: 120, y: 210, width: 10, height: 10, type: 'spike' },{ x: 140, y: 100, width: 10, height: 10, type: 'spike' },{ x: 160, y: -10, width: 10, height: 10, type: 'spike' },{ x: 180, y: -120, width: 10, height: 10, type: 'spike' },{ x: 200, y: -230, width: 10, height: 10, type: 'spike' },{ x: 220, y: -340, width: 10, height: 10, type: 'spike' },{ x: 0, y: 620, width: 300, height: 50, type: 'void' }], goal: { x: 240, y: -500, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "EXTINCTION", theme: 'neon', platforms: [{ x: 50, y: 580, width: 9, height: 9 },{ x: 60, y: 420, width: 16, height: 9, moving: true, moveY: 240, speed: 22 },{ x: 140, y: 200, width: 9, height: 340, isWall: true, isBouncy: true },{ x: 230, y: 260, width: 9, height: 280, isWall: true, isBouncy: true },{ x: 140, y: -60, width: 9, height: 9 },{ x: 280, y: -130, width: 16, height: 9, moving: true, moveX: 240, speed: 23 },{ x: 580, y: -300, width: 9, height: 320, isWall: true, isBouncy: true },{ x: 670, y: -240, width: 9, height: 260, isWall: true, isBouncy: true },{ x: 580, y: -520, width: 9, height: 9 },{ x: 720, y: -600, width: 24, height: 18 }], hazards: [{ x: 59, y: 571, width: 1, height: 9, type: 'spike' },{ x: 76, y: 411, width: 64, height: 9, type: 'spike' },{ x: 149, y: 191, width: 81, height: 9, type: 'spike' },{ x: 149, y: -69, width: 131, height: 9, type: 'spike' },{ x: 520, y: -139, width: 60, height: 9, type: 'spike' },{ x: 589, y: -309, width: 81, height: 9, type: 'spike' },{ x: 589, y: -529, width: 131, height: 9, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 730, y: -660, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "CATACLYSM", theme: 'neon', platforms: [{ x: 50, y: 550, width: 9, height: 9 },{ x: 65, y: 435, width: 9, height: 9 },{ x: 80, y: 320, width: 9, height: 9 },{ x: 95, y: 205, width: 9, height: 9 },{ x: 110, y: 90, width: 9, height: 9 },{ x: 125, y: -25, width: 9, height: 9 },{ x: 140, y: -140, width: 9, height: 9 },{ x: 155, y: -255, width: 9, height: 9 },{ x: 170, y: -370, width: 9, height: 9 },{ x: 185, y: -485, width: 22, height: 18 }], hazards: [{ x: 59, y: 541, width: 6, height: 9, type: 'spike' },{ x: 74, y: 426, width: 6, height: 9, type: 'spike' },{ x: 89, y: 311, width: 6, height: 9, type: 'spike' },{ x: 104, y: 196, width: 6, height: 9, type: 'spike' },{ x: 119, y: 81, width: 6, height: 9, type: 'spike' },{ x: 134, y: -34, width: 6, height: 9, type: 'spike' },{ x: 149, y: -149, width: 6, height: 9, type: 'spike' },{ x: 164, y: -264, width: 6, height: 9, type: 'spike' },{ x: 179, y: -379, width: 6, height: 9, type: 'spike' },{ x: 0, y: 620, width: 250, height: 50, type: 'void' }], goal: { x: 195, y: -545, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "OBLIVION II", theme: 'neon', platforms: [{ x: 50, y: 580, width: 9, height: 9 },{ x: 55, y: 410, width: 15, height: 9, moving: true, moveY: 250, speed: 23 },{ x: 135, y: 180, width: 9, height: 350, isWall: true, isBouncy: true },{ x: 225, y: 240, width: 9, height: 290, isWall: true, isBouncy: true },{ x: 135, y: -90, width: 9, height: 9 },{ x: 275, y: -160, width: 15, height: 9, moving: true, moveX: 250, speed: 24 },{ x: 585, y: -340, width: 9, height: 330, isWall: true, isBouncy: true },{ x: 675, y: -280, width: 9, height: 270, isWall: true, isBouncy: true },{ x: 585, y: -570, width: 9, height: 9 },{ x: 725, y: -650, width: 22, height: 18 }], hazards: [{ x: 70, y: 401, width: 65, height: 9, type: 'spike' },{ x: 144, y: 171, width: 81, height: 9, type: 'spike' },{ x: 144, y: -99, width: 131, height: 9, type: 'spike' },{ x: 525, y: -169, width: 60, height: 9, type: 'spike' },{ x: 594, y: -349, width: 81, height: 9, type: 'spike' },{ x: 594, y: -579, width: 131, height: 9, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 735, y: -710, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "ANNIHILATION", theme: 'neon', platforms: [{ x: 50, y: 550, width: 9, height: 9 },{ x: 60, y: 430, width: 9, height: 9 },{ x: 70, y: 310, width: 9, height: 9 },{ x: 80, y: 190, width: 9, height: 9 },{ x: 90, y: 70, width: 9, height: 9 },{ x: 100, y: -50, width: 9, height: 9 },{ x: 110, y: -170, width: 9, height: 9 },{ x: 120, y: -290, width: 9, height: 9 },{ x: 130, y: -410, width: 9, height: 9 },{ x: 140, y: -530, width: 20, height: 18 }], hazards: [{ x: 59, y: 541, width: 1, height: 9, type: 'spike' },{ x: 69, y: 421, width: 1, height: 9, type: 'spike' },{ x: 79, y: 301, width: 1, height: 9, type: 'spike' },{ x: 89, y: 181, width: 1, height: 9, type: 'spike' },{ x: 99, y: 61, width: 1, height: 9, type: 'spike' },{ x: 109, y: -59, width: 1, height: 9, type: 'spike' },{ x: 119, y: -179, width: 1, height: 9, type: 'spike' },{ x: 129, y: -299, width: 1, height: 9, type: 'spike' },{ x: 139, y: -419, width: 1, height: 9, type: 'spike' },{ x: 0, y: 620, width: 200, height: 50, type: 'void' }], goal: { x: 150, y: -590, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "THE END", theme: 'neon', platforms: [{ x: 50, y: 580, width: 8, height: 8 },{ x: 50, y: 400, width: 14, height: 8, moving: true, moveY: 260, speed: 24 },{ x: 130, y: 160, width: 8, height: 360, isWall: true, isBouncy: true },{ x: 220, y: 220, width: 8, height: 300, isWall: true, isBouncy: true },{ x: 130, y: -120, width: 8, height: 8 },{ x: 270, y: -190, width: 14, height: 8, moving: true, moveX: 260, speed: 25 },{ x: 590, y: -380, width: 8, height: 340, isWall: true, isBouncy: true },{ x: 680, y: -320, width: 8, height: 280, isWall: true, isBouncy: true },{ x: 590, y: -620, width: 8, height: 8 },{ x: 730, y: -700, width: 20, height: 18 }], hazards: [{ x: 64, y: 391, width: 66, height: 8, type: 'spike' },{ x: 138, y: 152, width: 82, height: 8, type: 'spike' },{ x: 138, y: -128, width: 132, height: 8, type: 'spike' },{ x: 530, y: -198, width: 60, height: 8, type: 'spike' },{ x: 598, y: -388, width: 82, height: 8, type: 'spike' },{ x: 598, y: -628, width: 132, height: 8, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 740, y: -760, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "BEYOND", theme: 'neon', platforms: [{ x: 50, y: 550, width: 8, height: 8 },{ x: 55, y: 425, width: 8, height: 8 },{ x: 60, y: 300, width: 8, height: 8 },{ x: 65, y: 175, width: 8, height: 8 },{ x: 70, y: 50, width: 8, height: 8 },{ x: 75, y: -75, width: 8, height: 8 },{ x: 80, y: -200, width: 8, height: 8 },{ x: 85, y: -325, width: 8, height: 8 },{ x: 90, y: -450, width: 8, height: 8 },{ x: 95, y: -575, width: 18, height: 18 }], hazards: [{ x: 0, y: 620, width: 150, height: 50, type: 'void' }], goal: { x: 105, y: -635, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "INFINITY", theme: 'neon', platforms: [{ x: 50, y: 580, width: 8, height: 8 },{ x: 45, y: 390, width: 13, height: 8, moving: true, moveY: 270, speed: 25 },{ x: 125, y: 140, width: 8, height: 370, isWall: true, isBouncy: true },{ x: 215, y: 200, width: 8, height: 310, isWall: true, isBouncy: true },{ x: 125, y: -150, width: 8, height: 8 },{ x: 265, y: -220, width: 13, height: 8, moving: true, moveX: 270, speed: 26 },{ x: 595, y: -420, width: 8, height: 350, isWall: true, isBouncy: true },{ x: 685, y: -360, width: 8, height: 290, isWall: true, isBouncy: true },{ x: 595, y: -670, width: 8, height: 8 },{ x: 735, y: -750, width: 18, height: 18 }], hazards: [{ x: 58, y: 381, width: 67, height: 8, type: 'spike' },{ x: 133, y: 132, width: 82, height: 8, type: 'spike' },{ x: 133, y: -158, width: 132, height: 8, type: 'spike' },{ x: 535, y: -228, width: 60, height: 8, type: 'spike' },{ x: 603, y: -428, width: 82, height: 8, type: 'spike' },{ x: 603, y: -678, width: 132, height: 8, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 745, y: -810, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "ETERNITY", theme: 'neon', platforms: [{ x: 50, y: 550, width: 8, height: 8 },{ x: 52, y: 420, width: 8, height: 8 },{ x: 54, y: 290, width: 8, height: 8 },{ x: 56, y: 160, width: 8, height: 8 },{ x: 58, y: 30, width: 8, height: 8 },{ x: 60, y: -100, width: 8, height: 8 },{ x: 62, y: -230, width: 8, height: 8 },{ x: 64, y: -360, width: 8, height: 8 },{ x: 66, y: -490, width: 8, height: 8 },{ x: 68, y: -620, width: 16, height: 18 }], hazards: [{ x: 0, y: 620, width: 120, height: 50, type: 'void' }], goal: { x: 78, y: -680, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "IMPOSSIBLE", theme: 'neon', platforms: [{ x: 50, y: 580, width: 7, height: 7 },{ x: 40, y: 380, width: 12, height: 7, moving: true, moveY: 280, speed: 26 },{ x: 120, y: 120, width: 7, height: 380, isWall: true, isBouncy: true },{ x: 210, y: 180, width: 7, height: 320, isWall: true, isBouncy: true },{ x: 120, y: -180, width: 7, height: 7 },{ x: 260, y: -250, width: 12, height: 7, moving: true, moveX: 280, speed: 27 },{ x: 600, y: -460, width: 7, height: 360, isWall: true, isBouncy: true },{ x: 690, y: -400, width: 7, height: 300, isWall: true, isBouncy: true },{ x: 600, y: -720, width: 7, height: 7 },{ x: 740, y: -800, width: 16, height: 18 }], hazards: [{ x: 52, y: 372, width: 68, height: 7, type: 'spike' },{ x: 127, y: 113, width: 83, height: 7, type: 'spike' },{ x: 127, y: -187, width: 133, height: 7, type: 'spike' },{ x: 540, y: -257, width: 60, height: 7, type: 'spike' },{ x: 607, y: -467, width: 83, height: 7, type: 'spike' },{ x: 607, y: -727, width: 133, height: 7, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 750, y: -860, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "GODLIKE", theme: 'neon', platforms: [{ x: 50, y: 550, width: 7, height: 7 },{ x: 50, y: 415, width: 7, height: 7 },{ x: 50, y: 280, width: 7, height: 7 },{ x: 50, y: 145, width: 7, height: 7 },{ x: 50, y: 10, width: 7, height: 7 },{ x: 50, y: -125, width: 7, height: 7 },{ x: 50, y: -260, width: 7, height: 7 },{ x: 50, y: -395, width: 7, height: 7 },{ x: 50, y: -530, width: 7, height: 7 },{ x: 50, y: -665, width: 14, height: 18 }], hazards: [{ x: 0, y: 620, width: 100, height: 50, type: 'void' }], goal: { x: 60, y: -725, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "TRANSCENDENT", theme: 'neon', platforms: [{ x: 50, y: 580, width: 7, height: 7 },{ x: 35, y: 370, width: 11, height: 7, moving: true, moveY: 290, speed: 27 },{ x: 115, y: 100, width: 7, height: 390, isWall: true, isBouncy: true },{ x: 205, y: 160, width: 7, height: 330, isWall: true, isBouncy: true },{ x: 115, y: -210, width: 7, height: 7 },{ x: 255, y: -280, width: 11, height: 7, moving: true, moveX: 290, speed: 28 },{ x: 605, y: -500, width: 7, height: 370, isWall: true, isBouncy: true },{ x: 695, y: -440, width: 7, height: 310, isWall: true, isBouncy: true },{ x: 605, y: -770, width: 7, height: 7 },{ x: 745, y: -850, width: 14, height: 18 }], hazards: [{ x: 46, y: 362, width: 69, height: 7, type: 'spike' },{ x: 122, y: 93, width: 83, height: 7, type: 'spike' },{ x: 122, y: -217, width: 133, height: 7, type: 'spike' },{ x: 545, y: -287, width: 60, height: 7, type: 'spike' },{ x: 612, y: -507, width: 83, height: 7, type: 'spike' },{ x: 612, y: -777, width: 133, height: 7, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 755, y: -910, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "ASCENDED", theme: 'neon', platforms: [{ x: 50, y: 550, width: 7, height: 7 },{ x: 48, y: 410, width: 7, height: 7 },{ x: 46, y: 270, width: 7, height: 7 },{ x: 44, y: 130, width: 7, height: 7 },{ x: 42, y: -10, width: 7, height: 7 },{ x: 40, y: -150, width: 7, height: 7 },{ x: 38, y: -290, width: 7, height: 7 },{ x: 36, y: -430, width: 7, height: 7 },{ x: 34, y: -570, width: 7, height: 7 },{ x: 32, y: -710, width: 12, height: 18 }], hazards: [{ x: 0, y: 620, width: 80, height: 50, type: 'void' }], goal: { x: 42, y: -770, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "DIVINE", theme: 'neon', platforms: [{ x: 50, y: 580, width: 6, height: 6 },{ x: 30, y: 360, width: 10, height: 6, moving: true, moveY: 300, speed: 28 },{ x: 110, y: 80, width: 6, height: 400, isWall: true, isBouncy: true },{ x: 200, y: 140, width: 6, height: 340, isWall: true, isBouncy: true },{ x: 110, y: -240, width: 6, height: 6 },{ x: 250, y: -310, width: 10, height: 6, moving: true, moveX: 300, speed: 29 },{ x: 610, y: -540, width: 6, height: 380, isWall: true, isBouncy: true },{ x: 700, y: -480, width: 6, height: 320, isWall: true, isBouncy: true },{ x: 610, y: -820, width: 6, height: 6 },{ x: 750, y: -900, width: 12, height: 18 }], hazards: [{ x: 40, y: 352, width: 70, height: 6, type: 'spike' },{ x: 116, y: 74, width: 84, height: 6, type: 'spike' },{ x: 116, y: -246, width: 134, height: 6, type: 'spike' },{ x: 550, y: -316, width: 60, height: 6, type: 'spike' },{ x: 616, y: -546, width: 84, height: 6, type: 'spike' },{ x: 616, y: -826, width: 134, height: 6, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 760, y: -960, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "CELESTIAL", theme: 'neon', platforms: [{ x: 50, y: 550, width: 6, height: 6 },{ x: 46, y: 405, width: 6, height: 6 },{ x: 42, y: 260, width: 6, height: 6 },{ x: 38, y: 115, width: 6, height: 6 },{ x: 34, y: -30, width: 6, height: 6 },{ x: 30, y: -175, width: 6, height: 6 },{ x: 26, y: -320, width: 6, height: 6 },{ x: 22, y: -465, width: 6, height: 6 },{ x: 18, y: -610, width: 6, height: 6 },{ x: 14, y: -755, width: 10, height: 18 }], hazards: [{ x: 0, y: 620, width: 60, height: 50, type: 'void' }], goal: { x: 24, y: -815, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "ULTIMATE", theme: 'neon', platforms: [{ x: 50, y: 580, width: 6, height: 6 },{ x: 25, y: 350, width: 9, height: 6, moving: true, moveY: 310, speed: 29 },{ x: 105, y: 60, width: 6, height: 410, isWall: true, isBouncy: true },{ x: 195, y: 120, width: 6, height: 350, isWall: true, isBouncy: true },{ x: 105, y: -270, width: 6, height: 6 },{ x: 245, y: -340, width: 9, height: 6, moving: true, moveX: 310, speed: 30 },{ x: 615, y: -580, width: 6, height: 390, isWall: true, isBouncy: true },{ x: 705, y: -520, width: 6, height: 330, isWall: true, isBouncy: true },{ x: 615, y: -870, width: 6, height: 6 },{ x: 755, y: -950, width: 10, height: 18 }], hazards: [{ x: 34, y: 342, width: 71, height: 6, type: 'spike' },{ x: 111, y: 54, width: 84, height: 6, type: 'spike' },{ x: 111, y: -276, width: 134, height: 6, type: 'spike' },{ x: 555, y: -346, width: 60, height: 6, type: 'spike' },{ x: 621, y: -586, width: 84, height: 6, type: 'spike' },{ x: 621, y: -876, width: 134, height: 6, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 765, y: -1010, width: 50, height: 60 }, spawn: { x: 52, y: 480 } },
    { name: "PERFECT", theme: 'neon', platforms: [{ x: 50, y: 550, width: 5, height: 5 },{ x: 44, y: 400, width: 5, height: 5 },{ x: 38, y: 250, width: 5, height: 5 },{ x: 32, y: 100, width: 5, height: 5 },{ x: 26, y: -50, width: 5, height: 5 },{ x: 20, y: -200, width: 5, height: 5 },{ x: 14, y: -350, width: 5, height: 5 },{ x: 8, y: -500, width: 5, height: 5 },{ x: 2, y: -650, width: 5, height: 5 },{ x: -4, y: -800, width: 8, height: 18 }], hazards: [{ x: 0, y: 620, width: 55, height: 50, type: 'void' }], goal: { x: 6, y: -860, width: 50, height: 60 }, spawn: { x: 52, y: 450 } },
    { name: "LEVEL 100", theme: 'neon', platforms: [{ x: 50, y: 580, width: 5, height: 5 },{ x: 20, y: 340, width: 8, height: 5, moving: true, moveY: 320, speed: 30 },{ x: 100, y: 40, width: 5, height: 420, isWall: true, isBouncy: true },{ x: 190, y: 100, width: 5, height: 360, isWall: true, isBouncy: true },{ x: 100, y: -300, width: 5, height: 5 },{ x: 240, y: -370, width: 8, height: 5, moving: true, moveX: 320, speed: 31 },{ x: 620, y: -620, width: 5, height: 400, isWall: true, isBouncy: true },{ x: 710, y: -560, width: 5, height: 340, isWall: true, isBouncy: true },{ x: 620, y: -920, width: 5, height: 5 },{ x: 760, y: -1000, width: 8, height: 18 }], hazards: [{ x: 28, y: 332, width: 72, height: 5, type: 'spike' },{ x: 105, y: 35, width: 85, height: 5, type: 'spike' },{ x: 105, y: -305, width: 135, height: 5, type: 'spike' },{ x: 560, y: -375, width: 60, height: 5, type: 'spike' },{ x: 625, y: -625, width: 85, height: 5, type: 'spike' },{ x: 625, y: -925, width: 135, height: 5, type: 'spike' },{ x: 0, y: 650, width: 800, height: 50, type: 'void' }], goal: { x: 770, y: -1060, width: 50, height: 60 }, spawn: { x: 52, y: 480 } }
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
    
    // Reset camera position
    camera.x = 0;
    camera.y = 0;
    camera.targetX = 0;
    camera.targetY = 0;
    
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
                if (platform.isBouncy) {
                    // Bouncy ceiling - bounce back down with force
                    player.vy = Math.abs(player.vy) + 8;
                    player.canDoubleJump = true;
                    createParticle(player.x + player.width / 2, platform.y + platform.height, '#00ff88', 10, 6);
                } else {
                    player.vy = 0;
                }
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
    
    // Pause the game and show death screen until player clicks retry
    gameState.isPlaying = false;
    const deathScreen = document.getElementById('game-over-screen');
    document.getElementById('death-message').textContent = reason;
    deathScreen.classList.remove('hidden');
    hideTouchControls();
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
    hideTouchControls();
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
    
    // Fly cheat (Command + Space)
    if (keys.fly) {
        player.vy = -4; // Fly upward (slower)
        player.isGrounded = false;
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
        
        // If this is the goal platform, move the goal with it
        if (platform.isGoalPlatform && currentGoal) {
            currentGoal.x += platform.deltaX;
            currentGoal.y += platform.deltaY;
        }
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
    // This function is now replaced by drawScreenBackground() and drawWorldGrid()
    // Kept for compatibility but no longer called directly
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
        if (hazard.type === 'void') {            // Void - gradient fade (themed)
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

// Dynamic camera that follows the player
const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothing: 0.08
};

function updateCamera() {
    // Camera follows player - keep player in the middle of screen
    const targetX = player.x - canvas.width * 0.5;
    const targetY = player.y - canvas.height * 0.6;
    
    camera.targetX = Math.max(0, targetX); // Don't go left of level start
    camera.targetY = Math.min(0, targetY); // Don't go below ground level
    
    // Smooth camera movement
    camera.x += (camera.targetX - camera.x) * camera.smoothing;
    camera.y += (camera.targetY - camera.y) * camera.smoothing;
}

function render() {
    updateCamera();
    
    // Clear the entire canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background before camera transform (fills whole screen)
    drawScreenBackground();
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // Draw world elements with camera
    drawWorldGrid();
    drawPlatforms();
    drawHazards();
    drawGoal();
    drawParticles();
    drawPlayer();
    
    ctx.restore();
}

function drawScreenBackground() {
    // Gradient background - always fills entire screen
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, currentTheme.bgTop);
    gradient.addColorStop(0.5, currentTheme.bgMid);
    gradient.addColorStop(1, currentTheme.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWorldGrid() {
    // Grid that moves with the world
    ctx.strokeStyle = currentTheme.gridColor;
    ctx.lineWidth = 1;
    const gridSize = 50;
    
    // Calculate visible area based on camera
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const endX = camera.x + canvas.width + gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;
    const endY = camera.y + canvas.height + gridSize;
    
    for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
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
    showTouchControls();
});

document.getElementById('next-level-btn').addEventListener('click', () => {
    document.getElementById('level-complete-screen').classList.add('hidden');
    gameState.currentLevel++;
    gameState.isPlaying = true;
    loadLevel(gameState.currentLevel);
    showTouchControls();
});

document.getElementById('retry-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    respawnPlayer();
    gameState.isPlaying = true;
    showTouchControls();
});

document.getElementById('death-menu-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    gameState.isPlaying = false;
    hideTouchControls();
});

document.getElementById('replay-btn').addEventListener('click', () => {
    document.getElementById('victory-screen').classList.add('hidden');
    gameState.currentLevel = 0;
    gameState.deaths = 0;
    gameState.startTime = Date.now();
    gameState.isPlaying = true;
    loadLevel(0);
    showTouchControls();
});

document.getElementById('menu-btn').addEventListener('click', () => {
    gameState.isPlaying = false;
    document.getElementById('start-screen').classList.remove('hidden');
    hideTouchControls();
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
// CONTROL MODE SELECTOR
// ==========================================
document.querySelectorAll('.control-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected from all
        document.querySelectorAll('.control-mode-btn').forEach(b => b.classList.remove('selected'));
        // Add selected to clicked
        btn.classList.add('selected');
        
        // Update control mode
        gameState.controlMode = btn.dataset.mode;
        
        // Show/hide appropriate controls info
        const keyboardInfo = document.getElementById('keyboard-controls-info');
        const touchInfo = document.getElementById('touch-controls-info');
        
        if (gameState.controlMode === 'touch') {
            keyboardInfo.classList.add('hidden');
            touchInfo.classList.remove('hidden');
        } else {
            keyboardInfo.classList.remove('hidden');
            touchInfo.classList.add('hidden');
        }
    });
});

// ==========================================
// TOUCH CONTROLS
// ==========================================
function setupTouchControls() {
    const touchControls = document.getElementById('touch-controls');
    const leftBtn = document.getElementById('touch-left-btn');
    const rightBtn = document.getElementById('touch-right-btn');
    const jumpBtn = document.getElementById('touch-jump-btn');
    const dashBtn = document.getElementById('touch-dash-btn');
    
    // Helper to handle touch/mouse events
    function addTouchEvents(btn, keyName) {
        // Touch start
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[keyName] = true;
        });
        
        // Touch end
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[keyName] = false;
        });
        
        // Touch cancel (finger slides off)
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            keys[keyName] = false;
        });
        
        // Mouse support for testing
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            keys[keyName] = true;
        });
        
        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            keys[keyName] = false;
        });
        
        btn.addEventListener('mouseleave', (e) => {
            keys[keyName] = false;
        });
    }
    
    addTouchEvents(leftBtn, 'left');
    addTouchEvents(rightBtn, 'right');
    addTouchEvents(jumpBtn, 'jump');
    addTouchEvents(dashBtn, 'dash');
}

function showTouchControls() {
    if (gameState.controlMode === 'touch') {
        document.getElementById('touch-controls').classList.remove('hidden');
    }
}

function hideTouchControls() {
    document.getElementById('touch-controls').classList.add('hidden');
}

// Initialize touch controls
setupTouchControls();

// ==========================================
// START GAME
// ==========================================
loadLevel(0);
gameLoop();
