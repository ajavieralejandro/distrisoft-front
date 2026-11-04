import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getDefaultApiBaseUrl } from '@/config';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, loginDemoAdmin, dataSource, setDataSource, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as Admin, redirect cleanly
  React.useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Ingresá tu correo electrónico');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/admin');
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión. Verificá tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    loginDemoAdmin();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Landing link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la landing principal
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10 relative z-10">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-500/25 mb-4">
              <Boxes className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Distrisoft Panel
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Acceso a la plataforma administrativa mayorista
            </p>
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-slate-100 p-1 rounded-xl text-xs font-bold inline-flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setDataSource('demo')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dataSource === 'demo'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Modo Demo
              </button>
              <button
                type="button"
                onClick={() => setDataSource('api')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  dataSource === 'api'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Database className="w-3 h-3 text-emerald-600" />
                API Real
              </button>
            </div>
          </div>

          {/* Quick Demo Access Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-2xl text-xs font-bold text-teal-900 transition-all cursor-pointer group shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              <span>Entrar directo como Administrador (Demo)</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-3 text-slate-400">O ingresá con email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold leading-relaxed">{error}</p>
                  {(error.includes('8443') || error.includes('puerto') || error.includes('CORS') || error.includes('SSL') || error.includes('conexión')) && (
                    <p className="text-[11px] text-rose-700/90 pt-0.5">
                      Tip: Si el navegador no confía en el certificado SSL de la API en el puerto 8443,{' '}
                      <a
                        href={`${getDefaultApiBaseUrl().replace(/\/+$/, '')}/health`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold hover:text-rose-950"
                      >
                        hacé clic acá para abrir la API y aceptarlo
                      </a>.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pruebas.distrisoft.local"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Test hints */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Perfil canónico de administración. Para comercios que deseen sumarse, registrarse desde la landing pública.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
