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
            <Route path="/purchases/:id" element={<PurchaseDetail />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route path="/ingredients/:id" element={<IngredientDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/suppliers" element={<Suppliers />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;