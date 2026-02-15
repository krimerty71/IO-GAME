const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let players = [];
let foods = [];
let myId = null;
let mouseX = 400;
let mouseY = 300;

// Обработка движения мыши
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Отправка позиции на сервер
    socket.emit('move', { targetX: mouseX, targetY: mouseY });
});

// Инициализация игры
socket.on('init', (data) => {
    players = data.players;
    foods = data.foods;
    myId = data.playerId;
});

// Новый игрок
socket.on('newPlayer', (player) => {
    players.push(player);
});

// Обновление игры
socket.on('update', (data) => {
    players = data.players;
    foods = data.foods;
    updateUI();
});

// Игрок съеден
socket.on('playerEaten', (playerId) => {
    players = players.filter(p => p.id !== playerId);
});

// Игрок покинул игру
socket.on('playerLeft', (playerId) => {
    players = players.filter(p => p.id !== playerId);
});

// Обновление UI
function updateUI() {
    document.getElementById('playerCount').textContent = players.length;
    const myPlayer = players.find(p => p.id === myId);
    if (myPlayer) {
        document.getElementById('playerSize').textContent = Math.round(myPlayer.size);
    }
}

// Отрисовка игры
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка сетки
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Отрисовка еды
    foods.forEach(food => {
        ctx.beginPath();
        ctx.arc(food.x, food.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
    
    // Отрисовка игроков
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.strokeStyle = player.id === myId ? '#000' : '#333';
        ctx.lineWidth = player.id === myId ? 3 : 1;
        ctx.stroke();
        
        // ID игрока
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.id.substring(0, 4), player.x, player.y - player.size / 2 - 5);
    });
    
    // Прицел (для своего игрока)
    if (myId) {
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    requestAnimationFrame(draw);
}

draw();
