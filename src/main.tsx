import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FireworksShow } from './fireworks/FireworksShow.tsx';
import { TeamCoordinatorsPage } from './team coordinatiors/TeamCoordinatorsPage.tsx';
import './index.css';

/**
 * Isolated Router:
 * - Default route ('/'): untouched existing website (<App />).
 * - Standalone fireworks route ('/fireworks' or '?fireworks'): pure Three.js fireworks (<FireworksShow />).
 * - Team Coordinators route ('/team', '?team', '/team-coordinators', or '/team-coordinatiors'): (<TeamCoordinatorsPage />).
 */
function RootRouter() {
  const checkCurrentRoute = () => {
    if (typeof window === 'undefined') return { isFireworks: false, isTeam: false };
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    const isFireworks =
      path.startsWith('/fireworks') || search.includes('fireworks') || hash === '#fireworks';

    const isTeam =
      path.includes('team') ||
      search.includes('team') ||
      hash.includes('team') ||
      path.includes('coordinat') ||
      search.includes('coordinat');

    return { isFireworks, isTeam };
  };

  const [route, setRoute] = useState(checkCurrentRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(checkCurrentRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  if (route.isFireworks) {
    return <FireworksShow onClose={() => { window.location.href = '/'; }} />;
  }

  if (route.isTeam) {
    return <TeamCoordinatorsPage onBackToMain={() => { window.location.href = '/'; }} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
