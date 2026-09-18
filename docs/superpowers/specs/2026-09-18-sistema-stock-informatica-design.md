# Sistema de stock y préstamos — Informática (Colegio San José de la Providencia)

**Fecha:** 2026-09-18
**Estado:** borrador para revisión
**Ubicación del proyecto:** `sanjoInventario/` (monorepo con `backend/` y `frontend/`)

## 1. Objetivo

Sistema web interno para que el Departamento de Informática controle el inventario (~30 artículos distintos), registre préstamos de equipos retornables (proyectores, notebooks) y el consumo o ingreso de insumos no retornables (cables, pilas), y vea alertas de reposición cuando el stock llega al mínimo. Corre **100% local**, en la PC del departamento.

## 2. Decisiones tomadas

| Tema | Decisión | Motivo |
|---|---|---|
| Base de datos | PostgreSQL 18 **local**, ya instalado como servicio de Windows (puerto 5432). **No** se genera `docker-compose.yml`. | Docker no está instalado en la máquina y WSL 1 no es compatible con la configuración actual. |
| Stock de retornables | `stock_actual` es el **total del colegio** y no cambia al prestar. `prestados` y `disponibles` se calculan al leer. | Decisión del usuario. Un préstamo nunca dispara una alerta de compra. |
| Enfoque | Dos apps independientes en un monorepo simple; `stock_actual` es una columna guardada. | Simple y suficiente para ~30 artículos. Alternativas descartadas: npm workspaces con tipos compartidos (más configuración que beneficio) y stock derivado del historial (contradice el pedido, que define `stock_actual` como columna). |
| Tailwind | v4, paleta en el CSS con `@theme`. **No** hay `tailwind.config.js`. | Misma convención que `sanjoActivities`. En v4 el archivo JS es solo una vía de compatibilidad (`@config`). |
| Frontend | React 19 + Vite 8 + React Router 7, JSX plano (sin TypeScript), `lucide-react`, oxlint. | Consistencia con `sanjoActivities`. |
| Backend | NestJS (TypeScript) + TypeORM + `pg`. | Pedido original. |
| Esquema | `synchronize: true` de TypeORM fuera de producción. Sin migraciones por ahora. | Local, datos de ejemplo. Antes de cualquier despliegue real hay que pasar a migraciones. |
| Idioma | Dominio y textos de UI en español (Argentina). Clases y propiedades en español/camelCase, columnas en snake_case. | Vocabulario del departamento y del pedido original. |

## 3. Estructura del repositorio

```text
sanjoInventario/
├── backend/                  # API REST NestJS
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── articulos/        # entidad, módulo, controller, service, dto/
│   │   ├── prestamos/        # entidad + módulo (entrega 1); lógica en entrega 2
│   │   ├── movimientos/      # entidad + módulo (entrega 1); lógica en entrega 2
│   │   ├── alertas/          # controller, service, clasificar-nivel.ts
│   │   └── seed/seed.ts
│   └── test/                 # e2e
├── frontend/                 # React + Vite
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── components/{layout,dashboard,ui}/
│       ├── pages/            # Inicio, Articulos, Prestamos, Movimientos
│       ├── hooks/useApi.js
│       └── lib/api.js
├── docs/superpowers/specs/   # este documento
├── .gitignore
└── readme.md
```

Puertos: Postgres 5432, backend 3000, frontend 5173. No hay `package.json` en la raíz: se usan dos terminales.

## 4. Modelo de datos

```text
categorias                                   -- catálogo: lista desplegable "Categoría"
  id              serial PK
  nombre          varchar(60) UNIQUE NOT NULL
  orden           int NOT NULL DEFAULT 0     -- menor va primero; "Otros" usa 99

tipos_articulo                               -- catálogo: lista "Tipo", depende de la categoría
  id              serial PK
  categoria_id    -> categorias(id) ON DELETE CASCADE, NOT NULL
  nombre          varchar(80) NOT NULL
  orden           int NOT NULL DEFAULT 0
  UNIQUE (categoria_id, nombre)

articulos
  id              serial PK
  nombre          varchar(120) UNIQUE NOT NULL   -- lo único obligatorio
  categoria_id    -> categorias(id) ON DELETE RESTRICT, NULL
  tipo_id         -> tipos_articulo(id) ON DELETE RESTRICT, NULL   -- debe ser de esa categoría
  marca           varchar(80)  NULL
  modelo          varchar(80)  NULL
  compatibilidad  varchar(255) NULL           -- texto libre: con qué equipos o modelos funciona
  es_retornable   boolean      NULL           -- "Uso": true retornable, false consumible, NULL sin definir
  stock_actual    int NULL     CHECK (>= 0)   -- total del colegio; NULL = sin dato (no es 0)
  stock_minimo    int NULL     CHECK (>= 0)
  created_at, updated_at   timestamptz

prestamos                                    -- solo artículos retornables
  id              serial PK
  articulo_id     -> articulos(id) ON DELETE RESTRICT, NOT NULL
  cantidad        int NOT NULL CHECK (>= 1)
  prestado_a      varchar(120) NOT NULL      -- texto libre: docente / curso / área
  fecha_salida    timestamptz NOT NULL DEFAULT now()
  fecha_devolucion_esperada  date NOT NULL
  fecha_devolucion_real      timestamptz NULL
  estado          enum(ACTIVO, DEVUELTO) NOT NULL DEFAULT 'ACTIVO'

movimientos                                  -- solo artículos NO retornables
  id              serial PK
  articulo_id     -> articulos(id) ON DELETE RESTRICT, NOT NULL
  tipo            enum(ENTRADA, SALIDA) NOT NULL
  cantidad        int NOT NULL CHECK (>= 1)
  detalle         varchar(255) NULL          -- "Compra factura 123", "Aula 3B"
  fecha           timestamptz NOT NULL DEFAULT now()
```

**Calculado al leer (no se guarda):**
- `prestados` = suma de `cantidad` de los préstamos ACTIVO del artículo (0 para no retornables).
- `disponibles` = `stock_actual − prestados`.
- Estado **ATRASADO** de un préstamo = `estado = ACTIVO` y `fecha_devolucion_esperada` < hoy. "Hoy" es la fecha **local** del servidor (no UTC): un préstamo que vence hoy no está atrasado hasta mañana.

Las restricciones CHECK viven en la base además de la validación de los DTOs.

## 5. Reglas de negocio

| # | Regla | Entrega |
|---|---|---|
| R1 | `es_retornable` (el **uso** en la interfaz) se puede editar (incluso dejarlo sin definir) **mientras el artículo no tenga préstamos ni movimientos**; con historial, cambiarlo → 409. Reenviar el mismo valor no cuenta como cambio. *(Versión original: inmutable tras crear; relajada al agregar el formulario de edición.)* | 1 |
| R2 | `stock_actual` no puede quedar por debajo de los `prestados` del artículo → 409. | 1 |
| R3 | Un artículo con préstamos o movimientos no se puede eliminar → 409. | 1 |
| R4 | **Prestar:** solo retornables; `cantidad <= disponibles`; transacción con lock pesimista sobre el artículo; no toca `stock_actual`. | 2 |
| R5 | **Devolver:** ACTIVO → DEVUELTO y guarda `fecha_devolucion_real`; no toca `stock_actual`. Devolver un préstamo ya devuelto → 409. | 2 |
| R6 | **Movimiento:** solo no retornables; ENTRADA suma y SALIDA resta a `stock_actual` en la misma transacción (con lock); si quedaría negativo → 409. | 2 |
| R7 | Desde la entrega 2, el stock de un no retornable cambia **solo** por movimientos y `PATCH /articulos/:id` deja de aceptar `stockActual` para ellos. En la entrega 1 el PATCH lo acepta para cualquier artículo (ajuste manual), porque los movimientos todavía no existen. El stock total de un retornable se sigue editando en el artículo (compra o baja de un equipo). | 1 → 2 |

## 6. API

Prefijo `/api`. CORS solo para `http://localhost:5173` y `http://127.0.0.1:5173`. `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`. Errores: 400 validación, 404 no existe, 409 conflicto de stock o historial.

| Recurso | Endpoints | Entrega |
|---|---|---|
| Artículos | `GET /articulos`, `POST /articulos`, `GET /articulos/:id`, `PATCH /articulos/:id`, `DELETE /articulos/:id` | 1 |
| Catálogo | `GET /catalogo` (categorías con sus tipos, ordenados; se lee de la base en cada pedido) | 1 |
| Alertas | `GET /alertas/stock` | 1 |
| Préstamos | `GET /prestamos`, `POST /prestamos`, `PATCH /prestamos/:id/devolver` (estado devuelto: ACTIVO / DEVUELTO / ATRASADO) | 2 |
| Movimientos | `GET /movimientos?articuloId=`, `POST /movimientos` | 2 |

**Artículos.** `GET /articulos` devuelve cada artículo con `prestados`, `disponibles` y `nivel` (`null` si no está en alerta; `BAJO` o `SIN_STOCK` según la sección 7), ordenado por el `orden` de la categoría en el catálogo y después por `nombre` (los que no tienen categoría, al final), e incluye `categoria` y `tipo` (nombres) junto con `categoriaId` y `tipoId`. `CreateArticuloDto`: solo `nombre` es obligatorio (texto no vacío, máx. 120, sin espacios de más, único). `categoriaId` y `tipoId` (deben existir en el catálogo; el tipo debe pertenecer a la categoría y no se puede elegir un tipo sin categoría → 400), `marca` y `modelo` (máx. 80), `compatibilidad` (máx. 255; un texto vacío pasa a null), `esRetornable` (booleano), `stockActual` y `stockMinimo` (enteros >= 0) son opcionales y aceptan `null`, que significa "sin dato". `disponibles` es `null` si no hay stock actual. `UpdateArticuloDto` es el create parcial: todo se puede editar, con las reglas R1 y R2 (dejar el stock en `null` con unidades prestadas → 409).

## 7. Alertas de stock

`GET /alertas/stock` no tiene tabla propia. `ArticulosService.listarConDisponibilidad()` es la única fuente de `prestados`, `disponibles` y `nivel` (este último calculado con `clasificarNivel`). `AlertasService` se queda en memoria con los artículos que tienen `nivel` y los ordena: con ~30 artículos no justifica SQL aparte. El frontend no repite la lógica de clasificación; usa el `nivel` que trae la API.

- Entra el artículo si `stock_actual <= stock_minimo`. Si falta el stock actual o el mínimo (`null`) no hay con qué comparar y no entra.
- `nivel` = `SIN_STOCK` si `stock_actual = 0`; si no, `BAJO`. (Con mínimo 0 y stock 0 también es `SIN_STOCK`.)
- `faltante = stock_minimo − stock_actual` (0 si está justo en el mínimo). La cantidad a comprar la decide una persona.
- Orden: `SIN_STOCK` primero, después mayor `faltante`, después `nombre` (comparación `es`).
- Los retornables traen `prestados` y `disponibles` como contexto; la alerta sigue siendo sobre el total.

```json
{
  "generadoEn": "2026-09-18T10:00:00Z",
  "resumen": { "total": 5, "sinStock": 1, "bajos": 4 },
  "items": [
    { "id": 5, "nombre": "Cable de red Cat6", "categoria": "Redes", "tipo": "Cable de red",
      "marca": null, "modelo": "Cat6", "compatibilidad": null, "esRetornable": false,
      "stockActual": 0, "stockMinimo": 10, "faltante": 10, "nivel": "SIN_STOCK",
      "prestados": 0, "disponibles": 0 }
  ]
}
```

(Ejemplo abreviado: con el seed, `items` trae los 5 artículos en alerta.)

La función pura `clasificarNivel(stockActual, stockMinimo)` devuelve `null`, `'BAJO'` o `'SIN_STOCK'` y es la que se prueba en los tests unitarios.

## 8. Frontend

### 8.1 Layout y navegación

- Barra lateral fija en `marino-950` (`#0A192F`) con "Informática" (y debajo el nombre del colegio) e ítems **Inicio**, **Artículos**, **Préstamos**, **Movimientos** (`NavLink`, ítem activo resaltado). Bajo el breakpoint `lg` pasa a una barra superior con menú desplegable.
- Área de contenido blanca / gris muy claro con encabezado de página.
- Rutas: `/` Inicio, `/articulos`, `/prestamos`, `/movimientos`. Las dos últimas muestran "Próximamente" en la entrega 1.
- URL de la API desde `VITE_API_URL` (por defecto `http://localhost:3000/api`). `lib/api.js` envuelve `fetch`; `hooks/useApi.js` devuelve `{ data, error, loading, reload }`. TanStack Query se evalúa en la entrega 2, cuando haya mutaciones que refrescar.

### 8.2 Pantallas de la entrega 1

- **Inicio:** una franja de resumen con 3 indicadores (**Artículos**, **En alerta**, **Sin stock**; en rojo suave cuando son > 0, neutros cuando son 0) y debajo el panel `AlertasStock`, que es el protagonista de la pantalla.
- **Artículos:** tabla con nombre (y debajo marca y modelo; la compatibilidad se ve al pasar el mouse), categoría (y debajo el tipo), **uso** (retornable / consumible), stock total, mínimo, prestados y disponibles. Las filas en alerta llevan la misma marca visual que en el panel. `<th scope="col">` en los encabezados. Lo que está vacío se muestra como "Sin categoría", "Sin definir" o "Sin dato", y el estado de un artículo sin stock o sin mínimo es "Sin dato de stock" (no genera alerta).
- **Formulario de artículos:** botón "Nuevo artículo" arriba de la tabla y, en cada fila, acciones de editar y eliminar (solo con ícono, con nombre accesible). Alta y edición usan la misma ventana modal (`<dialog>` nativo) con nombre, **categoría** y **tipo** (listas desplegables leídas de `GET /catalogo` cada vez que se abre la ventana; el tipo depende de la categoría, queda deshabilitado sin categoría y se reinicia al cambiarla), marca, modelo, compatibilidad (texto libre), **uso** (sin definir / consumible / retornable), stock actual y stock mínimo. Los campos vacíos se guardan como `null`; los errores del servidor (nombre repetido, uso con historial) se muestran dentro de la ventana. El uso queda bloqueado si el artículo tiene unidades prestadas. Eliminar pide confirmación y el servidor lo frena si hay préstamos o movimientos (R3).
- **Alertas y reporte de compra:** cada alerta muestra categoría y tipo, marca y modelo, y la compatibilidad; el CSV suma las columnas Tipo, Marca, Modelo, Compatibilidad y Uso.
- **Catálogo:** se edita con SQL, no desde la aplicación. `backend/sql/catalogo-inicial.sql` (idempotente, también lo carga `npm run catalogo`) y `backend/sql/catalogo-editar.sql` (recetario de consultas). Ambos archivos declaran `SET client_encoding = 'UTF8'` para que las tildes no se rompan al correrlos con `psql` en Windows.

### 8.3 Componente `AlertasStock` (`components/dashboard/AlertasStock.jsx`)

- **Con alertas:** tarjeta con encabezado rojo suave ("N artículos requieren reposición") y una fila por artículo:
  - nombre y categoría;
  - insignia de nivel: `SIN_STOCK` = rojo, ícono y texto "Sin stock"; `BAJO` = ámbar, ícono y texto "Stock bajo". Nunca solo color, para que también se lea impreso en blanco y negro;
  - barra `stock_actual / stock_minimo` (ancho = `min(100, stockActual / stockMinimo × 100)`, 0 si el mínimo es 0);
  - faltante ("Faltan N", o "En el mínimo" si es 0);
  - solo en retornables, en una línea propia: "N prestados y M disponibles".
- **Sin alertas:** estado verde "Todo el stock está por encima del mínimo".
- **Cargando / error:** estados explícitos; el error dice "No se pudo conectar con el servidor" y ofrece "Reintentar".
- **Reporte de compra:** botón "Descargar reporte de compra" que arma el archivo CSV en el navegador con los ítems mostrados. Columnas: Artículo, Categoría, Tipo, Stock actual, Stock mínimo, Faltante, Nivel. Separador `;` y BOM UTF-8, para que Excel en español abra bien columnas y acentos. Nombre: `reporte-compra-AAAA-MM-DD.csv`.
- Elementos interactivos con `focus-visible:ring`.

### 8.4 Paleta y tipografía (`frontend/src/index.css`)

```css
@import "tailwindcss";

@theme {
  --color-marino-50:  #F1F5FA;
  --color-marino-100: #E0E9F5;
  --color-marino-200: #BFD1EA;
  --color-marino-300: #93B3DB;
  --color-marino-400: #6592C8;
  --color-marino-500: #3A70B0;
  --color-marino-600: #26558F;
  --color-marino-700: #1C4275;
  --color-marino-800: #15325C;
  --color-marino-900: #0F2544;
  --color-marino-950: #0A192F;

  --font-sans: "Segoe UI", ui-sans-serif, system-ui, sans-serif;
}
```

- Marca: `marino-950` (barra lateral, títulos en `marino-900`) y blanco. Grises `slate` para texto secundario y bordes. Los valores intermedios de la escala son iniciales y se pueden afinar en ese archivo.
- Estados (colores de Tailwind, fijos): rojo para sin stock (fila `bg-red-50` + `border-l-4 border-red-600`, insignia `bg-red-100 text-red-800`), ámbar para stock bajo (`bg-amber-50`, `border-amber-500`, insignia `bg-amber-100 text-amber-900`), verde para ok.
- Tipografía del sistema (Segoe UI en Windows): no depende de Google Fonts porque corre local.
- Como en `sanjoActivities`, las clases de Tailwind que dependen del estado se escriben como strings literales completos, no armadas por concatenación.

## 9. Configuración del backend

- `.env` (fuera de git; `.env.example` sí va): `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER=postgres`, `DB_PASSWORD=...`, `DB_NAME=InventarioInformatica`, `PORT=3000`. Nombre de base y usuario elegidos por el usuario. Las variables ya definidas en el entorno del proceso tienen prioridad sobre el archivo.
- `@nestjs/config` global; `TypeOrmModule.forRootAsync` con `autoLoadEntities: true` y `synchronize: process.env.NODE_ENV !== 'production'`. Cada módulo registra su entidad con `forFeature`.
- Tests e2e: con `NODE_ENV=test` el config lee primero `.env.test` (versionado, sin claves, solo `DB_NAME=InventarioInformatica_test`) y después `.env` para host, usuario y clave. Antes de borrar datos, los tests verifican que el nombre de la base termine en `_test`.
- **Seed** (`npm run seed`): solo corre si `articulos` está vacía (nunca pisa datos). Carga 10 artículos y 2 préstamos ACTIVO de ejemplo (uno vencido ayer, otro a varios días):

  | Artículo | Categoría | Tipo | Stock / Mín. | Nivel esperado |
  |---|---|---|---|---|
  | Proyector Epson EB-X06 | Equipos | retornable | 4 / 2 | ok (1 prestado) |
  | Notebook Lenovo ThinkPad | Equipos | retornable | 6 / 2 | ok |
  | Parlante portátil | Equipos | retornable | 1 / 1 | BAJO, faltante 0 (1 prestado, 0 disponibles) |
  | Cable HDMI 2 m | Cables | consumible | 3 / 5 | BAJO, faltante 2 |
  | Cable de red Cat6 | Cables | consumible | 0 / 10 | SIN_STOCK, faltante 10 |
  | Pilas AA | Insumos | consumible | 12 / 10 | ok |
  | Pilas AAA | Insumos | consumible | 8 / 10 | BAJO, faltante 2 |
  | Mouse USB | Periféricos | consumible | 15 / 5 | ok |
  | Teclado USB | Periféricos | consumible | 2 / 4 | BAJO, faltante 2 |
  | Pendrive 32 GB | Almacenamiento | consumible | 6 / 3 | ok |

## 10. Testing

- **Unitarios (Jest, viene con Nest):** `clasificarNivel` en sus bordes (stock > mínimo → `null`; stock = mínimo → `BAJO`; stock = 0 → `SIN_STOCK`; mínimo 0 con stock 0 → `SIN_STOCK`; mínimo 0 con stock 1 → `null`). `AlertasService`: orden, `faltante` y `resumen` con un `ArticulosService` simulado.
- **E2E contra `InventarioInformatica_test`:** `GET /api/alertas/stock` con datos cargados por repositorio; `prestados` y `disponibles` correctos en `GET /api/articulos` y en alertas con un préstamo ACTIVO insertado directamente; `PATCH` con `stockActual` menor a lo prestado → 409 (R2); `DELETE` de un artículo con préstamo → 409 (R3); `PATCH` con `esRetornable` → 400 (R1).
- **Frontend:** Vitest solo para las funciones puras (armado del CSV con su escapado, y el porcentaje de la barra de stock). Las pantallas no llevan tests automáticos, igual que `sanjoActivities`: se verifican levantando ambas apps con el seed.

## 11. Alcance

**Entrega 1 (este spec):** proyecto Nest conectado al Postgres local; las 3 entidades; CRUD de Artículos; `GET /alertas/stock`; seed; frontend con layout, Inicio + Alertas, y Artículos; `readme.md` actualizado (sin Docker, nombre real de la carpeta, pasos de puesta en marcha).

**Entrega 2 (spec y plan propios):** endpoints y pantallas de Préstamos y Movimientos con las reglas R4–R7.

**Criterios de aceptación de la entrega 1:**
1. `npm run start:dev` conecta con el Postgres local y crea las 3 tablas.
2. `npm run seed` carga los 10 artículos y 2 préstamos.
3. `GET /api/alertas/stock` devuelve 5 ítems (1 `SIN_STOCK`, 4 `BAJO`) en este orden: Cable de red Cat6, Cable HDMI 2 m, Pilas AAA, Teclado USB, Parlante portátil.
4. En `http://localhost:5173` Inicio muestra KPIs 10 / 5 / 1 y el panel con las 5 alertas marcadas; Artículos muestra la tabla con `prestados` y `disponibles`; el CSV descargado abre en Excel con columnas y acentos correctos.
5. Tests unitarios y e2e pasan.

**Fuera de alcance (por ahora):** autenticación y roles (corre local, en la PC del departamento), tabla de personas y de categorías, migraciones, Docker, despliegue, notificaciones por mail.

## 12. Comandos de inicialización

Secuencia prevista, en PowerShell. Los flags exactos de `nest new` y `create vite` se validan contra la versión instalada al ejecutar el plan.

```powershell
# 0. Base de datos (una sola vez). Pide la contraseña del usuario postgres.
#    Las comillas dobles conservan las mayúsculas del nombre.
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
@'
CREATE DATABASE "InventarioInformatica";
CREATE DATABASE "InventarioInformatica_test";
'@ | & $psql -U postgres -h localhost

# 1. Backend
cd sanjoInventario
npx @nestjs/cli new backend --package-manager npm --skip-git
cd backend
npm i @nestjs/typeorm @nestjs/config typeorm pg class-validator class-transformer
copy .env.example .env      # .env.example lo crea el plan; completar DB_PASSWORD
npm run start:dev           # http://localhost:3000/api
npm run seed                # script que agrega el plan; carga los datos de ejemplo

# 2. Frontend (otra terminal)
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm i react-router-dom lucide-react
npm i -D tailwindcss @tailwindcss/vite oxlint vitest
npm run dev                 # http://localhost:5173
```

## 13. Relación con el pedido original

| Pedido | Resultado |
|---|---|
| 1. `docker-compose.yml` | No se genera (decisión 2): se usa el Postgres local; el reemplazo son el `.env` y los comandos `CREATE DATABASE` de la sección 12. |
| 2. Entidades TypeORM | Sección 4. |
| 3. `tailwind.config.js` | No se genera (decisión 4): la paleta marino y blanco está en `frontend/src/index.css` con `@theme` (sección 8.4). |
| 4. Dashboard React con Alertas de Stock | Sección 8. |
| 5. Comandos de inicialización | Sección 12, y también en `readme.md`. |
