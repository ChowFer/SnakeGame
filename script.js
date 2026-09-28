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

const GLOBAL_BIN_ID = "snake_global_board_prod_v1";
const API_URL = `https://restful-api.dev`;

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
    fetchGlobalScores();
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

async function handleSaveAndRespawn() {
    let name = nameInput.value.trim();
    if (name === "") name = "Player"; 

    respawnBtn.innerText = "Syncing...";
    respawnBtn.disabled = true;

    const payload = {
        name: "SnakeScoreEntry",
        data: {
            gameId: GLOBAL_BIN_ID,
            playerName: name,
            score: score,
            device: getDeviceType(),
            timestamp: Date.now()
        }
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error(err);
    }

    respawnBtn.innerText = "Save & Respawn ↻";
    respawnBtn.disabled = false;
    resetGame();
}

async function fetchGlobalScores() {
    leaderboardList.innerHTML = "<li>Loading global scores...</li>";
    try {
        const response = await fetch(API_URL);
        const allItems = await response.json();
        
        let gameScores = allItems
            .filter(item => item.data && item.data.gameId === GLOBAL_BIN_ID)
            .map(item => item.data);

        gameScores.sort((a, b) => b.score - a.score);
        
        const uniqueScores = [];
        const seenNames = new Set();
        for (const entry of gameScores) {
            if (!seenNames.has(entry.playerName)) {
                seenNames.add(entry.playerName);
                uniqueScores.push(entry);
            }
            if (uniqueScores.length >= 5) break;
        }

        leaderboardList.innerHTML = "";
        if (uniqueScores.length === 0) {
            leaderboardList.innerHTML = "<li>No global scores yet.</li>";
            return;
        }

        uniqueScores.forEach(entry => {
            const li = document.createElement("li");
            li.innerHTML = `${entry.playerName}: <strong>${entry.score}</strong> <span class="device-tag">${entry.device}</span>`;
            leaderboardList.appendChild(li);
        });
    } catch (err) {
        leaderboardList.innerHTML = "<li>Global server busy.</li>";
        renderLocalFallback();
    }
}

function renderLocalFallback() {
    let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard")) || [];
    leaderboardList.innerHTML = "";
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = "<li>No offline high scores recorded</li>";
        return;
    }
    leaderboard.slice(0, 5).forEach(entry => {
        const li = document.createElement("li");
        li.innerHTML = `${entry.name}: <strong>${entry.score}</strong> <span class="device-tag">${entry.device} (Local)</span>`;
        leaderboardList.appendChild(li);
    });
}

function draw() {
    for (let r = 0; r < tileCount; r++) {
        for (let c = 0; c < tileCount; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? "#111" : "#1a1a1a";
            ctx.fillRect(c * gridSize, r * gridSize, gridSize, gridSize);
        }
    }

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
    if (!snake || snake.length === 0) return true;
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