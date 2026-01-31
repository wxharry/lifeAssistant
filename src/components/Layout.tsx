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
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="app-header">
        <div className="container-app flex justify-between items-center py-4 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              LA
            </div>
            <h1 className="text-xl font-bold">LifeAssistant</h1>
          </div>
          
          <nav className="flex gap-1 items-center">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Schedule</span>
            </Link>
            <Link 
              to="/menu" 
              className={`nav-link ${isActive('/menu') ? 'active' : ''}`}
            >
              <Utensils size={18} />
              <span className="hidden sm:inline">Menu</span>
            </Link>
            <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden md:inline">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="btn btn-ghost p-1.5 flex items-center"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full p-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
