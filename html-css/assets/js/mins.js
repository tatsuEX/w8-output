const { createApp, ref, onMounted, computed } = Vue;

function debounced(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }
}

(function(w) {
  /* ===== public ===== */
  function createMinsApp(appId) {
    
    const info = {
      name: 'Mine Sweeper',
    };

    
    createApp({
      setup() {

        onMounted(() => {
          initializeBoard();
        });
        
        // ゲームのオプションと状態を管理
        const options = ref({
          rows: 10,
          cols: 10,
          mines: 10,
        });

        // ゲームのフィールドを管理
        const fields = ref([
          []
        ]);

        // ゲームの状態を管理
        const status = ref(GAME_STATUS.NOT_STARTED);

        // ゲームの経過時間を管理
        const elapsedTime = ref(0);
        const formattedTime = computed(() => {
          const minutes = Math.floor(elapsedTime.value / 60);
          const seconds = elapsedTime.value % 60;
          return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        });

        // 残りの地雷の数を管理
        const remainingMines = ref(options.value.mines);
        // 残りの開かれていないマスの数を計算
        const remainFields = computed(() => {
          return fields.value.flat().filter(field => !field.revealed).length;
        });

        // ゲームボードを初期化する関数を定義（連続実行による過負荷を回避）
        const initializeBoard = debounced(() => {
          const { rows, cols, mines } = options.value;
          remainingMines.value = mines;
          fields.value = createBoard(rows, cols, mines);
        }, 300);

        let gameTimeHnadler = null;
        function startGame() {
          status.value = GAME_STATUS.PLAYING;
          elapsedTime.value = 0;
          gameTimeHnadler = setInterval(() => {
            if (status.value.isStarted && !status.value.isGameOver) {
              elapsedTime.value++;
            } else {
              clearInterval(gameTimeHnadler);
            }
          }, 1000);
        }

        /**
         * フィールドを開く
         * @param {number} rowIndex 
         * @param {number} colIndex 
         */
        function revealField(rowIndex, colIndex) {
          if (status.value.equals(GAME_STATUS.NOT_STARTED)) {
            startGame();
          }

          const field = fields.value[rowIndex][colIndex];
          field.reveal();

          if (field.hasMine) {
            status.value = GAME_STATUS.LOST;
            clearInterval(gameTimeHnadler);
            alert('ゲームオーバー！地雷を踏みました。');
            fields.value.forEach(row => row.forEach(f => f.reveal()));
          } else if (remainFields.value === options.value.mines) {
            status.value = GAME_STATUS.WON;
            clearInterval(gameTimeHnadler);
            alert('おめでとうございます！すべての地雷を避けました！！');
          }

          if (field.adjacentMines === 0 && !field.hasMine) {
            // 周囲のマスを再帰的に開く
            for (let r = Math.max(0, rowIndex - 1); r <= Math.min(fields.value.length - 1, rowIndex + 1); r++) {
              for (let c = Math.max(0, colIndex - 1); c <= Math.min(fields.value[0].length - 1, colIndex + 1); c++) {
                // 当該のマスが開かれていない場合のみ再帰的に開く
                if (!(fields.value[r][c].revealed || fields.value[r][c].hasMine)) {
                  fields.value[r][c].reveal();
                  // もし周囲に地雷が存在しない場合はさらに周囲のマスを開く
                  if (fields.value[r][c].adjacentMines === 0) {
                    revealField(r, c);
                  }
                }
              }
            }
          }
        }
  
        return {
          info,
          options,
          fields,
          remainFields,
          formattedTime,
          startGame,
          initializeBoard,
          revealField,
        }
      }
    }).mount(`#${appId}`);
  }

  w.createMinsApp = createMinsApp;
  
  /* ===== private ===== */
  const GAME_STATUS = new Proxy({
    NOT_STARTED: { name: 'not_started', isGameOver: false, isStarted: false, __sym__: Symbol(this.name), equals(other) { return this.__sym__ === other.__sym__; } },
    PLAYING: { name: 'playing', isGameOver: false, isStarted: true, __sym__: Symbol(this.name), equals(other) { return this.__sym__ === other.__sym__; } },
    WON: { name: 'won', isGameOver: true, isStarted: true, __sym__: Symbol(this.name), equals(other) { return this.__sym__ === other.__sym__; } },
    LOST: { name: 'lost', isGameOver: true, isStarted: true, __sym__: Symbol(this.name), equals(other) { return this.__sym__ === other.__sym__; } },
  }, {
    set(target, prop, value) {
      console.warn(`Cannot modify GAME_STATUS.${prop}. It is read-only.`);
      return false;
    }
  });

  /**
   * フィールドを作成する
   * @returns {Object} フィールドオブジェクト
   */
  function createField() {
    return {
      flagged: false,
      revealed: false,
      hasMine: false,
      adjacentMines: 0,
      render() {
        if (this.revealed) {
          if (this.hasMine) {
            return '💣';
          } else {
            return this.adjacentMines > 0 ? this.adjacentMines : '';
          }
        } else if (this.flagged) {
          return '🚩';
        } else {
          return '';
        }
      },
      toggleFlag() {
        if (!this.revealed) {
          this.flagged = !this.flagged;
        }
      },
      reveal() {
        if (!this.revealed && !this.flagged) {
          this.revealed = true;
        }
      }
    };
  }

  /**
   * マス目を初期化する
   * @param {number} rows 
   * @param {number} cols 
   * @param {number} mines 
   * @returns 
   */
  function createBoard(rows, cols, mines) {
    const board = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => createField())
    );

    while (mines > 0) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if (!board[row][col].hasMine) {
        board[row][col].hasMine = true;

        // 上の行
        if (row > 0) {
          if (col > 0) {
            board[row - 1][col - 1].adjacentMines++;
          }
          board[row - 1][col].adjacentMines++;
          if (col < cols - 1) {
            board[row - 1][col + 1].adjacentMines++;
          }
        }
        // 同じ行
        if (col > 0) {
          board[row][col - 1].adjacentMines++;
        }
        if (col < cols - 1) {
          board[row][col + 1].adjacentMines++;
        }
        // 下の行
        if (row < rows - 1) {
          if (col > 0) {
            board[row + 1][col - 1].adjacentMines++;
          }
          board[row + 1][col].adjacentMines++;
          if (col < cols - 1) {
            board[row + 1][col + 1].adjacentMines++;
          }
        }

        mines--;
      }
    }

    return board;
  }
})(window);
