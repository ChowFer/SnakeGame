const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let dx = 1; 
let dy = 0; 
let score = 0;
let gameInterval;

function startGame() {
    gameInterval = setInterval(update, 120); // Slightly slower speed for better mobile handling
}

function update() {
    moveSnake();
    
    if (checkGameOver()) {
        clearInterval(gameInterval);
        alert(`Game Over! Your score was ${score}.`);
        resetGame();
        return;
    }

    checkFoodCollision();
    draw();
}

function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "lime";
    snake.forEach(part => ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2));

    ctx.fillStyle = "red";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    snake.pop();
}

// Direction Change logic function
function changeDirection(direction) {
    switch (direction) {
        case "UP":    if (dy === 0) { dx = 0; dy = -1; } break;
        case "DOWN":  if (dy === 0) { dx = 0; dy = 1; } break;
        case "LEFT":  if (dx === 0) { dx = -1; dy = 0; } break;
        case "RIGHT": if (dx === 0) { dx = 1; dy = 0; } break;
    }
}

// PC Controls (Keyboard)
window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") changeDirection("UP");
    if (e.key === "ArrowDown") changeDirection("DOWN");
    if (e.key === "ArrowLeft") changeDirection("LEFT");
    if (e.key === "ArrowRight") changeDirection("RIGHT");
});

// Mobile Controls (Touch Buttons)
document.getElementById("btnUp").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("UP"); });
document.getElementById("btnDown").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("DOWN"); });
document.getElementById("btnLeft").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("LEFT"); });
document.getElementById("btnRight").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("RIGHT"); });

// Optional: Keep click events for desktop mouse testing of buttons
document.getElementById("btnUp").addEventListener("click", () => changeDirection("UP"));
document.getElementById("btnDown").addEventListener("click", () => changeDirection("DOWN"));
document.getElementById("btnLeft").addEventListener("click", () => changeDirection("LEFT"));
document.getElementById("btnRight").addEventListener("click", () => changeDirection("RIGHT"));

function checkFoodCollision() {
    if (snake[0].x === food.x && snake[0].y === food.y) {
        score++;
        scoreElement.innerText = score;
        growSnake();
        generateFood();
    }
}

function growSnake() {
    const tail = { ...snake[snake.length - 1] };
    snake.push(tail);
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    
    if (snake.some(part => part.x === food.x && part.y === food.y)) {
        generateFood();
    }
}

function checkGameOver() {
    const head = snake[0];
    const hitWall = head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
    const hitSelf = snake.slice(1).some(part => part.x === head.x && part.y === head.y);
    return hitWall || hitSelf;
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 5, y: 5 };
    dx = 1;
    dy = 0;
    score = 0;
    scoreElement.innerText = score;
    startGame();
}

startGame();
