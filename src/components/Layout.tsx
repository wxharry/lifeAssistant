import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Utensils, LogOut } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      alert('Failed to logout: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

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
          
          <nav className="flex gap-1 items-center">
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
            <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{user?.email}</span>
              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                title="Logout"
                style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </nav>
        </div>
      </header>
      
      <main style={{ flex: 1, width: '100%', padding: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
