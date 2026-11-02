import React, { useState } from 'react';
import { Building2, CheckCircle2, ChevronRight, Loader2, Sparkles, Store } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { services } from '@/services';

type CommerceRegistrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CommerceRegistrationModal: React.FC<CommerceRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    tradeName: '',
    businessName: '',
    taxId: '',
    address: '',
    city: 'CABA',
    phone: '',
    email: '',
    branchName: 'Casa Central',
    sector: 'Almacén / Autoservicio',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredCommerce, setRegisteredCommerce] = useState<any | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.tradeName.trim()) {
      setError('Por favor completá el nombre de tu comercio.');
      return;
    }
    if (!formData.taxId.trim()) {
      setError('Por favor ingresá el CUIT o identificación fiscal.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Por favor completá la dirección principal.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await services.createCommerce({
        tradeName: formData.tradeName.trim(),
        businessName: formData.businessName.trim() || formData.tradeName.trim(),
        taxId: formData.taxId.trim(),
        address: formData.address.trim(),
        city: formData.city.trim() || 'CABA',
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        branchName: formData.branchName.trim() || 'Casa Central',
        tags: [formData.sector, 'Solicitud Web'],
        creditLimit: '150000.00',
      });
      setRegisteredCommerce(created);
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al registrar el comercio. Por favor intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRegisteredCommerce(null);
    setFormData({
      tradeName: '',
      businessName: '',
      taxId: '',
      address: '',
      city: 'CABA',
      phone: '',
      email: '',
      branchName: 'Casa Central',
      sector: 'Almacén / Autoservicio',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={registeredCommerce ? '¡Comercio Registrado con Éxito!' : 'Sumá tu Comercio a Distrisoft'}
      subtitle={
        registeredCommerce
          ? 'Tu cuenta ha sido dada de alta en nuestra red mayorista'
          : 'Completá los datos para acceder a precios mayoristas y entregas programadas'
      }
      maxWidth="2xl"
    >
      {registeredCommerce ? (
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h4 className="text-xl font-bold text-slate-900">
              ¡Bienvenido, {registeredCommerce.tradeName}!
            </h4>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Tu solicitud fue procesada correctamente. Ya podés operar con nosotros o ingresar con tus credenciales.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 text-left space-y-2 text-sm max-w-md mx-auto">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Comercio:</span>
              <span className="font-semibold text-slate-900">{registeredCommerce.tradeName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">CUIT:</span>
              <span className="font-medium text-slate-800">{registeredCommerce.taxId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Dirección:</span>
              <span className="font-medium text-slate-800">{registeredCommerce.address}, {registeredCommerce.city}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Línea de crédito inicial:</span>
              <span className="font-bold text-teal-700">$ 150.000,00</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Estado de cuenta:</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                ● ACTIVO
              </span>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Entendido, volver al inicio
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nombre de Fantasía *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  placeholder="Ej: Almacén Don Juan"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Razón Social (opcional)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Ej: Don Juan S.R.L."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                CUIT / Identificación Fiscal *
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="Ej: 30-71234567-8"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Rubro Comercial
              </label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              >
                <option value="Almacén / Autoservicio">Almacén / Autoservicio</option>
                <option value="Kiosco / Maxikiosco">Kiosco / Maxikiosco</option>
                <option value="Supermercado">Supermercado</option>
                <option value="Gastronomía / Bar">Gastronomía / Bar</option>
                <option value="Distribuidor minorista">Distribuidor minorista</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Dirección Comercial *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ej: Av. San Martín 1540"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Localidad / Ciudad *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ej: CABA / Morón / Quilmes"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                WhatsApp / Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: 11 4567-8900"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej: pedidos@donjuan.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3.5 flex items-start gap-3 mt-4">
            <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-900 leading-relaxed">
              <strong>Beneficio de bienvenida:</strong> Al registrar tu comercio contás con lista de precios exclusiva, entregas sin cargo en zonas habilitadas y crédito inicial para tus pedidos semanales.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  Confirmar Registro
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
