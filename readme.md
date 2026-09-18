# Sistema de Gestión de Stock - Informática 💻

Plataforma web interna para el control de inventario, el registro de préstamos de equipos y las alertas de reposición del Departamento de Informática del **Colegio San José de la Providencia**. Corre 100% local.

## Tecnologías

- **Frontend:** React 19 + Vite + Tailwind CSS v4 (azul marino y blanco)
- **Backend:** NestJS (API REST) + TypeORM
- **Base de datos:** PostgreSQL 18 instalado en la PC (sin Docker)

## Estructura

```text
sanjoInventario/
├── backend/    API REST en NestJS
├── frontend/   Aplicación React (Vite)
├── docs/       Diseño y planes de implementación
└── readme.md
```

## Requisitos

Node 24 y PostgreSQL 18 corriendo en `localhost:5432`.

## Puesta en marcha

1. **Bases de datos** (una sola vez; pide la contraseña del usuario `postgres`). Si ya existen, este paso se saltea:

   ```powershell
   $psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
   @'
   CREATE DATABASE "InventarioInformatica";
   CREATE DATABASE "InventarioInformatica_test";
   '@ | & $psql -U postgres -h localhost
   ```

   Las comillas dobles conservan las mayúsculas del nombre.

2. **Backend** (en `backend/`):

   ```powershell
   npm install
   copy .env.example .env      # completar DB_PASSWORD con la clave del usuario postgres
   npm run seed                # opcional: carga 10 artículos y 2 préstamos de ejemplo
   npm run start:dev           # http://localhost:3000/api
   ```

   Las tablas se crean solas al arrancar. `npm run seed` solo carga datos si la tabla `articulos` está vacía, así que nunca pisa lo que ya hay.

3. **Frontend** (en `frontend/`, en otra terminal):

   ```powershell
   npm install
   npm run dev                 # http://localhost:5173
   ```

   Si el backend no está en `http://localhost:3000/api`, copiar `.env.example` a `.env` y ajustar `VITE_API_URL`.

## Tests

- **Backend:** `npm test` (unitarios) y `npm run test:e2e` (usa la base `InventarioInformatica_test` y nunca toca la principal).
- **Frontend:** `npm test` (funciones puras) y `npm run lint`.

## API (prefijo `/api`)

| Recurso | Endpoints |
|---|---|
| Artículos | `GET /articulos`, `POST /articulos`, `GET`, `PATCH` y `DELETE /articulos/:id` |
| Alertas | `GET /alertas/stock` |

## Cómo se calcula el stock

`stock_actual` es el **total del colegio**: no baja cuando se presta un equipo. Lo prestado y lo disponible se calculan aparte (`disponibles = stock_actual − prestados`).

Un artículo entra en alerta cuando `stock_actual <= stock_minimo`: **Sin stock** si es 0, **Stock bajo** en cualquier otro caso. Por eso un préstamo nunca dispara una alerta de compra. El panel de alertas permite descargar un reporte de compra en CSV, listo para abrir en Excel.

## Estado

- **Entrega 1 (esta):** artículos, alertas de stock y dashboard.
- **Entrega 2:** préstamos y movimientos (endpoints y pantallas).

Diseño completo: [docs/superpowers/specs/2026-09-18-sistema-stock-informatica-design.md](docs/superpowers/specs/2026-09-18-sistema-stock-informatica-design.md).
