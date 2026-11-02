import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Radio,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { probeServer } from '@/api/http';
import { getDefaultApiBaseUrl, setApiBaseUrl } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { mockStore } from '@/services/mock-store';

export const AdminSettingsPage: React.FC = () => {
  const { dataSource, setDataSource } = useAuth();
  const [apiUrl, setApiUrlState] = useState(getDefaultApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setPingResult(null);
    try {
      const res = await probeServer(apiUrl);
      setPingResult({
        ok: res.ok,
        message: res.ok
          ? 'Servidor API responde correctamente (/health OK).'
          : `No se pudo conectar: ${res.message}`,
      });
    } catch (e: any) {
      setPingResult({
        ok: false,
        message: e?.message || 'Error desconocido al probar conexión.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveUrl = () => {
    setApiBaseUrl(apiUrl.trim());
    setSaveMessage('Dirección guardada exitosamente.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleResetMocks = () => {
    if (confirm('¿Restablecer datos de prueba a sus valores originales?')) {
      mockStore.reset();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Configuración y Servidor API
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Conexión con el backend `distri-api`, diagnóstico de salud y modo de datos
        </p>
      </div>

      {/* Mode Selection Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Modo de Datos Activo</h3>
            <p className="text-xs text-slate-500">
              Elegí si la aplicación interactúa con datos simulados o realiza peticiones reales al backend
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Demo Mode */}
          <div
            onClick={() => setDataSource('demo')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              dataSource === 'demo'
                ? 'border-teal-600 bg-teal-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">Modo Demostración</span>
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  dataSource === 'demo'
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {dataSource === 'demo' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Utiliza fixtures y almacenamiento local en el navegador. Ideal para pruebas de diseño y navegación sin necesidad de un backend o base PostgreSQL activa.
            </p>
          </div>

          {/* API Real Mode */}
          <div
            onClick={() => setDataSource('api')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              dataSource === 'api'
                ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">Modo API Real (distri-api)</span>
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  dataSource === 'api'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {dataSource === 'api' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Habla directamente con el servidor NestJS (`distri-api`). Valida JWT, idempotencia de pedidos y transacciones con la base de datos real.
            </p>
          </div>
        </div>
      </div>

      {/* API Endpoint Configuration & Ping */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">URL del Servidor API</h3>
            <p className="text-xs text-slate-500">
              Dirección base para las peticiones HTTP (`/auth`, `/orders`, `/commerces`, `/products`)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Host / Dirección Base
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrlState(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Guardar URL
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Probar Conexión
                  </>
                )}
              </button>
            </div>
            {saveMessage && (
              <span className="text-xs text-emerald-600 font-bold mt-1 block">
                {saveMessage}
              </span>
            )}
          </div>

          {pingResult && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200 ${
                pingResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {pingResult.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{pingResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reset Fixtures Tool */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Restablecer Datos de Demostración</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Restaura las categorías, productos, pedidos y comercios mock originales de Distrisoft.
          </p>
        </div>
        <button
          onClick={handleResetMocks}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Restablecer Mocks
        </button>
      </div>
    </div>
  );
};
