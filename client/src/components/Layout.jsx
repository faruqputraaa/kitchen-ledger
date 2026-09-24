import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { getTheme, toggleTheme } from '../theme.js';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/settings/tenant', label: 'Tenant' },
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
  { to: '/settings/tenant', label: 'Tenant' },
  { to: '/ingredients', label: 'Bahan' },
  { to: '/categories', label: 'Kategori' },
  { to: '/suppliers', label: 'Supplier' },
  { to: '/purchases', label: 'Pembelian' },
  { to: '/recipes', label: 'Resep' },
  { to: '/menus', label: 'Menu' },
  { to: '/stock-adjustments', label: 'Riwayat Stok' },
  { to: '/admin/tenants', label: 'Admin Tenants', adminOnly: true },
];

export default function Layout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme());
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const dropdownRef = useRef(null);

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
  };

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
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--primary-light)'; e.target.style.color = 'var(--primary-dark)'; }}
      onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text-muted)'; }}>
      {l.label}
    </Link>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-alt)' }}>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 shadow-sm sticky top-0 z-40"
        style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link to="/dashboard" className="font-bold text-xl" style={{ color: 'var(--primary)' }}>
          Kitchen Ledger
        </Link>
        <div className="flex items-center gap-1" ref={dropdownRef}>
          {navLinks.map((l) =>
            l.children ? (
              <div key={l.label} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--primary-light)'; e.target.style.color = 'var(--primary-dark)'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text-muted)'; }}>
                  {l.label} ▾
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 shadow-lg rounded-lg py-1 min-w-[160px] z-50"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    {l.children.map((c) => (
                      <Link key={c.to} to={c.to} onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--primary-light)'; e.target.style.color = 'var(--primary-dark)'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text)'; }}>
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
          <button onClick={handleToggleTheme} aria-label="Ganti tema"
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-hover)' }}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {user?.name || user?.email || 'User'}
          </span>
          <button onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--accent)', border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-bg)' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Nav - Fixed top */}
      <nav className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 shadow-sm z-50"
        style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link to="/dashboard" className="font-bold text-lg" style={{ color: 'var(--primary)' }}>Kitchen</Link>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleTheme} aria-label="Ganti tema"
            className="p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 shadow-lg z-40 overflow-y-auto max-h-[calc(100vh-56px)]"
          style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          {flatNav.filter(l => !l.adminOnly || isSuperAdmin).map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className="block px-5 py-3 text-sm font-medium"
              style={{ color: 'var(--text)', borderBottom: '1px solid var(--surface-hover)' }}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block w-full text-left px-5 py-3 text-sm font-medium"
            style={{ color: 'var(--accent)' }}>
            Logout
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="pt-16 md:pt-14 px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}