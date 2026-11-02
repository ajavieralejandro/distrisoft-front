import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  Edit2,
  ExternalLink,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Tag,
  X,
} from 'lucide-react';
import { CommerceStatusBadge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { AdminCreateOrderModal } from '@/components/AdminCreateOrderModal';
import { formatMoney } from '@/lib/money';
import { services } from '@/services';
import type { Commerce } from '@/types';

export const AdminCommercesPage: React.FC = () => {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommerce, setEditingCommerce] = useState<Commerce | null>(null);
  const [viewingCommerce, setViewingCommerce] = useState<Commerce | null>(null);
  const [orderModalCommerceId, setOrderModalCommerceId] = useState<string | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add form
  const [addForm, setAddForm] = useState({
    tradeName: '',
    businessName: '',
    taxId: '',
    address: '',
    city: 'CABA',
    phone: '',
    email: '',
    tags: 'Cliente frecuente, Zona norte',
    creditLimit: '150000.00',
    branchName: 'Casa Central',
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    tradeName: '',
    businessName: '',
    taxId: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    tags: '',
    creditLimit: '',
    status: 'ACTIVE' as Commerce['status'],
  });

  const loadCommerces = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await services.listCommerces();
      setCommerces(data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar comercios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommerces();
  }, []);

  const filteredCommerces = commerces.filter((c) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.tradeName.toLowerCase().includes(s) ||
      c.businessName.toLowerCase().includes(s) ||
      c.taxId.includes(s) ||
      c.city.toLowerCase().includes(s) ||
      c.tags.some((t) => t.toLowerCase().includes(s))
    );
  });

  const handleOpenEdit = (c: Commerce) => {
    setEditingCommerce(c);
    setEditForm({
      tradeName: c.tradeName,
      businessName: c.businessName,
      taxId: c.taxId,
      address: c.address,
      city: c.city,
      phone: c.phone,
      email: c.email,
      tags: c.tags.join(', '),
      creditLimit: c.creditLimit,
      status: c.status,
    });
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!addForm.tradeName.trim() || !addForm.taxId.trim() || !addForm.address.trim()) {
      setFormError('Por favor completá nombre comercial, CUIT y dirección.');
      return;
    }
    setIsSubmitting(true);
    try {
      const tagsArray = addForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await services.createCommerce({
        tradeName: addForm.tradeName.trim(),
        businessName: addForm.businessName.trim() || addForm.tradeName.trim(),
        taxId: addForm.taxId.trim(),
        address: addForm.address.trim(),
        city: addForm.city.trim() || 'CABA',
        phone: addForm.phone.trim(),
        email: addForm.email.trim(),
        tags: tagsArray,
        creditLimit: addForm.creditLimit.trim() || '0.00',
        branchName: addForm.branchName.trim() || 'Casa Central',
      });
      setCommerces((prev) => [created, ...prev]);
      setShowAddModal(false);
      setAddForm({
        tradeName: '',
        businessName: '',
        taxId: '',
        address: '',
        city: 'CABA',
        phone: '',
        email: '',
        tags: 'Cliente frecuente, Zona norte',
        creditLimit: '150000.00',
        branchName: 'Casa Central',
      });
    } catch (err: any) {
      setFormError(err?.message || 'Error al crear comercio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommerce) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const tagsArray = editForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await services.updateCommerce(editingCommerce.id, {
        tradeName: editForm.tradeName.trim(),
        businessName: editForm.businessName.trim(),
        taxId: editForm.taxId.trim(),
        address: editForm.address.trim(),
        city: editForm.city.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        tags: tagsArray,
        creditLimit: editForm.creditLimit.trim(),
        status: editForm.status,
      });

      setCommerces((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCommerce(null);
    } catch (err: any) {
      setFormError(err?.message || 'Error al actualizar comercio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Directorio de Comercios Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Alta, supervisión y límites de crédito para almacenes, kioscos y cadenas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadCommerces}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 shadow-xs cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Comercio
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, CUIT, localidad o etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table of Commerces */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Cargando clientes mayoristas...</p>
          </div>
        ) : filteredCommerces.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron comercios</h3>
            <p className="text-xs text-slate-400 mt-1">
              Probá con otro término de búsqueda o registrá uno nuevo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Comercio</th>
                  <th className="py-3 px-4">Identificación Fiscal</th>
                  <th className="py-3 px-4">Ubicación / Contacto</th>
                  <th className="py-3 px-4">Etiquetas</th>
                  <th className="py-3 px-4">Límite de Crédito</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCommerces.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setViewingCommerce(c)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors text-sm">
                        {c.tradeName}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.businessName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {c.taxId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.address}, {c.city}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">
                        {formatMoney(c.creditLimit)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CommerceStatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOrderModalCommerceId(c.id)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Cargar Pedido para este Comercio"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewingCommerce(c)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver Ficha y Sucursales"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Comercio"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Commerce Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Alta de Nuevo Comercio"
          subtitle="Registrá un nuevo comercio para permitirle operar en la plataforma"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre de Fantasía *
                </label>
                <input
                  type="text"
                  value={addForm.tradeName}
                  onChange={(e) => setAddForm({ ...addForm, tradeName: e.target.value })}
                  placeholder="Ej: Kiosco Belgrano"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={addForm.businessName}
                  onChange={(e) => setAddForm({ ...addForm, businessName: e.target.value })}
                  placeholder="Ej: Belgrano Retail S.A."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  CUIT / Identificación Fiscal *
                </label>
                <input
                  type="text"
                  value={addForm.taxId}
                  onChange={(e) => setAddForm({ ...addForm, taxId: e.target.value })}
                  placeholder="30-71234567-8"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Límite de Crédito (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addForm.creditLimit}
                  onChange={(e) => setAddForm({ ...addForm, creditLimit: e.target.value })}
                  placeholder="150000.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Dirección Principal *
                </label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  placeholder="Av. Cabildo 2200"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ciudad / Localidad
                </label>
                <input
                  type="text"
                  value={addForm.city}
                  onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                  placeholder="CABA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="11 4455-6677"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="compras@comercio.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Etiquetas (separadas por coma)
              </label>
              <input
                type="text"
                value={addForm.tags}
                onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })}
                placeholder="Cliente frecuente, Kiosco, Zona oeste"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Guardando...' : 'Dar de Alta Comercio'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Commerce Modal */}
      {editingCommerce && (
        <Modal
          isOpen={Boolean(editingCommerce)}
          onClose={() => setEditingCommerce(null)}
          title={`Editar Comercio: ${editingCommerce.tradeName}`}
          subtitle="Modificá los datos comerciales, crediticios o estado"
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre de Fantasía
                </label>
                <input
                  type="text"
                  value={editForm.tradeName}
                  onChange={(e) => setEditForm({ ...editForm, tradeName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  CUIT
                </label>
                <input
                  type="text"
                  value={editForm.taxId}
                  onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Límite de Crédito (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.creditLimit}
                  onChange={(e) => setEditForm({ ...editForm, creditLimit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Etiquetas
              </label>
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCommerce(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Commerce Modal (Ficha Comercial y Sucursales) */}
      {viewingCommerce && (
        <Modal
          isOpen={Boolean(viewingCommerce)}
          onClose={() => setViewingCommerce(null)}
          title={`Ficha Comercial: ${viewingCommerce.tradeName}`}
          subtitle={`CUIT: ${viewingCommerce.taxId}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Razón Social:</span>
                <span className="font-bold text-slate-900">{viewingCommerce.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Límite de Crédito:</span>
                <span className="font-bold text-teal-800">{formatMoney(viewingCommerce.creditLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado Comercial:</span>
                <CommerceStatusBadge status={viewingCommerce.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dirección:</span>
                <span className="text-slate-800">{viewingCommerce.address}, {viewingCommerce.city}</span>
              </div>
              {viewingCommerce.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="text-slate-800">{viewingCommerce.phone}</span>
                </div>
              )}
              {viewingCommerce.email && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800">{viewingCommerce.email}</span>
                </div>
              )}
            </div>

            {/* Branches / Sucursales */}
            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2">
                Sucursales Habilitadas ({viewingCommerce.branches?.length || 1})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {(viewingCommerce.branches && viewingCommerce.branches.length > 0
                  ? viewingCommerce.branches
                  : [
                      {
                        id: 'br-default',
                        name: 'Casa Central',
                        address: viewingCommerce.address,
                        phone: viewingCommerce.phone || '—',
                      },
                    ]
                ).map((branch) => (
                  <div key={branch.id} className="p-3 space-y-0.5">
                    <p className="font-bold text-slate-800">{branch.name}</p>
                    <p className="text-slate-500">{branch.address}</p>
                    {branch.phone && (
                      <p className="text-slate-400 text-[11px]">Tel: {branch.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  const targetId = viewingCommerce.id;
                  setViewingCommerce(null);
                  setOrderModalCommerceId(targetId);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Cargar Pedido para {viewingCommerce.tradeName}
              </button>
              <button
                onClick={() => setViewingCommerce(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Order Creation Modal */}
      {orderModalCommerceId && (
        <AdminCreateOrderModal
          isOpen={Boolean(orderModalCommerceId)}
          onClose={() => setOrderModalCommerceId(null)}
          initialCommerceId={orderModalCommerceId}
          onOrderCreated={() => {
            setOrderModalCommerceId(null);
          }}
        />
      )}
    </div>
  );
};
