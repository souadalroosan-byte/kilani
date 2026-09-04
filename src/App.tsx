import { useEffect, useState } from 'react';
import { PublicSite } from '@/components/PublicSite';
import { AdminDashboard } from '@/components/AdminDashboard';

function getRoute() {
  return window.location.hash.startsWith('#/admin') ? 'admin' : 'public';
}

function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route === 'admin' ? <AdminDashboard /> : <PublicSite />;
}

export default App;
