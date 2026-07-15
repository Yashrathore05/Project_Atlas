import React from 'react';
import ReactDOM from 'react-dom/client';
import { AtlasProvider } from './context/AtlasContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AtlasProvider>
      <App />
    </AtlasProvider>
  </React.StrictMode>
);
