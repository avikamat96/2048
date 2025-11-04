const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const gameOverEl = document.getElementById("game-over");
const restartBtn = document.getElementById("restart");
const moveSound = new Audio("sounds/move.mp3");
moveSound.volume = 0.15; // lower volume

const gameOverSound = new Audio("sounds/game-over.wav");
gameOverSound.volume = 0.35;

let grid = [];
let score = 0;
let best = localStorage.getItem("best2048") || 0;
bestEl.textContent = best;

function init() {
  grid = Array(4).fill().map(() => Array(4).fill(0));
  score = 0;
  updateScore();
  addTile();
  addTile();
  draw();
}

function addTile() {
  let empty = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 0) empty.push({ r, c });

  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function draw() {
  board.innerHTML = "";
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      const val = grid[r][c];
      if (val) {
        tile.textContent = val;
        tile.style.background = getColor(val);
        tile.style.color = val <= 4 ? "#776e65" : "#f9f6f2";
      }
      board.appendChild(tile);
    }
  }
}

function getColor(value) {
  const colors = {
    2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563",
    32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61",
    512: "#edc850", 1024: "#edc53f", 2048: "#edc22e"
  };
  return colors[value] || "#3c3a32";
}

function move(direction) {
  let moved = false;

  // Adjust orientation before move
  if (direction === "up") {
    grid = rotateLeft(grid);
  } else if (direction === "down") {
    grid = rotateRight(grid);
  } else if (direction === "right") {
    grid = grid.map(row => row.reverse());
  }

  // Merge logic
  for (let r = 0; r < 4; r++) {
    const row = grid[r].filter(v => v);
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        row[i] *= 2;
        score += row[i];
        row[i + 1] = 0;
      }
    }
    const newRow = row.filter(v => v);
    while (newRow.length < 4) newRow.push(0);
    if (grid[r].toString() !== newRow.toString()) moved = true;
    grid[r] = newRow;
  }

  // Revert orientation after move
  if (direction === "up") {
    grid = rotateRight(grid);
  } else if (direction === "down") {
    grid = rotateLeft(grid);
  } else if (direction === "right") {
    grid = grid.map(row => row.reverse());
  }

  // If something actually moved
  if (moved) {
    playSound(moveSound);
    addTile();
    updateScore();
    draw();
    checkGameOver();
  }
}


function rotateLeft(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function rotateRight(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    localStorage.setItem("best2048", best);
    bestEl.textContent = best;
  }
}

function checkGameOver() {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 0) return;

  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      for (let [dr, dc] of [[1,0], [0,1]])
        if (grid[r+dr]?.[c+dc] === grid[r][c]) return;

  gameOverEl.classList.remove("hidden");
   playSound(gameOverSound);

}

function playSound(audio) {
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
  } catch (e) {
    // prevents mobile autoplay restrictions from throwing
  }
}

restartBtn.onclick = () => {
  gameOverEl.classList.add("hidden");
  init();
};

// Keyboard
window.addEventListener("keydown", e => {
  const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (map[e.key]) move(map[e.key]);
});

// Touch
let startX, startY;
board.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});
board.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;
  if (Math.abs(dx) > Math.abs(dy))
    move(dx > 0 ? "right" : "left");
  else
    move(dy > 0 ? "down" : "up");
});

init();
