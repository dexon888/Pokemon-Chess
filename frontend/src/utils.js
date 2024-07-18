// src/utils.js
import axios from 'axios';

const POKEMON_API_URL = 'https://pokeapi.co/api/v2/pokemon';
const POKEMON_LIMIT = 1000;

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

const getPokemonType = async (pokemon) => {
  try {
    const response = await axios.get(`${POKEMON_API_URL}/${pokemon}`);
    return response.data.types[0].type.name;
  } catch (error) {
    console.error(`Error fetching type for ${pokemon}:`, error);
    return 'normal';
  }
};

export const initializePieces = async (board, piecePokemonMap = null) => {
  let pieces = {};

  if (!piecePokemonMap) {
    piecePokemonMap = {};
    const pieceTypes = ['p', 'r', 'n', 'b', 'q', 'k'];
    const allPokemonNames = await fetchAllPokemonNames();

    for (let type of pieceTypes) {
      piecePokemonMap[type] = getRandomPokemon(allPokemonNames);
    }
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
        const pokemonType = await getPokemonType(pokemon);

        pieces[`${x}${y}`] = {
          type: pieceType,
          color: color,
          pokemon: pokemon,
          sprite: sprite,
          pokemonType: pokemonType,
        };
        console.log(`Initialized piece at (${x}, ${y}):`, pieces[`${x}${y}`]);
      }
    }
  }
  console.log('Final pieces:', pieces);
  return { pieces, piecePokemonMap };
};
