# Distrisoft Web (Landing & Consola Admin)

Aplicación web moderna en **React 19**, **TypeScript**, **Tailwind CSS v4** y **Vite** para Distrisoft.

Incluye:
1. **Landing Page pública (`/`)**: Presentación comercial orientada a la captación y registro de comercios mayoristas (kioscos, almacenes, cadenas), catálogo destacado, beneficios de cuenta corriente y llamado a la acción.
2. **Consola Administrativa (`/admin`)**:
   - **Panel General**: Métricas de ventas, cobranzas y estado de inventario en tiempo real.
   - **Gestión de Pedidos**: Aprobación de pedidos, seguimiento por estados (`PENDING`, `CONFIRMED`, `PREPARING`, `DELIVERED`, `CANCELLED`), control de deudas y pagos, y botón para **Cargar Pedido para Cliente**.
   - **Directorio de Comercios**: Alta, edición y supervisión de comercios clientes con límites de crédito y sucursales.
   - **Catálogo y Stock**: Control de inventario mayorista con alerta de bajo stock y actualización de disponibilidad.
   - **Facturación y Caja (`/admin/facturacion`)**: Módulo contable completo. Registro de compras de mercadería a proveedores (**egresos** con ingreso automático a stock), registro de ventas cobradas (**ingresos**), filtros por fechas o períodos, y **descarga de resumen contable / extracto en PDF generado por la API**.
   - **Servidor y API**: Selector en caliente entre modo Demostración (`demo`) y API en tiempo real (`api`).

---

## 🚀 Puesta en Marcha Local

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev
```

Por defecto iniciará en `http://localhost:5173`.

---

## ⚙️ Conexión con `distri-api`

Crear un archivo `.env` en la raíz de `distri-web`:

```env
VITE_DATA_SOURCE=api
VITE_API_URL=http://localhost:3000
```

> **Nota:** También podés alternar el modo y la URL directamente desde la interfaz web en **/admin/configuracion** sin necesidad de reiniciar el servidor.

---

## 📦 Compilación para Producción

```bash
npm run build
```

El build optimizado se generará en la carpeta `dist/`.

### Despliegue en Vercel / Netlify / Render / Nginx
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Configurar rutas SPA (rewrites a `/index.html`) para que las rutas de `react-router-dom` funcionen directamente.
