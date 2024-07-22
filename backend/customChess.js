const typeEffectiveness = {
  normal: { superEffective: [], notVeryEffective: ['rock', 'steel'], immune: ['ghost'] },
  fire: { superEffective: ['grass', 'ice', 'bug', 'steel'], notVeryEffective: ['fire', 'water', 'rock', 'dragon'], immune: [] },
  water: { superEffective: ['fire', 'ground', 'rock'], notVeryEffective: ['water', 'grass', 'dragon'], immune: [] },
  electric: { superEffective: ['water', 'flying'], notVeryEffective: ['electric', 'grass', 'dragon'], immune: ['ground'] },
  grass: { superEffective: ['water', 'ground', 'rock'], notVeryEffective: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], immune: [] },
  ice: { superEffective: ['grass', 'ground', 'flying', 'dragon'], notVeryEffective: ['fire', 'water', 'ice', 'steel'], immune: [] },
  fighting: { superEffective: ['normal', 'ice', 'rock', 'dark', 'steel'], notVeryEffective: ['poison', 'flying', 'psychic', 'bug', 'fairy'], immune: ['ghost'] },
  poison: { superEffective: ['grass', 'fairy'], notVeryEffective: ['poison', 'ground', 'rock', 'ghost'], immune: ['steel'] },
  ground: { superEffective: ['fire', 'electric', 'poison', 'rock', 'steel'], notVeryEffective: ['grass', 'bug'], immune: ['flying'] },
  flying: { superEffective: ['grass', 'fighting', 'bug'], notVeryEffective: ['electric', 'rock', 'steel'], immune: ['ground'] },
  psychic: { superEffective: ['fighting', 'poison'], notVeryEffective: ['psychic', 'steel'], immune: ['dark'] },
  bug: { superEffective: ['grass', 'psychic', 'dark'], notVeryEffective: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], immune: [] },
  rock: { superEffective: ['fire', 'ice', 'flying', 'bug'], notVeryEffective: ['fighting', 'ground', 'steel'], immune: [] },
  ghost: { superEffective: ['psychic', 'ghost'], notVeryEffective: ['dark'], immune: ['normal'] },
  dragon: { superEffective: ['dragon'], notVeryEffective: ['steel'], immune: ['fairy'] },
  dark: { superEffective: ['psychic', 'ghost'], notVeryEffective: ['fighting', 'dark', 'fairy'], immune: [] },
  steel: { superEffective: ['ice', 'rock', 'fairy'], notVeryEffective: ['fire', 'water', 'electric', 'steel'], immune: ['poison'] },
  fairy: { superEffective: ['fighting', 'dragon', 'dark'], notVeryEffective: ['fire', 'poison', 'steel'], immune: ['dragon'] },
};

const isSuperEffective = (attackingType, defendingType) => {
  return typeEffectiveness[attackingType]?.superEffective.includes(defendingType);
};

const isNotVeryEffective = (attackingType, defendingType) => {
  return typeEffectiveness[attackingType]?.notVeryEffective.includes(defendingType);
};

const isNeutral = (attackingType, defendingType) => {
  return !isSuperEffective(attackingType, defendingType) && !isNotVeryEffective(attackingType, defendingType);
};

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
    this.gameOver = false;
    this.winner = null;
    this.castlingRights = { K: true, Q: true, k: true, q: true }; // Castling rights
    this.enPassantTarget = null; // En passant target
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
    this.castlingRights = this.parseCastlingRights(parts[2]);
    this.enPassantTarget = parts[3] === '-' ? null : parts[3];
  }

  parseCastlingRights(castling) {
    return {
      K: castling.includes('K'),
      Q: castling.includes('Q'),
      k: castling.includes('k'),
      q: castling.includes('q'),
    };
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
    const castling = `${this.castlingRights.K ? 'K' : ''}${this.castlingRights.Q ? 'Q' : ''}${this.castlingRights.k ? 'k' : ''}${this.castlingRights.q ? 'q' : ''}` || '-';
    const enPassant = this.enPassantTarget ? this.enPassantTarget : '-';
    return `${rows} ${this.turn} ${castling} ${enPassant} 0 1`;
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

  move(from, to, piecePokemonMap) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;
    const piece = this.board[fromY][fromX];
    const target = this.board[toY][toX];

    if (!piece) return { valid: false, error: 'No piece at the source' };

    if (!this.isValidMove(piece, from, to)) {
      return { valid: false, error: 'Invalid move' };
    }

    const attackingType = piecePokemonMap.get(`${fromX}${fromY}`)?.pokemonType;
    const defendingType = piecePokemonMap.get(`${toX}${toY}`)?.pokemonType;

    if (target) {
      if (isSuperEffective(attackingType, defendingType)) {
        this.board[toY][toX] = piece;
        this.board[fromY][fromX] = null;
      } else if (isNotVeryEffective(attackingType, defendingType) || isNeutral(attackingType, defendingType)) {
        this.board[toY][toX] = null;
        this.board[fromY][fromX] = null;
      }
    } else {
      this.board[toY][toX] = piece;
      this.board[fromY][fromX] = null;
    }

    // Handle pawn promotion
    if (piece.toLowerCase() === 'p' && (toY === 0 || toY === 7)) {
      this.board[toY][toX] = this.isWhite(piece) ? 'Q' : 'q'; // Promote to Queen for simplicity
    }

    // Handle castling
    if (piece.toLowerCase() === 'k' && Math.abs(fromX - toX) === 2) {
      if (toX === 6) { // Kingside castling
        this.board[toY][5] = this.board[toY][7];
        this.board[toY][7] = null;
      } else if (toX === 2) { // Queenside castling
        this.board[toY][3] = this.board[toY][0];
        this.board[toY][0] = null;
      }
    }

    // Update castling rights
    if (piece.toLowerCase() === 'k') {
      if (this.isWhite(piece)) {
        this.castlingRights.K = this.castlingRights.Q = false;
      } else {
        this.castlingRights.k = this.castlingRights.q = false;
      }
    } else if (piece.toLowerCase() === 'r') {
      if (fromX === 0 && fromY === 7) this.castlingRights.Q = false;
      if (fromX === 7 && fromY === 7) this.castlingRights.K = false;
      if (fromX === 0 && fromY === 0) this.castlingRights.q = false;
      if (fromX === 7 && fromY === 0) this.castlingRights.k = false;
    }

    if (target && target.toLowerCase() === 'k') {
      this.gameOver = true;
      this.winner = this.turn === 'w' ? 'White' : 'Black';
    }

    this.turn = this.turn === 'w' ? 'b' : 'w';

    return { valid: true, board: this.board, turn: this.turn, gameOver: this.gameOver, winner: this.winner };
  }

  isValidMove(piece, from, to) {
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
