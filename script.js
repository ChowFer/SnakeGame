const SUPABASE_URL = "https://qwloipgyebuzhwrzexwd.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_iObsx73FyMNLDis5Zq0l2A_AmXFPdk4";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tab";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) return "Phn";
    return "PC";
}

function startGame() {
    isGameOver = false;
    gameOverMenu.classList.add("hidden");
    gameInterval = setInterval(update, 110);
    renderGlobalLeaderboard();
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

    respawnBtn.innerText = "Saving...";
    respawnBtn.disabled = true;

    try {
        await supabase.from('leaderboard').insert([
            { name: name, score: score, device: getDeviceType() }
        ]);
    } catch (err) {
        console.error("Cloud save failed:", err);
    }

    respawnBtn.innerText = "Submit & Respawn ↻";
    respawnBtn.disabled = false;
    resetGame();
}
async function renderGlobalLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(5);

        if (error) throw error;

        leaderboardList.innerHTML = "";
        if (!data || data.length === 0) {
            leaderboardList.innerHTML = "<li>No global scores yet! Be the first!</li>";
            return;
        }

        data.forEach(entry => {
            const li = document.createElement("li");
            li.innerHTML = `${entry.name}: <strong>${entry.score}</strong> <span class="device-tag">${entry.device}</span>`;
            leaderboardList.appendChild(li);
        });
    } catch (err) {
        leaderboardList.innerHTML = "<li>Failed to connect to global database</li>";
        console.error(err);
    }
}

function draw() {ctx.fillStyle = "#111625";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
 ctx.strokeStyle = "rgba(102, 252, 241, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#45f3ff" : "#66fcf1";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#66fcf1";
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
     ctx.fillStyle = "#ff0055";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff0055";
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);
   ctx.shadowBlur = 0;
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