// --- Game variables ---
const grid = document.getElementById('game-grid');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const endMsgEl = document.getElementById('end-message');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const confettiCanvas = document.getElementById('confetti-canvas');

// Placeholder images (replace with your own if desired)
const JERRY_CAN_IMG = "img/water-can-transparent.png"; // yellow jerry can
const BRICK_EMOJI = "🧱"; // distinctive brick emoji

// Winning and losing message
const WIN_MSGS = [
  "You made a difference!",
  "Clean water for all!",
  "Amazing! You did it!",
  "You're a water hero!"
];
const LOSE_MSGS = [
  "Try again for a better score!",
  "Almost there, give it another go!",
  "Don't give up!",
  "Keep practicing!"
];

// --- Game state ---
let cols = 3; // columns (3 on mobile, 5 on desktop)
let rows = 3;
let totalCells = 9;
let score = 0;
let timer = 30;
let gameActive = false;
let spawnInterval = null;
let timerInterval = null;

// --- Responsive grid setup ---
function updateGridSize() {
  if (window.innerWidth >= 700) {
    cols = 5; rows = 3; totalCells = 15;
  } else {
    cols = 3; rows = 3; totalCells = 9;
  }
}
window.addEventListener('resize', () => {
  const prevCols = cols;
  updateGridSize();
  if (gameActive && prevCols !== cols) {
    createGrid();
  }
});

// --- Create the grid cells ---
function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.idx = i;
    grid.appendChild(cell);
  }
}

// --- Spawn single item in grid (whack-a-mole style) ---
function spawnItems() {
  // Clear all cells first
  Array.from(grid.children).forEach(cell => {
    cell.innerHTML = '';
    cell.dataset.type = '';
    cell.dataset.clicked = "0";
  });

  // Pick a random cell
  const randomIdx = Math.floor(Math.random() * totalCells);
  const cell = grid.children[randomIdx];

  // Randomly choose between good jerry can (80% chance) or brick (20% chance)
  const isGood = Math.random() < 0.8;

  if (isGood) {
    cell.innerHTML = `<img src="${JERRY_CAN_IMG}" alt="Jerry Can" class="can-img" draggable="false">`;
    cell.dataset.type = 'good';
  } else {
    cell.innerHTML = `<span class="brick-emoji" role="img" aria-label="brick">${BRICK_EMOJI}</span>`;
    cell.dataset.type = 'bad';
  }
}


// --- Feedback effect (+1/-1) ---
function showFeedback(cell, val) {
  const fb = document.createElement('div');
  fb.className = 'feedback';
  fb.textContent = val > 0 ? '+1' : '-1';
  fb.style.color = val > 0 ? 'var(--yellow)' : 'var(--gray)';
  cell.appendChild(fb);
  setTimeout(() => fb.remove(), 650);
}

// --- Handle cell click ---
function onCellClick(e) {
  if (!gameActive) return;
  const cell = e.currentTarget;
  if (!cell.dataset.type) return; // No item in this cell
  if (cell.dataset.clicked === "1") return; // Prevent double click
  
  cell.dataset.clicked = "1";
  
  if (cell.dataset.type === 'good') {
    score++;
    showFeedback(cell, +1);
  } else {
    score = Math.max(0, score - 1);
    showFeedback(cell, -1);
  }
  
  scoreEl.textContent = score;
  
  // Clear the clicked item immediately and spawn a new one after a short delay
  setTimeout(() => {
    cell.innerHTML = '';
    cell.dataset.type = '';
    cell.dataset.clicked = "0";
  }, 200);
}

// --- Start game ---
function startGame() {
  updateGridSize();
  score = 0;
  timer = 30;
  scoreEl.textContent = score;
  timerEl.textContent = timer;
  endMsgEl.textContent = '';
  confettiCanvas.style.display = 'none';
  createGrid();
  Array.from(grid.children).forEach(cell => {
    cell.addEventListener('click', onCellClick);
  });
  gameActive = true;
  startBtn.style.display = 'none';
  resetBtn.style.display = '';
  spawnItems();
  
  // Spawn new items at random intervals between 400-800ms (faster whack-a-mole style)
  function nextSpawn() {
    if (!gameActive) return;
    spawnItems();
    spawnInterval = setTimeout(nextSpawn, 800 + Math.random() * 800);
  }
  spawnInterval = setTimeout(nextSpawn, 700);
  // Timer countdown
  timerInterval = setInterval(() => {
    timer--;
    timerEl.textContent = timer;
    if (timer <= 0) {
      endGame();
    }
  }, 1000);
}

// --- End game ---
function endGame() {
  gameActive = false;
  clearTimeout(spawnInterval);
  clearInterval(timerInterval);
  Array.from(grid.children).forEach(cell => {
    cell.removeEventListener('click', onCellClick);
  });
  // Show end message
  if (score >= 20) {
    const msg = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];
    endMsgEl.innerHTML = `<div class="end-message">${msg}</div>`;
    showConfetti();
  } else {
    const msg = LOSE_MSGS[Math.floor(Math.random() * LOSE_MSGS.length)];
    endMsgEl.innerHTML = `<div class="end-message" style="color:var(--gray);">${msg}</div>`;
  }
}

// --- Reset game ---
function resetGame() {
  clearTimeout(spawnInterval);
  clearInterval(timerInterval);
  score = 0;
  timer = 30;
  scoreEl.textContent = score;
  timerEl.textContent = timer;
  endMsgEl.textContent = '';
  confettiCanvas.style.display = 'none';
  startBtn.style.display = '';
  resetBtn.style.display = 'none';
  createGrid();
}

// --- Simple confetti effect ---
function showConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = confettiCanvas.offsetWidth;
  confettiCanvas.height = confettiCanvas.offsetHeight;
  confettiCanvas.style.display = '';
  let pieces = [];
  for (let i = 0; i < 60; i++) {
    pieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      r: 6 + Math.random() * 8,
      c: Math.random() < 0.5 ? 'var(--yellow)' : 'var(--blue)',
      v: 2 + Math.random() * 3,
      dx: (Math.random() - 0.5) * 2
    });
  }
  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    pieces.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
  function update() {
    pieces.forEach(p => {
      p.y += p.v;
      p.x += p.dx;
      if (p.y > confettiCanvas.height + 20) p.y = -10;
    });
  }
  function loop() {
    if (frame++ > 60) return; // 1s
    draw();
    update();
    requestAnimationFrame(loop);
  }
  loop();
}

// --- Event listeners ---
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

// --- Initial setup ---
updateGridSize();
createGrid();
