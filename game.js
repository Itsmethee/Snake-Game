(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const messageEl = document.getElementById("game-message");
  const startBtn = document.getElementById("start-btn");

  const GRID = 30;
  const COLS = canvas.width / GRID;
  const ROWS = canvas.height / GRID;
  const TICK_MS = 120;

  let snake, direction, nextDirection, food, score, highScore, running, loopId;

  // Load snake head image
  const snakeHeadImg = new Image();
  snakeHeadImg.src = 'images/snake-head.png';

  // Load high score from localStorage
  highScore = parseInt(localStorage.getItem("snakeHighScore")) || 0;
  highScoreEl.textContent = highScore;

  function init() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    direction = "right";
    nextDirection = "right";
    score = 0;
    scoreEl.textContent = score;
    placeFood();
  }

  function placeFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some(function (s) { return s.x === pos.x && s.y === pos.y; }));
    food = pos;
  }

  function draw() {
    // Background
    ctx.fillStyle = "#16213e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (var i = 0; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID, 0);
      ctx.lineTo(i * GRID, canvas.height);
      ctx.stroke();
    }
    for (var j = 0; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * GRID);
      ctx.lineTo(canvas.width, j * GRID);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(
      food.x * GRID + GRID / 2,
      food.y * GRID + GRID / 2,
      GRID / 2 - 2,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Draw snake
    snake.forEach(function (seg, i) {
      if (i === 0 && snakeHeadImg.complete) {
        // Draw the head as an image
        ctx.drawImage(
          snakeHeadImg,
          seg.x * GRID,
          seg.y * GRID,
          GRID,
          GRID
        );
      } else {
        // Draw body segments as rectangles
        ctx.fillStyle = i === 0 ? "#4ecca3" : "#38b88c";
        ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
        ctx.strokeStyle = "#1a1a2e";
        ctx.lineWidth = 1;
        ctx.strokeRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
      }
    });
  }

  function update() {
    direction = nextDirection;

    var head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
      case "up":    head.y--; break;
      case "down":  head.y++; break;
      case "left":  head.x--; break;
      case "right": head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }

    // Self collision
    if (snake.some(function (s) { return s.x === head.x && s.y === head.y; })) {
      return gameOver();
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem("snakeHighScore", highScore);
      }
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    messageEl.textContent = "Game Over! Score: " + score + ". Press Start to play again.";
    startBtn.textContent = "Restart Game";
    draw();

    // Flash effect
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = "#eee";
    ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 25);
  }

  function tick() {
    update();
    if (running) {
      draw();
    }
  }

  function startGame() {
    if (running) return;
    init();
    running = true;
    messageEl.textContent = "";
    startBtn.textContent = "Restart Game";
    draw();
    loopId = setInterval(tick, TICK_MS);
  }

  function restartGame() {
    clearInterval(loopId);
    running = false;
    startGame();
  }

  // Opposite directions (to prevent 180-degree turns)
  var opposites = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  function setDirection(dir) {
    if (opposites[dir] !== direction) {
      nextDirection = dir;
    }
  }

  // Keyboard controls
  document.addEventListener("keydown", function (e) {
    var keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };

    var dir = keyMap[e.key];
    if (!dir) return;

    e.preventDefault();

    if (!running) {
      restartGame();
    }

    setDirection(dir);
  });

  // Start / Restart button
  startBtn.addEventListener("click", restartGame);

  // Touch controls
  document.querySelectorAll(".control-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dir = btn.getAttribute("data-dir");
      if (!running) {
        restartGame();
      }
      setDirection(dir);
    });
  });

  // Initial draw
  init();
  draw();
})();
