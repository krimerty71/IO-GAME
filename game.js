class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        // Размер клетки
        this.gridSize = 20;
        this.cellSize = this.canvas.width / this.gridSize;
        
        // Начальные настройки
        this.reset();
        
        // Загрузка рекорда
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.highScoreElement.textContent = this.highScore;
        
        // Управление
        this.setupControls();
    }
    
    reset() {
        // Змейка (начальная позиция)
        this.snake = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10}
        ];
        
        // Направление
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // Еда
        this.food = this.generateFood();
        
        // Счет
        this.score = 0;
        this.scoreElement.textContent = '0';
        
        // Состояние игры
        this.gameOver = false;
        this.gameLoop = null;
    }
    
    generateFood() {
        while (true) {
            const food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            
            // Проверка, не появилась ли еда на змейке
            if (!this.snake.some(segment => segment.x === food.x && segment.y === food.y)) {
                return food;
            }
        }
    }
    
    setupControls() {
        // Кнопки управления
        document.getElementById('btnUp').addEventListener('click', () => this.changeDirection('up'));
        document.getElementById('btnDown').addEventListener('click', () => this.changeDirection('down'));
        document.getElementById('btnLeft').addEventListener('click', () => this.changeDirection('left'));
        document.getElementById('btnRight').addEventListener('click', () => this.changeDirection('right'));
        
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': e.preventDefault(); this.changeDirection('up'); break;
                case 'ArrowDown': e.preventDefault(); this.changeDirection('down'); break;
                case 'ArrowLeft': e.preventDefault(); this.changeDirection('left'); break;
                case 'ArrowRight': e.preventDefault(); this.changeDirection('right'); break;
            }
        });
        
        // Свайпы для телефона
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 50) this.changeDirection('right');
                else if (dx < -50) this.changeDirection('left');
            } else {
                if (dy > 50) this.changeDirection('down');
                else if (dy < -50) this.changeDirection('up');
            }
            
            touchStartX = 0;
            touchStartY = 0;
        });
        
        // Кнопка сброса
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
            this.start();
        });
    }
    
    changeDirection(newDirection) {
        // Запрет на разворот на 180 градусов
        if (
            (this.direction === 'up' && newDirection === 'down') ||
            (this.direction === 'down' && newDirection === 'up') ||
            (this.direction === 'left' && newDirection === 'right') ||
            (this.direction === 'right' && newDirection === 'left')
        ) {
            return;
        }
        
        this.nextDirection = newDirection;
    }
    
    move() {
        if (this.gameOver) return;
        
        // Обновление направления
        this.direction = this.nextDirection;
        
        // Новая голова
        const head = {...this.snake[0]};
        
        switch(this.direction) {
            case 'right': head.x++; break;
            case 'left': head.x--; break;
            case 'up': head.y--; break;
            case 'down': head.y++; break;
        }
        
        // Проверка на столкновение со стенами
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.gameOver = true;
            this.updateHighScore();
            return;
        }
        
        // Проверка на еду
        if (head.x === this.food.x && head.y === this.food.y) {
            // Съели еду
            this.snake = [head, ...this.snake];
            this.food = this.generateFood();
            this.score += 10;
            this.scoreElement.textContent = this.score;
        } else {
            // Обычное движение
            this.snake = [head, ...this.snake.slice(0, -1)];
        }
        
        // Проверка на столкновение с собой
        const headCollision = this.snake.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
        
        if (headCollision) {
            this.gameOver = true;
            this.updateHighScore();
        }
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
    }
    
    draw() {
        // Очистка canvas
        this.ctx.fillStyle = '#0f3460';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем сетку
        this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Рисуем еду
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.cellSize + this.cellSize/2,
            this.food.y * this.cellSize + this.cellSize/2,
            this.cellSize/2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Рисуем змейку
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            
            // Градиент для змейки
            const gradient = this.ctx.createRadialGradient(
                x + this.cellSize/2, y + this.cellSize/2, 0,
                x + this.cellSize/2, y + this.cellSize/2, this.cellSize
            );
            
            if (isHead) {
                gradient.addColorStop(0, '#4ecdc4');
                gradient.addColorStop(1, '#45b7aa');
            } else {
                gradient.addColorStop(0, '#4ecdc4');
                gradient.addColorStop(1, '#3aa89e');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = '#4ecdc4';
            this.ctx.shadowBlur = isHead ? 20 : 10;
            
            // Скругленные квадраты
            const margin = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(
                x + margin, 
                y + margin, 
                this.cellSize - margin * 2, 
                this.cellSize - margin * 2, 
                5
            );
            this.ctx.fill();
            
            // Глазки у головы
            if (isHead) {
                this.ctx.fillStyle = 'white';
                this.ctx.shadowBlur = 0;
                
                const eyeSize = this.cellSize / 6;
                const eyeOffset = this.cellSize / 4;
                
                if (this.direction === 'right' || this.direction === 'left') {
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.cellSize * 0.7, y + this.cellSize * 0.3, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.cellSize * 0.7, y + this.cellSize * 0.7, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Зрачки
                    this.ctx.fillStyle = 'black';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.cellSize * 0.75, y + this.cellSize * 0.3, eyeSize/2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.cellSize * 0.75, y + this.cellSize * 0.7, eyeSize/2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        });
        
        // Game Over
        if (this.gameOver) {
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#4ecdc4';
            this.ctx.font = 'bold 30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Нажми "Новая игра"', this.canvas.width/2, this.canvas.height/2 + 40);
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    // Вспомогательный метод для скругленных прямоугольников
    roundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
    }
    
    start() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        this.gameLoop = setInterval(() => {
            this.move();
            this.draw();
        }, 150);
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    game.start();
});
