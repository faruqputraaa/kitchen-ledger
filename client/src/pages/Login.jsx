import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
});

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const handleLogin = async (values) => {
    try {
      setGlobalError('');
      const { data } = await api.post('/auth/login', values);
      setAuth(data.data.user, data.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Login gagal. Cek email & password.');
    }
  };

  const handleRegister = async (values) => {
    try {
      setGlobalError('');
      const { data } = await api.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setAuth(data.data.user, data.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Registrasi gagal. Email mungkin sudah digunakan.');
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setGlobalError('');
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <span className="font-bold text-3xl" style={{ color: '#10B981' }}>KL</span>
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">Kitchen Ledger</h1>
          <p className="text-sm mt-2 text-white/80">Inventaris & Resep Manager</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-xl">
          <div className="flex mb-4 border-b" style={{ borderColor: '#E2E8F0' }}>
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${!isRegister ? 'border-b-2' : ''}`}
              style={{ 
                color: !isRegister ? '#10B981' : '#64748B',
                borderColor: !isRegister ? '#10B981' : 'transparent',
              }}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${isRegister ? 'border-b-2' : ''}`}
              style={{ 
                color: isRegister ? '#10B981' : '#64748B',
                borderColor: isRegister ? '#10B981' : 'transparent',
              }}
            >
              Daftar
            </button>
          </div>

          {globalError && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              {globalError}
            </div>
          )}

          {!isRegister ? (
            /* Login Form */
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email"
                  {...loginForm.register('email')}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Password
                </label>
                <input
                  type="password"
                  {...loginForm.register('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="btn-primary w-full"
              >
                {loginForm.formState.isSubmitting ? 'Memuat...' : 'Masuk'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  {...registerForm.register('name')}
                  placeholder="Nama kamu"
                  className="w-full"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email"
                  {...registerForm.register('email')}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Password
                </label>
                <input
                  type="password"
                  {...registerForm.register('password')}
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  className="w-full"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  {...registerForm.register('confirmPassword')}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  className="w-full"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="btn-primary w-full"
              >
                {registerForm.formState.isSubmitting ? 'Memuat...' : 'Daftar'}
              </button>
            </form>
          )}

          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
            <span className="text-xs" style={{ color: '#94A3B8' }}>atau</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
          </div>

          <a
            href={`${import.meta.env.VITE_API_URL}/auth/google`}
            className="btn-secondary w-full text-center flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Masuk dengan Google
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-white/80 text-sm mt-6">
          © 2026 Kitchen Ledger
        </p>
      </div>
    </div>
  );
}