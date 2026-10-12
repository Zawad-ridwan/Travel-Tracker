import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/dm-sans';
import './styles/index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing <div id="root"> in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
