import React from 'react';
import { Boxes, Heart, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Distrisoft</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma tecnológica de distribución mayorista para almacenes, kioscos y autoservicios. Eficiencia, catálogo en tiempo real y logística integrada.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Para Comercios
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#beneficios" className="hover:text-teal-400 transition-colors">
                  Precios Mayoristas
                </a>
              </li>
              <li>
                <a href="#catalogo" className="hover:text-teal-400 transition-colors">
                  Catálogo de Productos
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-teal-400 transition-colors">
                  Entregas y Envíos
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-teal-400 transition-colors">
                  Cuenta Corriente y Saldo
                </a>
              </li>
            </ul>
          </div>

          {/* Administration */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Gestión Interna
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors">
                  Acceso Administrador
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-teal-400 transition-colors">
                  Panel de Control (KPIs)
                </Link>
              </li>
              <li>
                <Link to="/admin/pedidos" className="hover:text-teal-400 transition-colors">
                  Supervisión de Pedidos
                </Link>
              </li>
              <li>
                <Link to="/admin/configuracion" className="hover:text-teal-400 transition-colors">
                  Estado de Conexión API
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Contacto y Depósito
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Centro de Distribución Central, Buenos Aires</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>+54 (11) 4567-2200</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>contacto@distrisoft.local</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Distrisoft. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistemas Operativos 100% Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
