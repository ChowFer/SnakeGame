const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameOverMenu = document.getElementById("gameOverMenu");
const finalScoreElement = document.getElementById("finalScore");
const deviceTypeElement = document.getElementById("deviceType");
const nameInput = document.getElementById("playerName");
const respawnBtn = document.getElementById("respawnBtn");
const leaderboardList = document.getElementById("leaderboardList");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let dx = 1; 
let dy = 0; 
let score = 0;
let gameInterval;
let isGameOver = false;

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) return "Mobile";
    return "PC";
}

function startGame() {
    isGameOver = false;
    gameOverMenu.classList.add("hidden");
    gameInterval = setInterval(update, 120);
    renderLeaderboard();
}

function update() {
    if (isGameOver) return;

    moveSnake();
    
    if (checkGameOver()) {
        isGameOver = true;
        clearInterval(gameInterval);
        showGameOverMenu();
        return;
    }

    checkFoodCollision();
    draw();
}

function showGameOverMenu() {
    finalScoreElement.innerText = score;
    deviceTypeElement.innerText = getDeviceType();
    gameOverMenu.classList.remove("hidden");
    nameInput.focus();
}

function handleSaveAndRespawn() {
    let name = nameInput.value.trim();
    if (name === "") name = "Player"; 

    let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard")) || [];
    
    const newEntry = {
        name: name,
        score: score,
        device: getDeviceType(),
        date: new Date().toLocaleDateString()
    };
    
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5); 
    
    localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard));
    
    resetGame();
}

function renderLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard")) || [];
    leaderboardList.innerHTML = "";

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = "<li>No high scores recorded yet</li>";
        return;
    }

    leaderboard.forEach(entry => {
        const li = document.createElement("li");
        li.innerHTML = `${entry.name}: <strong>${entry.score}</strong> <span class="device-tag">${entry.device}</span>`;
        leaderboardList.appendChild(li);
    });
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
    // FIXED: Correctly tracking the head segment array index position
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    snake.pop();
}

function changeDirection(direction) {
    if (isGameOver) return;
    if (document.activeElement === nameInput) return;

    switch (direction) {
        case "UP":    if (dy === 0) { dx = 0; dy = -1; } break;
        case "DOWN":  if (dy === 0) { dx = 0; dy = 1; } break;
        case "LEFT":  if (dx === 0) { dx = -1; dy = 0; } break;
        case "RIGHT": if (dx === 0) { dx = 1; dy = 0; } break;
    }
}

window.addEventListener("keydown", e => {
    if (isGameOver && e.key === "Enter") {
        handleSaveAndRespawn();
        return;
    }

    if (e.key === "ArrowUp") changeDirection("UP");
    if (e.key === "ArrowDown") changeDirection("DOWN");
    if (e.key === "ArrowLeft") changeDirection("LEFT");
    if (e.key === "ArrowRight") changeDirection("RIGHT");
});

document.getElementById("btnUp").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("UP"); });
document.getElementById("btnDown").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("DOWN"); });
document.getElementById("btnLeft").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("LEFT"); });
document.getElementById("btnRight").addEventListener("touchstart", (e) => { e.preventDefault(); changeDirection("RIGHT"); });

respawnBtn.addEventListener("click", handleSaveAndRespawn);

function checkFoodCollision() {
    // FIXED: Correctly matching against the head coordinate element layout
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
    // FIXED: Properly isolated check conditions using indices
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