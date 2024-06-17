import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff4081', // Cyberpunk pink
    },
    secondary: {
      main: '#80d8ff', // Cyberpunk blue
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1d1d1d', // Slightly lighter dark background for paper
    },
    text: {
      primary: '#ffffff', // White text
      secondary: '#b0bec5', // Light gray text
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

export default theme;
