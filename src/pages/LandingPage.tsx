import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  HelpCircle,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import { CommerceRegistrationModal } from '@/components/CommerceRegistrationModal';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { formatMoney } from '@/lib/money';
import { services } from '@/services';
import type { Category, Product } from '@/types';

export const LandingPage: React.FC = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Fast inline lead capture
  const [inlineTradeName, setInlineTradeName] = useState('');
  const [inlineTaxId, setInlineTaxId] = useState('');
  const [inlinePhone, setInlinePhone] = useState('');

  useEffect(() => {
    Promise.all([services.listCategories(), services.listProducts()]).then(
      ([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      },
    );
  }, []);

  const displayedProducts = (
    activeCategory === 'ALL'
      ? products
      : products.filter((p) => p.categoryId === activeCategory)
  ).slice(0, 6);

  const faqs = [
    {
      q: '¿Qué comercios pueden registrarse en Distrisoft?',
      a: 'Distrisoft está diseñado para comercios minoristas: almacenes, autoservicios, kioscos, minimarkets y gastronómicos que buscan abastecerse con listas de precios mayoristas transparentes.',
    },
    {
      q: '¿Cómo funciona la línea de crédito y cuenta corriente?',
      a: 'Al dar de alta tu comercio, se te asigna un límite de crédito inicial para que puedas operar de inmediato. Podés pagar tus pedidos mediante transferencia bancaria o en efectivo al momento de recibir la mercadería.',
    },
    {
      q: '¿Cuál es la frecuencia y zona de entrega?',
      a: 'Contamos con recorridos diarios y programados en CABA y Gran Buenos Aires. El pedido se coordina con franja horaria para que no interrumpas la atención de tu local.',
    },
    {
      q: '¿Puedo comprar también desde el celular?',
      a: '¡Sí! Distrisoft cuenta con su aplicación móvil oficial conectada en tiempo real al mismo catálogo y stock central.',
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Navigation */}
      <Navbar onOpenRegisterModal={() => setIsRegisterModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 border-b border-slate-200/70">
        {/* Glow backdrop elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-teal-400/10 via-emerald-300/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold tracking-wide">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>La plataforma mayorista para tu negocio</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Abastecé tu comercio con{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                  precios directos
                </span>{' '}
                y entrega en tu puerta.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Olvidate de las filas y los sobreprecios. Distrisoft conecta a kioscos, almacenes y autoservicios con el catálogo centralizado más confiable, crédito comercial y entregas en 24/48 horas.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-teal-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Store className="w-5 h-5" />
                  <span>Sumá tu Comercio Gratis</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <a
                  href="#catalogo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base rounded-2xl border border-slate-200/90 shadow-xs transition-colors"
                >
                  <Package className="w-5 h-5 text-teal-600" />
                  <span>Ver Catálogo</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/70 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-2xl font-black text-slate-900">+150</div>
                  <div className="text-xs text-slate-500 font-medium">Comercios activos</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">24/48 hs</div>
                  <div className="text-xs text-slate-500 font-medium">Entregas programadas</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">$150.000</div>
                  <div className="text-xs text-slate-500 font-medium">Crédito inicial</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Simulator Preview */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Floating badge */}
                <div className="absolute -top-4 -right-2 z-20 bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Stock en tiempo real</span>
                </div>

                {/* Card Simulator */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 space-y-5 relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Almacén Los Andes</h4>
                        <p className="text-[11px] text-slate-400">Cliente #4870 · CABA</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Cuenta Activa
                    </span>
                  </div>

                  {/* Sample cart items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">Agua Mineral 1.5 L (x6)</p>
                        <p className="text-[10px] text-slate-400">Sierra Pura · 4 packs</p>
                      </div>
                      <span className="font-bold text-slate-900">$ 5.000,00</span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">Cerveza Rubia 473ml (x6)</p>
                        <p className="text-[10px] text-slate-400">Puerto Sur · 2 packs</p>
                      </div>
                      <span className="font-bold text-slate-900">$ 12.840,00</span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">Arroz Largo Fino 1kg</p>
                        <p className="text-[10px] text-slate-400">Don Felipe · 2 un</p>
                      </div>
                      <span className="font-bold text-slate-900">$ 3.960,00</span>
                    </div>
                  </div>

                  {/* Totals & Delivery snapshot */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Envío a comercio:</span>
                      <span className="text-emerald-600 font-bold">Sin costo ($ 0,00)</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-base pt-1">
                      <span>Total Mayorista:</span>
                      <span className="text-teal-700 font-black">$ 21.800,00</span>
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center gap-2.5 text-xs text-teal-900">
                    <Truck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Entrega programada para mañana 09:30 hs</span>
                  </div>

                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Quiero este beneficio para mi negocio</span>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Preview Section */}
      <section id="catalogo" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Catálogo de Alta Rotación
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Productos esenciales para tu estantería
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Bebidas, comestibles y limpieza con disponibilidad asegurada y stock en tiempo real.
            </p>

            {/* Category Filter */}
            <div className="flex items-center justify-center gap-2 mt-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos los Rubros
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === c.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {p.sku}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{p.brand}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.availableStock > 10
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.availableStock > 0 ? 'En Stock' : 'Agotado'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {p.description}
                  </p>

                  <div className="mt-3 text-xs text-slate-600 font-medium">
                    Presentación: <span className="font-semibold text-slate-800">{p.presentation}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Precio Mayorista
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {formatMoney(p.price)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <span>Pedir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Acceder al catálogo completo con más de 200 referencias</span>
              <ArrowRight className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              ¿Por qué elegir Distrisoft?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Construido para hacer crecer tu comercio
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Diseñamos cada herramienta pensando en las necesidades reales del comerciante argentino.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <BadgePercent className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Precios Mayoristas Netos</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sin intermediarios ni sorpresas en el ticket final. Accedé a escalas de precios por bulto cerrado y promociones semanales.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Crédito y Cuenta Corriente</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Financiá tus reposiciones. Límite de crédito inmediato para que tu stock nunca se corte en días de alta demanda.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Logística en tu Puerta</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ahorrá fletes, tiempo y combustible. Entregamos directo en la puerta de tu local con franjas horarias confirmadas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pedidos 24/7 Móvil y Web</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hacé tu pedido al cerrar caja por la noche o durante el descanso desde tu teléfono celular o cualquier computadora.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Paso a Paso
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Cómo empezar a comprar
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Un proceso ágil y 100% digital sin trámites burocráticos engorrosos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="text-center space-y-3 p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Registrá tu Comercio</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Completá el formulario con el nombre de tu local, CUIT y dirección de entrega. La activación es inmediata.
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Armá tu Pedido</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Navegá las categorías, seleccioná las cantidades deseadas y verificá el stock en tiempo real con precios mayoristas.
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Recibí y Pagá Cómodamente</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Llegamos a tu sucursal. Podés pagar en efectivo al fletero, por transferencia bancaria o debitarlo de tu cuenta corriente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Registration Form Section */}
      <section id="registro" className="py-20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 p-8 sm:p-12 shadow-2xl">
            <div className="max-w-2xl mx-auto text-center space-y-4 mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
                Alta Rápida Online
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Sumá tu negocio hoy mismo
              </h2>
              <p className="text-sm text-slate-400">
                Accedé de inmediato a precios diferenciales, crédito inicial de $150.000 y entregas sin cargo.
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-teal-500/20 transition-all hover:scale-105 cursor-pointer"
              >
                <Store className="w-5 h-5" />
                <span>Abrir Formulario de Registro</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-slate-400 mt-3">
                ¿Sos administrador de Distrisoft?{' '}
                <Link to="/login" className="text-teal-400 hover:underline font-bold">
                  Ingresá a la consola de gestión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Dudas Comunes
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200/90 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Registration Modal Dialog */}
      <CommerceRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};
