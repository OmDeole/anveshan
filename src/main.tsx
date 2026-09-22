import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FireworksShow } from './fireworks/FireworksShow.tsx';
import './index.css';

/**
 * Isolated Router:
 * - Default route ('/'): untouched existing website (<App />).
 * - Standalone fireworks route ('/fireworks' or '?fireworks'): pure Three.js fireworks (<FireworksShow />).
 */
function RootRouter() {
  const [isFireworks, setIsFireworks] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/fireworks') || search.includes('fireworks') || hash === '#fireworks';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsFireworks(path.startsWith('/fireworks') || search.includes('fireworks') || hash === '#fireworks');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (isFireworks) {
    return <FireworksShow onClose={() => { window.location.href = '/'; }} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
