// ========================================
// charity: water - Water Quest Game
// Enhanced Mobile-First JavaScript
// ========================================

// --- Game DOM Elements ---
const grid = document.getElementById('game-grid');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const endMsgEl = document.getElementById('end-message');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const confettiCanvas = document.getElementById('confetti-canvas');
const instructionsEl = document.getElementById('instructions-text');

// Game Assets
const JERRY_CAN_IMG = "img/water-can-transparent.png";
const BRICK_EMOJI = "🧱";

// Enhanced Difficulty Settings
const DIFFICULTY_SETTINGS = {
  easy: {
    winScore: 15,
    timeLimit: 45,
    spawnIntervalMin: 1200,
    spawnIntervalMax: 2000,
    brickChance: 0.15,
    instructions: "Tap the yellow jerry cans to collect water! Avoid the brick emoji. <br><strong>Score 15+ in 45 seconds to win.</strong>"
  },
  normal: {
    winScore: 20,
    timeLimit: 30,
    spawnIntervalMin: 900,
    spawnIntervalMax: 1700,
    brickChance: 0.20,
    instructions: "Tap the yellow jerry cans to collect water! Avoid the brick emoji. <br><strong>Score 20+ in 30 seconds to win.</strong>"
  },
  hard: {
    winScore: 25,
    timeLimit: 20,
    spawnIntervalMin: 700,
    spawnIntervalMax: 1300,
    brickChance: 0.30,
    instructions: "Tap the yellow jerry cans to collect water! Avoid the brick emoji. <br><strong>Score 25+ in 20 seconds to win.</strong>"
  }
};

// Enhanced Messages
const WIN_MSGS = [
  "🎉 You made a difference!",
  "💧 Clean water for all!",
  "⭐ Amazing! You did it!",
  "🏆 You're a water hero!",
  "✨ Outstanding impact!",
  "🌟 Mission accomplished!"
];

const LOSE_MSGS = [
  "💪 Try again for a better score!",
  "🎯 Almost there, give it another go!",
  "🔄 Don't give up!",
  "📈 Keep practicing!",
  "🚀 You're getting closer!",
  "💯 One more try!"
];

// --- Game State ---
let cols = 3;
let rows = 3;
let totalCells = 9;
let score = 0;
let timer = 30;
let gameActive = false;
let spawnInterval = null;
let timerInterval = null;
let currentDifficulty = 'easy';
let gameStartTime = 0;
let totalClicks = 0;
let hitStreak = 0;
let maxStreak = 0;

// --- Preload Audio Assets (Lazy Loading) ---
const audioAssets = {};
let audioLoaded = false;

const initAudio = () => {
  if (audioLoaded) return;
  audioAssets.pop = new Audio('sounds/bubble-pop-05-323639.mp3');
  audioAssets.wrong = new Audio('sounds/wrong-47985.mp3');
  audioAssets.chime = new Audio('sounds/chime-alert-demo-309545.mp3');
  
  // Set volumes
  audioAssets.pop.volume = 0.32;
  audioAssets.wrong.volume = 0.38;
  audioAssets.chime.volume = 0.42;
  
  audioLoaded = true;
};

const playSound = (type) => {
  if (!audioLoaded) return;
  
  try {
    if (type === 'success' && audioAssets.pop) {
      const s = audioAssets.pop.cloneNode();
      s.volume = audioAssets.pop.volume;
      s.play().catch(() => {}); // Silent fail
    } else if (type === 'error' && audioAssets.wrong) {
      const s = audioAssets.wrong.cloneNode();
      s.volume = audioAssets.wrong.volume;
      s.play().catch(() => {});
    } else if ((type === 'win' || type === 'streak') && audioAssets.chime) {
      const s = audioAssets.chime.cloneNode();
      s.volume = audioAssets.chime.volume;
      s.play().catch(() => {});
    }
  } catch (e) {
    // Silent fail
  }
};

// --- Enhanced Responsive Grid Setup ---
const updateGridSize = () => {
  const width = window.innerWidth;
  if (width >= 1024) {
    cols = 5; rows = 3; totalCells = 15;
  } else if (width >= 768) {
    cols = 4; rows = 3; totalCells = 12;
  } else {
    cols = 3; rows = 3; totalCells = 9;
  }
  
  // Update CSS custom property for responsive grid
  document.documentElement.style.setProperty('--grid-cols', cols);
};

// Debounced resize handler for better performance - Optimized
let resizeTimeout;
const handleResize = () => {
  const prevCols = cols;
  updateGridSize();
  if (gameActive && prevCols !== cols) {
    requestAnimationFrame(createGrid); // Use RAF for smoother updates
  }
};

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 150); // Increased debounce time
});

// --- Enhanced Grid Creation ---
const createGrid = () => {
  grid.innerHTML = '';
  
  // Update grid template columns based on current cols
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.idx = i;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', 'Game cell');
    cell.setAttribute('tabindex', gameActive ? '0' : '-1');
    
    // Add keyboard support
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCellClick(e);
      }
    });
    
    grid.appendChild(cell);
  }
};

// --- Enhanced Item Spawning ---
const spawnItems = () => {
  // Clear all cells first
  Array.from(grid.children).forEach(cell => {
    cell.innerHTML = '';
    cell.dataset.type = '';
    cell.dataset.clicked = "0";
    cell.classList.remove('has-item');
  });

  // Spawn 1-2 items randomly based on difficulty
  const settings = DIFFICULTY_SETTINGS[currentDifficulty];
  const numItems = Math.random() > 0.6 ? 2 : 1; // 40% chance for 2 items

  
  const usedCells = new Set();
  
  for (let i = 0; i < numItems && usedCells.size < totalCells; i++) {
    let randomIdx;
    do {
      randomIdx = Math.floor(Math.random() * totalCells);
    } while (usedCells.has(randomIdx));
    
    usedCells.add(randomIdx);
    const cell = grid.children[randomIdx];
    
    const isGood = Math.random() > settings.brickChance;
    
    if (isGood) {
      cell.innerHTML = `<img src="${JERRY_CAN_IMG}" alt="Jerry Can" class="can-img" draggable="false">`;
      cell.dataset.type = 'good';
    } else {
      cell.innerHTML = `<span class="brick-emoji" role="img" aria-label="brick">${BRICK_EMOJI}</span>`;
      cell.dataset.type = 'bad';
    }
    
    cell.classList.add('has-item');
    cell.setAttribute('aria-label', isGood ? 'Water can - click to score!' : 'Brick - avoid clicking!');
  }
};

// --- Enhanced Feedback System ---
const showFeedback = (cell, val, isStreak = false) => {
  const fb = document.createElement('div');
  fb.className = 'feedback';
  
  if (val > 0) {
    fb.textContent = isStreak && hitStreak > 2 ? `+${val} 🔥` : `+${val}`;
    fb.style.color = 'var(--cw-green)';
    if (isStreak && hitStreak > 2) {
      playSound('streak');
    } else {
      playSound('success');
    }
  } else {
    fb.textContent = `${val}`;
    fb.classList.add('negative');
    fb.style.color = 'var(--cw-red)';
    playSound('error');
  }
  
  cell.appendChild(fb);
  setTimeout(() => fb.remove(), 800);
};

// --- Enhanced Cell Click Handler ---
const onCellClick = (e) => {
  if (!gameActive) return;
  
  const cell = e.currentTarget;
  if (!cell.dataset.type) return;
  if (cell.dataset.clicked === "1") return;
  
  cell.dataset.clicked = "1";
  totalClicks++;
  
  // Add visual feedback
  cell.style.transform = 'scale(0.95)';
  setTimeout(() => {
    cell.style.transform = '';
  }, 150);
  
  if (cell.dataset.type === 'good') {
    hitStreak++;
    maxStreak = Math.max(maxStreak, hitStreak);
    
    // Bonus points for streaks
    let points = 1;
    if (hitStreak >= 5) points = 3;
    else if (hitStreak >= 3) points = 2;
    
    score += points;
    showFeedback(cell, points, hitStreak > 2);
  } else {
    hitStreak = 0;
    score = Math.max(0, score - 1);
    showFeedback(cell, -1);
    
    // Add screen shake effect for negative feedback
    document.body.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 300);
  }
  
  scoreEl.textContent = score;
  
  // Clear the clicked item immediately
  setTimeout(() => {
    cell.innerHTML = '';
    cell.dataset.type = '';
    cell.dataset.clicked = "0";
    cell.classList.remove('has-item');
    cell.setAttribute('aria-label', 'Game cell');
  }, 200);
};

// --- Enhanced Game Start ---
const startGame = () => {
  initAudio(); // Initialize audio only when needed
  updateGridSize();
  const settings = DIFFICULTY_SETTINGS[currentDifficulty];
  
  // Reset game state
  score = 0;
  timer = settings.timeLimit;
  totalClicks = 0;
  hitStreak = 0;
  maxStreak = 0;
  gameStartTime = Date.now();
  
  // Batch DOM updates for better performance
  requestAnimationFrame(() => {
    scoreEl.textContent = score;
    timerEl.textContent = timer;
    endMsgEl.innerHTML = '';
    confettiCanvas.style.display = 'none';
    
    // Setup grid
    createGrid();
    Array.from(grid.children).forEach(cell => {
      cell.addEventListener('click', onCellClick);
      cell.setAttribute('tabindex', '0');
    });
    
    // Update button states
    startBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    
    // Add visual indicator that game is active
    document.body.classList.add('game-active');
    
    gameActive = true;
    
    // Start spawning
    spawnItems();
  });
  
  // Enhanced spawn timing
  const nextSpawn = () => {
    if (!gameActive) return;
    spawnItems();
    const minInterval = settings.spawnIntervalMin;
    const maxInterval = settings.spawnIntervalMax;
    const randomInterval = minInterval + Math.random() * (maxInterval - minInterval);
    spawnInterval = setTimeout(nextSpawn, randomInterval);
  };
  
  spawnInterval = setTimeout(nextSpawn, 1000);
  
  // Enhanced timer with visual feedback
  timerInterval = setInterval(() => {
    timer--;
    timerEl.textContent = timer;
    
    // Visual warning when time is running out
    if (timer <= 10) {
      timerEl.style.color = 'var(--cw-red)';
      timerEl.style.animation = 'pulse 0.5s ease-in-out infinite';
    } else if (timer <= 20) {
      timerEl.style.color = 'var(--cw-orange)';
    }
    
    if (timer <= 0) {
      endGame();
    }
  }, 1000);
};

// --- Enhanced Game End ---
const endGame = () => {
  gameActive = false;
  document.body.classList.remove('game-active');
  
  clearTimeout(spawnInterval);
  clearInterval(timerInterval);
  
  // Reset timer styling
  timerEl.style.color = '';
  timerEl.style.animation = '';
  
  // Remove event listeners and make cells non-interactive
  Array.from(grid.children).forEach(cell => {
    cell.removeEventListener('click', onCellClick);
    cell.setAttribute('tabindex', '-1');
  });
  
  // Calculate game stats
  const gameTime = (Date.now() - gameStartTime) / 1000;
  const accuracy = totalClicks > 0 ? Math.round((score / totalClicks) * 100) : 0;
  
  // Check win condition
  const settings = DIFFICULTY_SETTINGS[currentDifficulty];
  const isWin = score >= settings.winScore;
  
  if (isWin) {
    const msg = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];
    endMsgEl.innerHTML = `
      <div class="end-message win">
        ${msg}
        <div style="font-size: 1rem; margin-top: 0.5rem; opacity: 0.9;">
          Final Score: ${score} | Max Streak: ${maxStreak} | Accuracy: ${accuracy}%
        </div>
      </div>
    `;
    showConfetti();
    playSound('win');
  } else {
    const msg = LOSE_MSGS[Math.floor(Math.random() * LOSE_MSGS.length)];
    endMsgEl.innerHTML = `
      <div class="end-message lose">
        ${msg}
        <div style="font-size: 1rem; margin-top: 0.5rem; opacity: 0.9;">
          Final Score: ${score}/${settings.winScore} | Max Streak: ${maxStreak}
        </div>
      </div>
    `;
  }
};

// --- Enhanced Reset Function ---
const resetGame = () => {
  clearTimeout(spawnInterval);
  clearInterval(timerInterval);
  
  document.body.classList.remove('game-active');
  
  const settings = DIFFICULTY_SETTINGS[currentDifficulty];
  
  // Reset all state
  score = 0;
  timer = settings.timeLimit;
  totalClicks = 0;
  hitStreak = 0;
  maxStreak = 0;
  gameActive = false;
  
  // Batch DOM updates
  requestAnimationFrame(() => {
    scoreEl.textContent = score;
    timerEl.textContent = timer;
    timerEl.style.color = '';
    timerEl.style.animation = '';
    endMsgEl.innerHTML = '';
    confettiCanvas.style.display = 'none';
    
    // Reset buttons
    startBtn.style.display = 'inline-block';
    resetBtn.style.display = 'none';
    
    createGrid();
  });
};

// --- Enhanced Confetti System ---
const showConfetti = () => {
  const ctx = confettiCanvas.getContext('2d');
  const rect = confettiCanvas.getBoundingClientRect();
  confettiCanvas.width = rect.width;
  confettiCanvas.height = rect.height;
  confettiCanvas.style.display = 'block';
  
  const colors = ['#FFD200', '#00AEEF', '#4FC3F7', '#38B2AC', '#FF8C00'];
  let pieces = [];
  
  // Create more confetti pieces
  for (let i = 0; i < 80; i++) {
    pieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      r: 4 + Math.random() * 8,
      c: colors[Math.floor(Math.random() * colors.length)],
      v: 2 + Math.random() * 4,
      dx: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }
  
  let frame = 0;
  const maxFrames = 180; // 3 seconds at 60fps
  
  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, 2 * Math.PI);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.max(0, 1 - (frame / maxFrames));
      ctx.fill();
      ctx.restore();
    });
  }
  
  function update() {
    pieces.forEach(p => {
      p.y += p.v;
      p.x += p.dx;
      p.rotation += p.rotationSpeed;
      if (p.y > confettiCanvas.height + 20) {
        p.y = -10;
        p.x = Math.random() * confettiCanvas.width;
      }
    });
  }
  
  function loop() {
    if (frame++ > maxFrames) {
      confettiCanvas.style.display = 'none';
      return;
    }
    draw();
    update();
    requestAnimationFrame(loop);
  }
  
  loop();
};

// --- Event Listeners ---
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

// Enhanced difficulty selection - Optimized for speed
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const newDifficulty = e.target.dataset.difficulty;
    if (newDifficulty === currentDifficulty) return; // No change needed
    
    // Update active state immediately
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update difficulty
    currentDifficulty = newDifficulty;
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    
    // Update UI immediately without fade effect for speed
    instructionsEl.innerHTML = settings.instructions;
    
    // Update timer display if game not active
    if (!gameActive) {
      timerEl.textContent = settings.timeLimit;
    }
  });
});

// --- Keyboard Support ---
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && !gameActive) {
    e.preventDefault();
    startGame();
  } else if (e.key === 'Escape' && gameActive) {
    resetGame();
  }
});

// --- Touch/Click Enhancement ---
document.addEventListener('touchstart', function() {}, { passive: true });

// --- Initial Setup ---
updateGridSize();
createGrid();
// Initialize with default difficulty settings
const initialSettings = DIFFICULTY_SETTINGS[currentDifficulty];
instructionsEl.innerHTML = initialSettings.instructions;
timerEl.textContent = initialSettings.timeLimit;

// Add optimized animations to CSS
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .game-active .main-container {
    border-color: var(--cw-yellow);
  }
  
  /* Optimize transitions for better performance */
  .difficulty-btn {
    will-change: transform, background-color;
  }
  
  .grid-cell {
    will-change: transform, border-color;
  }
  
  .stat-card {
    will-change: transform;
  }
`;
document.head.appendChild(shakeStyle);
