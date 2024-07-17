class CustomChess {
  constructor() {
    this.board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    this.turn = 'w'; // White to move first
  }

  load(fen) {
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    this.board = rows.map(row => {
      const expandedRow = [];
      for (const char of row) {
        if (isNaN(char)) {
          expandedRow.push(char);
        } else {
          for (let i = 0; i < parseInt(char, 10); i++) {
            expandedRow.push(null);
          }
        }
      }
      return expandedRow;
    });
    this.turn = parts[1] === 'w' ? 'w' : 'b';
  }

  getFen() {
    const rows = this.board.map(row => {
      let empty = 0;
      return row.map(cell => {
        if (!cell) {
          empty++;
          return '';
        } else {
          if (empty > 0) {
            const result = empty;
            empty = 0;
            return result + cell;
          }
          return cell;
        }
      }).join('') + (empty > 0 ? empty : '');
    }).join('/');
    return `${rows} ${this.turn} - - 0 1`;
  }

  isWhite(piece) {
    return piece === piece.toUpperCase();
  }

  isBlack(piece) {
    return piece === piece.toLowerCase();
  }

  setTurn(turn) {
    this.turn = turn === 'white' ? 'w' : 'b';
  }

  move(from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;
    const piece = this.board[fromY][fromX];
    const target = this.board[toY][toX];

    if (!piece) return { valid: false, error: 'No piece at the source' };

    // Remove turn restriction for single client mode
    // if (this.turn === 'w' && !this.isWhite(piece)) return { valid: false, error: 'Not white\'s turn' };
    // if (this.turn === 'b' && !this.isBlack(piece)) return { valid: false, error: 'Not black\'s turn' };

    if (!this.isValidMove(piece, from, to)) {
      return { valid: false, error: 'Invalid move' };
    }

    this.board[toY][toX] = piece;
    this.board[fromY][fromX] = null;

    if (target && target.toLowerCase() === 'k') {
      this.gameOver = true;
      this.winner = this.turn === 'w' ? 'White' : 'Black';
    }

    this.turn = this.turn === 'w' ? 'b' : 'w';

    return { valid: true, board: this.board, turn: this.turn, gameOver: this.gameOver, winner: this.winner };
  }

  isValidMove(piece, from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    switch (piece.toLowerCase()) {
      case 'p':
        return this.isValidPawnMove(piece, from, to);
      case 'r':
        return this.isValidRookMove(from, to);
      case 'n':
        return this.isValidKnightMove(from, to);
      case 'b':
        return this.isValidBishopMove(from, to);
      case 'q':
        return this.isValidQueenMove(from, to);
      case 'k':
        return this.isValidKingMove(from, to);
      default:
        return false;
    }
  }

  isValidPawnMove(piece, from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;
    const direction = this.isWhite(piece) ? -1 : 1;
    const startRow = this.isWhite(piece) ? 6 : 1;

    if (fromX === toX) {
      if ((toY === fromY + direction) && !this.board[toY][toX]) {
        return true;
      }
      if ((toY === fromY + 2 * direction) && fromY === startRow && !this.board[toY][toX] && !this.board[fromY + direction][toX]) {
        return true;
      }
    }

    if (Math.abs(fromX - toX) === 1 && toY === fromY + direction && this.board[toY][toX] && this.isWhite(piece) !== this.isWhite(this.board[toY][toX])) {
      return true;
    }

    return false;
  }

  isValidRookMove(from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    if (fromX !== toX && fromY !== toY) {
      return false;
    }

    const stepX = fromX === toX ? 0 : (toX > fromX ? 1 : -1);
    const stepY = fromY === toY ? 0 : (toY > fromY ? 1 : -1);

    let x = fromX + stepX;
    let y = fromY + stepY;

    while (x !== toX || y !== toY) {
      if (this.board[y][x]) {
        return false;
      }
      x += stepX;
      y += stepY;
    }

    return true;
  }

  isValidKnightMove(from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;
    const dx = Math.abs(fromX - toX);
    const dy = Math.abs(fromY - toY);

    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
  }

  isValidBishopMove(from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    if (Math.abs(fromX - toX) !== Math.abs(fromY - toY)) {
      return false;
    }

    const stepX = toX > fromX ? 1 : -1;
    const stepY = toY > fromY ? 1 : -1;

    let x = fromX + stepX;
    let y = fromY + stepY;

    while (x !== toX && y !== toY) {
      if (this.board[y][x]) {
        return false;
      }
      x += stepX;
      y += stepY;
    }

    return true;
  }

  isValidQueenMove(from, to) {
    return this.isValidRookMove(from, to) || this.isValidBishopMove(from, to);
  }

  isValidKingMove(from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    return Math.abs(fromX - toX) <= 1 && Math.abs(fromY - toY) <= 1;
  }

  getTurn() {
    return this.turn;
  }

  getBoardState() {
    return this.board;
  }

  isGameOver() {
    return this.gameOver;
  }

  getWinner() {
    return this.winner;
  }
}

module.exports = CustomChess;
