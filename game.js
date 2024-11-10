const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const socket = io();

// Resize canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = { x: 100, y: 100, size: 10, body: [{ x: 100, y: 100 }], id: null };
let food = [];
let keys = {};

// Controls
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// Main game loop
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Update player state
function updateGame() {
    if (keys['ArrowUp']) player.y -= 5;
    if (keys['ArrowDown']) player.y += 5;
    if (keys['ArrowLeft']) player.x -= 5;
    if (keys['ArrowRight']) player.x += 5;

    // Keep the snake within the screen bounds
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;
    if (player.y < 0) player.y = canvas.height;
    if (player.y > canvas.height) player.y = 0;

    // Update snake body
    player.body.unshift({ x: player.x, y: player.y });
    if (player.body.length > player.size) player.body.pop();

    // Check for food collision
    food.forEach((item, index) => {
        if (Math.abs(item.x - player.x) < 10 && Math.abs(item.y - player.y) < 10) {
            player.size++;
            food.splice(index, 1);
            spawnFood();
        }
    });

    // Send player's updated position to the server
    socket.emit('move', { x: player.x, y: player.y, body: player.body, size: player.size });
}

// Draw the game state
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the snake
    ctx.fillStyle = 'green';
    player.body.forEach(segment => {
        ctx.fillRect(segment.x, segment.y, 10, 10);
    });

    // Draw food
    ctx.fillStyle = 'red';
    food.forEach(item => {
        ctx.fillRect(item.x, item.y, 10, 10);
    });
}

// Spawn random food
function spawnFood() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    food.push({ x, y });
}

// Initial food spawn
spawnFood();

// Listen for updates from the server (other players' positions)
socket.on('gameState', (players) => {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw other players
    for (const playerId in players) {
        const p = players[playerId];
        ctx.fillStyle = p.id === socket.id ? 'green' : 'blue';  // Current player is green
        p.body.forEach(segment => {
            ctx.fillRect(segment.x, segment.y, 10, 10);
        });
    }
});

// Start the game loop
gameLoop();
