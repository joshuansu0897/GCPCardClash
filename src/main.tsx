/**
 * Browser entrypoint mounting the GCP Card Clash SPA.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles/tokens-and-shell.css';
import './styles/board-and-dialogs.css';
import './styles/hand-and-match-hud.css';
import './styles/incident-fx.css';
import './styles/immersive-hud.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Missing #root container element in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
