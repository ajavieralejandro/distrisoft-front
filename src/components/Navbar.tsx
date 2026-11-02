import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Menu,
  ShieldCheck,
  Store,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type NavbarProps = {
  onOpenRegisterModal: () => void;
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenRegisterModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">
                Distrisoft
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200/60 rounded-md">
                Mayorista
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#beneficios" className="hover:text-teal-600 transition-colors">
              Beneficios
            </a>
            <a href="#catalogo" className="hover:text-teal-600 transition-colors">
              Catálogo
            </a>
            <a href="#como-funciona" className="hover:text-teal-600 transition-colors">
              Cómo Funciona
            </a>
            <a href="#faq" className="hover:text-teal-600 transition-colors">
              Preguntas
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onOpenRegisterModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4 text-teal-600" />
              Sumar mi comercio
            </button>

            {isAuthenticated && isAdmin ? (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Panel Admin
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
              >
                <UserCheck className="w-4 h-4 text-teal-400" />
                Ingresar
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenRegisterModal}
              className="px-3 py-1.5 text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-lg"
            >
              Sumar comercio
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2 font-medium text-slate-700 text-sm">
            <a
              href="#beneficios"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-50"
            >
              Beneficios para Comercios
            </a>
            <a
              href="#catalogo"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-50"
            >
              Catálogo Mayorista
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-50"
            >
              Cómo Funciona
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-50"
            >
              Preguntas Frecuentes
            </a>
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegisterModal();
              }}
              className="w-full py-2.5 px-4 text-center text-sm font-bold bg-teal-600 text-white rounded-xl shadow-xs"
            >
              Registrar mi Comercio
            </button>
            <Link
              to={isAuthenticated && isAdmin ? '/admin' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 text-center text-sm font-bold bg-slate-900 text-white rounded-xl"
            >
              {isAuthenticated && isAdmin ? 'Ir al Panel Admin' : 'Ingresar'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
