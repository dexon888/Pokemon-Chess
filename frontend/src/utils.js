export const initializePieces = (board) => {
  let pieces = {};
  console.log('Initializing pieces with board state:', board);
  board.forEach((row, y) => {
    row.forEach((piece, x) => {
      if (piece) {
        const color = piece === piece.toUpperCase() ? 'white' : 'black';
        pieces[`${x}${y}`] = {
          type: piece.toLowerCase(),
          color: color,
          pokemon: getPokemonForPiece({ type: piece.toLowerCase() }), // Assuming getPokemonForPiece works with the type
        };
        console.log(`Initialized piece at (${x}, ${y}):`, pieces[`${x}${y}`]);
      }
    });
  });
  console.log('Final pieces:', pieces);
  return pieces;
};

const getPokemonForPiece = (piece) => {
  const pokemonMap = {
    p: 'pikachu',
    r: 'charizard',
    n: 'bulbasaur',
    b: 'squirtle',
    q: 'mewtwo',
    k: 'raichu',
  };
  return pokemonMap[piece.type] || 'pokeball';
};
