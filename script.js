const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const lifeIconElement = document.getElementById("lifeIcon");
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
let isGoldenFood = false;
let hasSecondLife = false;
let dx = 1; 
let dy = 0; 
let score = 0;
let gameInterval;
let isGameOver = false;

const ROOM_ID = "snake_shared_global_v9";
const API_URL = `https://vercel.app{ROOM_ID}`;

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
    loadScoresAndRender();
}

function update() {
    if (isGameOver) return;

    moveSnake();
    
    if (checkGameOver()) {
        if (hasSecondLife) {
            hasSecondLife = false;
            lifeIconElement.innerText = "";
            useSecondLifeRescue();
            return;
        }
        isGameOver = true;
        clearInterval(gameInterval);
        showGameOverMenu();
        return;
    }

    checkFoodCollision();
    draw();
}

function useSecondLifeRescue() {
    dx = 1;
    dy = 0;
    let head = snake[0];
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        snake.forEach(part => {
            part.x = 10;
            part.y = 10;
        });
    }
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
    if (name.length > 100) name = name.substring(0, 100);

    respawnBtn.innerText = "Syncing...";
    respawnBtn.disabled = true;

    const newEntry = {
        name: name,
        score: score,
        device: getDeviceType(),
        timestamp: Date.now()
    };

    try {
        let scores = [];
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            if (Array.isArray(data)) scores = data;
        } catch (e) {}

        scores.push(newEntry);
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 5);

        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scores)
        });
    } catch (err) {
        console.error(err);
    }

    respawnBtn.innerText = "Save & Respawn ↻";
    respawnBtn.disabled = false;
    resetGame();
}

async function fetchGlobalScores() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        leaderboardList.innerHTML = "";
        if (!Array.isArray(data) || data.length === 0) {
            leaderboardList.innerHTML = "<li>No global scores yet!</li>";
            return;
        }

        data.forEach(entry => {
            const li = document.createElement("li");
            li.innerHTML = `${entry.name}: <strong>${entry.score}</strong> <span class="device-tag">${entry.device}</span>`;
            leaderboardList.appendChild(li);
        });
    } catch (err) {
        leaderboardList.innerHTML = "<li>Offline mode active</li>";
    }
}

async function loadScoresAndRender() {
    fetchGlobalScores();
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

    ctx.fillStyle = isGoldenFood ? "gold" : "red";
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
        if (isGoldenFood) {
            score += 3;
            hasSecondLife = true;
            lifeIconElement.innerText = "🌟";
        } else {
            score += 1;
        }
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
    
    isGoldenFood = Math.random() < 0.15;
    
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
    isGoldenFood = false;
    hasSecondLife = false;
    lifeIconElement.innerText = "";
    dx = 1;
    dy = 0;
    score = 0;
    scoreElement.innerText = score;
    startGame();
}

startGame();