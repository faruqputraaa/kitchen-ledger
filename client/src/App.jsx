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
import Recipes from './pages/Recipes';

const ProtectedRoute = ({ children }) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/Ingredients" element={<Ingredients />} />
            <Route path="/menus" element={
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-5xl mb-3">🍽️</div>
                  <h2 className="text-xl font-bold" style={{ color: '#1E293B' }}>Menu</h2>
                  <p className="text-sm mt-1" style={{ color: '#64748B' }}>Segera hadir</p>
                </div>
              </div>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
