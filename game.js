(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const messageEl = document.getElementById("game-message");
  const startBtn = document.getElementById("start-btn");

  let GRID = 75;
  let COLS, ROWS;
  let TICK_MS = 120;

  let snake, direction, nextDirection, food, score, highScore, running, loopId;

  // Game customization settings
  let bgColor = "#16213e";
  let bodyColor = "#38b88c";
  let foodColor = "#e74c3c";

  // Load snake head image
  const snakeHeadImg = new Image();
  snakeHeadImg.onload = function() {
    // Redraw when image loads to show it immediately
    if (snake) {
      draw();
    }
  };
  snakeHeadImg.src = 'images/Ricky.png';

  // Load high score from localStorage
  highScore = parseInt(localStorage.getItem("snakeHighScore")) || 0;
  highScoreEl.textContent = highScore;

  // Populate snake head dropdown from images.json
  function populateImageDropdown() {
    const select = document.getElementById('snake-head-select');

    // Fetch available images from JSON file
    fetch('images/images.json')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        select.innerHTML = '';
        data.images.forEach(function(imgPath) {
          const option = document.createElement('option');
          option.value = imgPath;
          option.textContent = imgPath.split('/').pop();
          select.appendChild(option);
        });
      })
      .catch(function(error) {
        console.error('Error loading images:', error);
        // Fallback to default image
        select.innerHTML = '<option value="images/Ricky.png">Ricky.png</option>';
      });
  }

  // Initialize controls
  populateImageDropdown();

  // Speed control
  const speedControl = document.getElementById('speed-control');
  const speedValue = document.getElementById('speed-value');
  speedControl.addEventListener('input', function() {
    TICK_MS = parseInt(speedControl.value);
    speedValue.textContent = TICK_MS + 'ms';
    // Restart the game loop with new speed if running
    if (running) {
      clearInterval(loopId);
      loopId = setInterval(tick, TICK_MS);
    }
  });

  // Snake head image selector
  const snakeHeadSelect = document.getElementById('snake-head-select');
  snakeHeadSelect.addEventListener('change', function() {
    snakeHeadImg.onload = function() {
      if (snake) {
        draw();
      }
    };
    snakeHeadImg.src = snakeHeadSelect.value;
  });

  // Function to resize canvas to fit viewport
  function resizeCanvas() {
    // Calculate available space (leaving room for UI elements)
    const margin = 280; // Space for title, scores, buttons, controls, version
    const availableWidth = window.innerWidth - 40;
    const availableHeight = window.innerHeight - margin;

    // Calculate optimal grid size based on screen size
    // Aim for 10-20 cells per dimension for playability
    const targetCells = 12;
    const gridFromWidth = Math.floor(availableWidth / targetCells);
    const gridFromHeight = Math.floor(availableHeight / targetCells);

    // Use the smaller grid size to fit both dimensions, min 40, max 100
    GRID = Math.max(40, Math.min(100, Math.min(gridFromWidth, gridFromHeight)));

    // Calculate columns and rows that fit in available space
    COLS = Math.floor(availableWidth / GRID);
    ROWS = Math.floor(availableHeight / GRID);

    // Ensure minimum playable area
    COLS = Math.max(8, COLS);
    ROWS = Math.max(8, ROWS);

    // Set canvas dimensions
    canvas.width = COLS * GRID;
    canvas.height = ROWS * GRID;

    // Redraw if game is initialized
    if (snake) {
      draw();
    }
  }

  // Resize on load and window resize
  resizeCanvas();
  window.addEventListener('resize', function() {
    resizeCanvas();
    // If game is running, we may need to adjust snake position
    if (running && snake) {
      // Ensure snake stays within new bounds
      snake = snake.filter(function(seg) {
        return seg.x >= 0 && seg.x < COLS && seg.y >= 0 && seg.y < ROWS;
      });
      if (snake.length === 0) {
        gameOver();
      }
    }
  });

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
    ctx.fillStyle = bgColor;
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
    ctx.fillStyle = foodColor;
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
        ctx.fillStyle = bodyColor;
        ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
        ctx.strokeStyle = bgColor;
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
    ctx.fillStyle = foodColor;
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

  // Swipe gesture controls for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent scrolling
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: false });

  canvas.addEventListener('touchend', function(e) {
    e.preventDefault(); // Prevent scrolling
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: false });

  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault(); // Prevent scrolling during touch movement
  }, { passive: false });

  function handleSwipe() {
    var deltaX = touchEndX - touchStartX;
    var deltaY = touchEndY - touchStartY;
    var minSwipeDistance = 30; // Minimum distance for a swipe to register

    // Determine if swipe is more horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe right
          if (!running) {
            restartGame();
          }
          setDirection('right');
        } else {
          // Swipe left
          if (!running) {
            restartGame();
          }
          setDirection('left');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          // Swipe down
          if (!running) {
            restartGame();
          }
          setDirection('down');
        } else {
          // Swipe up
          if (!running) {
            restartGame();
          }
          setDirection('up');
        }
      }
    }
  }

  // Initial draw
  init();
  draw();
})();
