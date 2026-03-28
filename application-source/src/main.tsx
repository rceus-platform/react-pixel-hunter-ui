/**
 * Application Entry Point
 *
 * Responsibilities:
 * - Bootstraps the React application
 * - Renders the root App component into the DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
