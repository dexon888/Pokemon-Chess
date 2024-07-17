import axios from 'axios';

const POKEMON_API_URL = 'https://pokeapi.co/api/v2/pokemon';
const POKEMON_LIMIT = 1000; // Set this to the total number of Pokémon available

export const fetchAllPokemonNames = async () => {
  try {
    const response = await axios.get(`${POKEMON_API_URL}?limit=${POKEMON_LIMIT}`);
    const pokemonNames = response.data.results.map(pokemon => pokemon.name);
    return pokemonNames;
  } catch (error) {
    console.error('Error fetching all Pokémon names:', error);
    return [];
  }
};

const getRandomPokemon = (pokemonList) => {
  const randomIndex = Math.floor(Math.random() * pokemonList.length);
  return pokemonList[randomIndex];
};

const fetchPokemonSprite = async (pokemon) => {
  try {
    const response = await axios.get(`${POKEMON_API_URL}/${pokemon}`);
    return response.data.sprites.front_default;
  } catch (error) {
    console.error(`Error fetching sprite for ${pokemon}:`, error);
    return null;
  }
};

export const initializePieces = async (board) => {
  let pieces = {};
  let piecePokemonMap = {};
  const pieceTypes = ['p', 'r', 'n', 'b', 'q', 'k'];

  // Fetch all Pokémon names
  const allPokemonNames = await fetchAllPokemonNames();

  // Assign a random Pokémon for each piece type
  for (let type of pieceTypes) {
    piecePokemonMap[type] = getRandomPokemon(allPokemonNames);
  }

  console.log('Initializing pieces with board state:', board);
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const piece = board[y][x];
      if (piece) {
        const color = piece === piece.toUpperCase() ? 'white' : 'black';
        const pieceType = piece.toLowerCase();
        const pokemon = piecePokemonMap[pieceType];
        const sprite = await fetchPokemonSprite(pokemon);

        pieces[`${x}${y}`] = {
          type: pieceType,
          color: color,
          pokemon: pokemon,
          sprite: sprite,
        };
        console.log(`Initialized piece at (${x}, ${y}):`, pieces[`${x}${y}`]);
      }
    }
  }
  console.log('Final pieces:', pieces);
  return pieces;
};
