import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PhotoboothProvider } from '@/context/PhotoboothContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PhotoboothProvider>
      <App />
    </PhotoboothProvider>
  </StrictMode>
);
