import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/axios';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      setAuth({ role: 'OWNER' }, token);
      api.get('/auth/me')
        .then((res) => { if (res.data?.data) setAuth(res.data.data, token); })
        .finally(() => navigate('/dashboard'));
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [params, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full mx-auto mb-3" style={{ backgroundColor: '#D1FAE5' }}>
          <div className="w-8 h-8 rounded-full mx-auto" style={{ backgroundColor: '#10B981' }} />
        </div>
        <p className="text-sm" style={{ color: '#64748B' }}>Sedang masuk...</p>
      </div>
    </div>
  );
}
