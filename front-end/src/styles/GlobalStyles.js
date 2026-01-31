/**
 * Global Styles (Styled-Components)
 * Defines CSS Variables (Custom Properties) for Theming.
 * Handles the Light/Dark mode color switching using props.
 */
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --primary: #2563eb;
    --secondary: #E67E22;
    --accent: #D35400;
    --background: ${props => props.theme === 'light' ? '#f4f4f9' : '#121212'};
    --text: ${props => props.theme === 'light' ? '#333333' : '#e0e0e0'};
    --white: ${props => props.theme === 'light' ? '#1a1a1a' : '#ffffff'};
    --gray: ${props => props.theme === 'light' ? '#e9ecef' : '#2C2C2C'};
    --border: ${props => props.theme === 'light' ? '#dee2e6' : '#333333'};
    --card-bg: ${props => props.theme === 'light' ? '#ffffff' : '#1E1E1E'};
    --input-bg: ${props => props.theme === 'light' ? '#f8f9fa' : '#2C2C2C'};
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    background-color: var(--background);
    color: var(--text);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--white);
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }
`;
