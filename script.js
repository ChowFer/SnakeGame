const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameOverMenu = document.getElementById("gameOverMenu");
const finalScoreElement = document.getElementById("finalScore");
const deviceTypeElement = document.getElementById("deviceType");
const nameInput = document.getElementById("playerName");
const respawnBtn = document.getElementById("respawnBtn");
const leaderboardList = document.getElementById("leaderboardList");
const syncCodeInput = document.getElementById("syncCodeInput");
const copyScoresBtn = document.getElementById("copyScoresBtn");
const importScoresBtn = document.getElementById("importScoresBtn");

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
    loadScoresAndRender();
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
    if (name.length > 100) name = name.substring(0, 100);

    const newEntry = {
        name: name,
        score: score,
        device: getDeviceType()
    };

    let localLeaderboard = JSON.parse(localStorage.getItem("sharedSnakeBoard")) || [];
    localLeaderboard.push(newEntry);
    localLeaderboard.sort((a, b) => b.score - a.score);
    localLeaderboard = localLeaderboard.slice(0, 5);
    localStorage.setItem("sharedSnakeBoard", JSON.stringify(localLeaderboard));

    renderLeaderboardList(localLeaderboard);
    resetGame();
}

function loadScoresAndRender() {
    let localLeaderboard = JSON.parse(localStorage.getItem("sharedSnakeBoard")) || [];
    renderLeaderboardList(localLeaderboard);
}

function renderLeaderboardList(scoreArray) {
    leaderboardList.innerHTML = "";
    if (scoreArray.length === 0) {
        leaderboardList.innerHTML = "<li>No high scores recorded yet</li>";
        return;
    }
    scoreArray.forEach(entry => {
        const li = document.createElement("li");
        li.innerHTML = `${entry.name}: <strong>${entry.score}</strong> <span class="device-tag">${entry.device}</span>`;
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
    if (document.activeElement === nameInput || document.activeElement === syncCodeInput) return;

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

copyScoresBtn.addEventListener("click", () => {
    const scores = localStorage.getItem("sharedSnakeBoard") || "[]";
    const encoded = btoa(unescape(encodeURIComponent(scores)));
    navigator.clipboard.writeText(encoded);
    alert("Scores copied to clipboard! Paste this code on your other device.");
});

importScoresBtn.addEventListener("click", () => {
    const code = syncCodeInput.value.trim();
    if (!code) return;
    try {
        const decoded = decodeURIComponent(escape(atob(code)));
        const newScores = JSON.parse(decoded);
        if (Array.isArray(newScores)) {
            let currentScores = JSON.parse(localStorage.getItem("sharedSnakeBoard")) || [];
            let combined = [...currentScores, ...newScores];
            
            let uniqueMap = new Map();
            combined.forEach(item => {
                const key = `${item.name}_${item.score}_${item.device}`;
                uniqueMap.set(key, item);
            });
            
            let finalScores = Array.from(uniqueMap.values());
            finalScores.sort((a, b) => b.score - a.score);
            finalScores = finalScores.slice(0, 5);
            
            localStorage.setItem("sharedSnakeBoard", JSON.stringify(finalScores));
            renderLeaderboardList(finalScores);
            syncCodeInput.value = "";
            alert("Leaderboards synced successfully!");
        }
    } catch (e) {
        alert("Invalid sync code.");
    }
});

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