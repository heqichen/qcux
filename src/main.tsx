import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles reset
const style = document.createElement('style');
style.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body, #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    color: #333;
  }
  input:focus, button:focus {
    outline: 2px solid #4A90D9;
    outline-offset: -1px;
  }
  button:disabled {
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
