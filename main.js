const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');

    const ROWS = 20;
    const COLS = 10;
    const BLOCK_SIZE = 30;
    const DROP_INTERVAL = 1000; // 1秒ごとに自動落下
    let score = 0;

    context.scale(BLOCK_SIZE, BLOCK_SIZE);

    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    const pieces = [
      [
        [1, 1, 1, 1]
      ],
      [
        [1, 1],
        [1, 1]
      ],
      [
        [0, 1, 0],
        [1, 1, 1]
      ],
      [
        [1, 1, 0],
        [0, 1, 1]
      ],
      [
        [0, 1, 1],
        [1, 1, 0]
      ],
      [
        [1, 0, 0],
        [1, 1, 1]
      ],
      [
        [0, 0, 1],
        [1, 1, 1]
      ]
    ];

    const colors = ['cyan', 'yellow', 'purple', 'green', 'red', 'orange', 'blue']; // ランダムな色の配列

    let currentPiece;
    let currentPosition = { x: 3, y: 0 };
    let lastDropTime = 0;
    let currentColor;

    // ブロックが下降する際の音を再生する関数
    function playDropSound() {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440Hz (A4)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // 音量を下げる

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1); // 0.1秒間再生
    }

    // 横一列に並んだ際の音を再生する関数
    function playLineClearSound() {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // 880Hz (A5)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // 音量を下げる

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // 0.2秒間再生
    }

    function getRandomPiece() {
      currentColor = colors[Math.floor(Math.random() * colors.length)]; // 新しいピースの色をランダムに選択
      return pieces[Math.floor(Math.random() * pieces.length)];
    }

    function drawPiece(piece, offset) {
      piece.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            context.fillStyle = currentColor; // 現在のピースの色を使用
            context.fillRect(x + offset.x, y + offset.y, 1, 1);
          }
        });
      });
    }

    function drawBoard() {
      board.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            context.fillStyle = value; // ボード上のブロックの色
            context.fillRect(x, y, 1, 1);
          }
        });
      });
    }

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawBoard();
      drawPiece(currentPiece, currentPosition);
    }

    function collide(board, piece, offset) {
      return piece.some((row, y) => {
        return row.some((value, x) => {
          return value && (board[y + offset.y] && board[y + offset.y][x + offset.x]) !== 0;
        });
      });
    }

    function merge(board, piece, offset) {
      piece.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            board[y + offset.y][x + offset.x] = currentColor; // 現在のピースの色をボードに保存
          }
        });
      });
    }

    function clearLines() {
      let linesCleared = 0;
      board.forEach((row, y) => {
        if (row.every(value => value !== 0)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(0));
          linesCleared++;
        }
      });
      if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreElement.textContent = score;
        playLineClearSound(); // 横一列に並んだ際に音を再生
      }
    }

    function drop() {
      currentPosition.y++;
      if (collide(board, currentPiece, currentPosition)) {
        currentPosition.y--;
        merge(board, currentPiece, currentPosition);
        clearLines();
        currentPiece = getRandomPiece();
        currentPosition = { x: 3, y: 0 };
        if (collide(board, currentPiece, currentPosition)) {
          alert('ゲームオーバー! スコア: ' + score);
          board.forEach(row => row.fill(0));
          score = 0;
          scoreElement.textContent = score;
        }
      } else {
        playDropSound(); // ブロックが下降するたびに音を再生
      }
    }

    function move(dir) {
      currentPosition.x += dir;
      if (collide(board, currentPiece, currentPosition)) {
        currentPosition.x -= dir;
      }
    }

    function rotate(piece) {
      const newPiece = piece[0].map((_, i) => piece.map(row => row[i])).reverse();
      if (!collide(board, newPiece, currentPosition)) {
        currentPiece = newPiece;
      }
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        move(-1);
      } else if (event.key === 'ArrowRight') {
        move(1);
      } else if (event.key === 'ArrowDown') {
        drop();
      } else if (event.key === 'ArrowUp') {
        rotate(currentPiece);
      }
    });

    let lastTime = 0;
    function update(time = 0) {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (time - lastDropTime > DROP_INTERVAL) {
        drop();
        lastDropTime = time;
      }

      draw();
      requestAnimationFrame(update);
    }

    // Initialize the first piece
    currentPiece = getRandomPiece();
    update();
