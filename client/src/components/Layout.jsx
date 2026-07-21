import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ingredients', label: 'Ingredients' },   
  { to: '/purchases', label: 'Purchases' },
  { to: '/recipes', label: 'Recipes' },
];

export default function Layout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white shadow-sm"
        style={{ borderBottom: '1px solid #E2E8F0' }}>
        <Link to="/dashboard" className="font-bold text-xl" style={{ color: '#10B981' }}>
          Kitchen Ledger
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#64748B' }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#D1FAE5'; e.target.style.color = '#059669'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#64748B'; }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#64748B' }}>
            {user?.name || user?.email || 'User'}
          </span>
          <button onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#F97316', border: '1px solid #FED7AA', backgroundColor: '#FFF7ED' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm"
        style={{ borderBottom: '1px solid #E2E8F0' }}>
        <Link to="/dashboard" className="font-bold text-lg" style={{ color: '#10B981' }}>Kitchen</Link>
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg" style={{ borderBottom: '1px solid #E2E8F0' }}>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className="block px-5 py-3 text-sm font-medium"
              style={{ color: '#1E293B', borderBottom: '1px solid #F1F5F9' }}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block w-full text-left px-5 py-3 text-sm font-medium"
            style={{ color: '#F97316' }}>
            Logout
          </button>
        </div>
      )}

      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
