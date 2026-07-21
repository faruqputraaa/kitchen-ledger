import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/login', values);
      setAuth(data.data.user, data.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError('password', { message: err.response?.data?.message || 'Login gagal' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #D1FAE5 0%, #F8FAFC 50%, #FEF3C7 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3" style={{ backgroundColor: '#10B981' }}>
            <span className="text-white font-bold text-2xl">KL</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1E293B' }}>Kitchen Ledger</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Inventaris & Resep Manager</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#1E293B' }}>Masuk ke akun kamu</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Email</label>
              <input type="email" {...register('email')} placeholder="nama@email.com" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Password</label>
              <input type="password" {...register('password')} placeholder="••••••••" autoComplete="current-password" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? 'Memuat...' : 'Masuk'}
            </button>
            <div className="relative flex items-center gap-3 my-2">
              <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
              <span className="text-xs" style={{ color: '#94A3B8' }}>atau</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
            </div>
            <a href="/api/v1/auth/google" className="btn-secondary w-full text-center">
              Masuk dengan Google
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
