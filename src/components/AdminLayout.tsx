import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Database,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, logout, dataSource, setDataSource } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If not admin, redirect
  if (!user || !isAdmin) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin',
      label: 'Panel General',
      icon: <LayoutDashboard className="w-5 h-5" />,
      end: true,
    },
    {
      to: '/admin/pedidos',
      label: 'Pedidos',
      icon: <ShoppingBag className="w-5 h-5" />,
      end: false,
    },
    {
      to: '/admin/comercios',
      label: 'Comercios',
      icon: <Store className="w-5 h-5" />,
      end: false,
    },
    {
      to: '/admin/productos',
      label: 'Productos y Stock',
      icon: <Package className="w-5 h-5" />,
      end: false,
    },
    {
      to: '/admin/facturacion',
      label: 'Facturación y Caja',
      icon: <Receipt className="w-5 h-5" />,
      end: false,
    },
    {
      to: '/admin/configuracion',
      label: 'Servidor y API',
      icon: <Settings className="w-5 h-5" />,
      end: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-18 px-6 border-b border-slate-800 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">Distrisoft</span>
                <span className="block text-[10px] font-bold text-teal-400 tracking-wider uppercase">
                  Admin Workspace
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <div className="px-3 py-6 space-y-1">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Operaciones
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-500 text-white font-bold shadow-md shadow-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* External Landing Link */}
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-400" />
              Ver Landing Web
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Admin User info card */}
          <div className="p-3 bg-slate-800/70 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 shrink-0 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-18 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden cursor-pointer"
              aria-label="Abrir barra lateral"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Distrisoft Admin
              </span>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                Consola de Administración
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Indicator & Switch Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              <button
                onClick={() => setDataSource('demo')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  dataSource === 'demo'
                    ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dataSource === 'demo' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                Demo Mocks
              </button>
              <button
                onClick={() => setDataSource('api')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  dataSource === 'api'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dataSource === 'api' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                API Real
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
