import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import useAuthStore from './store/authStore';

import Layout from './components/Layout';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Ingredients from './pages/Ingredients';
import IngredientDetail from './pages/IngredientDetail';
import Recipes from './pages/Recipes';
import Categories from './pages/Categories';
import Menus from './pages/Menus';
import Suppliers from './pages/Suppliers';
import PurchaseDetail from './pages/PurchaseDetail';
import StockAdjustment from './pages/StockAdjustment';
import Invite from './pages/Invite';
import TenantSettings from './pages/TenantSettings';
import AdminTenants from './pages/AdminTenants';

const ProtectedRoute = ({ children }) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  if (!isAuth) return <Navigate to="/login" replace />;
  // SUPER_ADMIN boleh akses tanpa tenant
  if (user?.role === 'SUPER_ADMIN') return children;
  const hasTenant = (() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'SUPER_ADMIN') return true;
      return !!payload.tenantId;
    } catch { return !!user?.tenantId; }
  })();
  if (!hasTenant) return <Navigate to="/onboarding/invite" replace />;
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/onboarding/invite" element={<Invite />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/purchases/:id" element={<PurchaseDetail />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route path="/ingredients/:id" element={<IngredientDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/stock-adjustments" element={<StockAdjustment />} />
            <Route path="/settings/tenant" element={<TenantSettings />} />
            <Route path="/admin/tenants" element={<AdminTenants />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;