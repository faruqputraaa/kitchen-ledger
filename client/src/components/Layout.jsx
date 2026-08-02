import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/authStore';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  {
    label: 'Data',
    children: [
      { to: '/ingredients', label: 'Bahan' },
      { to: '/categories', label: 'Kategori' },
      { to: '/suppliers', label: 'Supplier' },
    ],
  },
  { to: '/purchases', label: 'Pembelian' },
  { to: '/recipes', label: 'Resep' },
  { to: '/menus', label: 'Menu' },
  { to: '/stock-adjustments', label: 'Riwayat Stok' },
];

const flatNav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ingredients', label: 'Bahan' },
  { to: '/categories', label: 'Kategori' },
  { to: '/suppliers', label: 'Supplier' },
  { to: '/purchases', label: 'Pembelian' },
  { to: '/recipes', label: 'Resep' },
  { to: '/menus', label: 'Menu' },
  { to: '/stock-adjustments', label: 'Riwayat Stok' },
];

export default function Layout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const navItemStyle = (l) => (
    <Link key={l.to} to={l.to}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors block whitespace-nowrap"
      style={{ color: '#64748B' }}
      onMouseEnter={(e) => { e.target.style.backgroundColor = '#D1FAE5'; e.target.style.color = '#059669'; }}
      onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#64748B'; }}>
      {l.label}
    </Link>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white shadow-sm sticky top-0 z-40"
        style={{ borderBottom: '1px solid #E2E8F0' }}>
        <Link to="/dashboard" className="font-bold text-xl" style={{ color: '#10B981' }}>
          Kitchen Ledger
        </Link>
        <div className="flex items-center gap-1" ref={dropdownRef}>
          {navLinks.map((l) =>
            l.children ? (
              <div key={l.label} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: '#64748B' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#D1FAE5'; e.target.style.color = '#059669'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#64748B'; }}>
                  {l.label} ▾
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-1 min-w-[160px] z-50"
                    style={{ border: '1px solid #E2E8F0' }}>
                    {l.children.map((c) => (
                      <Link key={c.to} to={c.to} onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm transition-colors"
                        style={{ color: '#1E293B' }}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = '#D1FAE5'; e.target.style.color = '#059669'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#1E293B'; }}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : navItemStyle(l)
          )}
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

      {/* Mobile Nav - Fixed top */}
      <nav className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-white shadow-sm z-50"
        style={{ borderBottom: '1px solid #E2E8F0' }}>
        <Link to="/dashboard" className="font-bold text-lg" style={{ color: '#10B981' }}>Kitchen</Link>
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-white shadow-lg z-40 overflow-y-auto max-h-[calc(100vh-56px)]"
          style={{ borderBottom: '1px solid #E2E8F0' }}>
          {flatNav.map((l) => (
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

      {/* Main content */}
      <main className="pt-14 md:pt-0 px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}