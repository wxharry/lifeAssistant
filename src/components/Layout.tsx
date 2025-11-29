import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, Utensils } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="app-header">
        <div className="container flex justify-between items-center" style={{ padding: '1rem 1.5rem' }}>
          <div className="flex items-center gap-2">
            <div style={{ 
              width: '32px', height: '32px', 
              background: 'var(--color-primary)', 
              borderRadius: '8px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold'
            }}>
              LA
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>LifeAssistant</h1>
          </div>
          
          <nav className="flex gap-1">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              <Calendar size={18} />
              Schedule
            </Link>
            <Link 
              to="/menu" 
              className={`nav-link ${isActive('/menu') ? 'active' : ''}`}
            >
              <Utensils size={18} />
              Menu
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="container" style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
