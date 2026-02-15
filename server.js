const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname));

// Игровые объекты
let players = [];
let foods = [];

// Создание еды
for (let i = 0; i < 50; i++) {
  foods.push({
    id: i,
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
  });
}

io.on('connection', (socket) => {
  console.log('Игрок подключился:', socket.id);
  
  // Создание нового игрока
  players.push({
    id: socket.id,
    x: Math.random() * 800,
    y: Math.random() * 600,
    size: 20,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
  });
  
  // Отправка текущего состояния
  socket.emit('init', { players, foods, playerId: socket.id });
  
  // Рассылка всем нового игрока
  socket.broadcast.emit('newPlayer', players[players.length - 1]);
  
  // Обработка движения
  socket.on('move', (data) => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      // Плавное движение
      const dx = data.targetX - player.x;
      const dy = data.targetY - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 1) {
        player.x += dx / distance * 3;
        player.y += dy / distance * 3;
      }
      
      // Проверка границ
      player.x = Math.max(0, Math.min(1000, player.x));
      player.y = Math.max(0, Math.min(1000, player.y));
      
      // Проверка сбора еды
      foods = foods.filter(food => {
        const distance = Math.sqrt(
          Math.pow(player.x - food.x, 2) + 
          Math.pow(player.y - food.y, 2)
        );
        
        if (distance < player.size) {
          player.size += 2;
          return false;
        }
        return true;
      });
      
      // Добавление новой еды
      if (foods.length < 50) {
        foods.push({
          id: Date.now() + Math.random(),
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
      }
      
      // Проверка столкновений игроков
      players.forEach(otherPlayer => {
        if (otherPlayer.id !== player.id) {
          const distance = Math.sqrt(
            Math.pow(player.x - otherPlayer.x, 2) + 
            Math.pow(player.y - otherPlayer.y, 2)
          );
          
          if (distance < player.size + otherPlayer.size - 5) {
            if (player.size > otherPlayer.size && player.size > otherPlayer.size * 1.2) {
              // Поедание другого игрока
              player.size += otherPlayer.size / 2;
              players = players.filter(p => p.id !== otherPlayer.id);
              io.emit('playerEaten', otherPlayer.id);
            }
          }
        }
      });
      
      // Рассылка обновлений
      io.emit('update', { players, foods });
    }
  });
  
  // Отключение игрока
  socket.on('disconnect', () => {
    console.log('Игрок отключился:', socket.id);
    players = players.filter(p => p.id !== socket.id);
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
