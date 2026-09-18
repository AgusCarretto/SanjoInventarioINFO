# Stock Informática — Entrega 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend NestJS con las 3 entidades, CRUD de Artículos y `GET /api/alertas/stock`, más un frontend React con dashboard, panel de Alertas de Stock y tabla de Artículos, corriendo 100% local.

**Architecture:** Dos apps independientes (`backend/`, `frontend/`) en un monorepo. `stock_actual` es una columna guardada (total del colegio); `prestados`, `disponibles` y `nivel` se calculan al leer en `ArticulosService.listarConDisponibilidad()`, que es la única fuente para el listado y para las alertas. El frontend consume la API y no repite lógica de negocio.

**Tech Stack:** NestJS + TypeORM + `pg` + class-validator (backend, TypeScript); React 19 + Vite 8 + React Router 7 + Tailwind v4 (`@tailwindcss/vite`) + lucide-react + Vitest/oxlint (frontend, JSX plano).

**Spec:** `docs/superpowers/specs/2026-09-18-sistema-stock-informatica-design.md`

## Global Constraints

- PostgreSQL 18 **local** (sin Docker, sin `docker-compose.yml`). Base `InventarioInformatica`, base de tests `InventarioInformatica_test`, usuario `postgres`, puerto 5432.
- API con prefijo `/api`; CORS solo `http://localhost:5173` y `http://127.0.0.1:5173`; `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`. Errores: 400 validación, 404 no existe, 409 conflicto.
- Clases y propiedades en español/camelCase (`stockActual`); columnas en snake_case (`stock_actual`).
- Regla de alerta: entra si `stock_actual <= stock_minimo`; `nivel` = `SIN_STOCK` si `stock_actual = 0`, si no `BAJO`; `faltante = stock_minimo − stock_actual`. Orden: SIN_STOCK primero, mayor `faltante`, luego `nombre` (`es`).
- `es_retornable` no se puede modificar tras crear el artículo (R1); `stock_actual` no puede quedar bajo los `prestados` (R2); artículo con historial no se elimina (R3).
- Tailwind v4 con la paleta en `frontend/src/index.css` vía `@theme`; **no** hay `tailwind.config.js`. `marino-950` = `#0A192F`. Clases de Tailwind como strings literales completos, nunca concatenadas.
- Frontend en JSX plano (sin TypeScript). Texto de UI en español (Argentina). Tipografía del sistema, sin Google Fonts.
- Todo estado en la UI lleva color **más** ícono y texto. Valores grandes de tarjetas KPI sin `tabular-nums`; solo las columnas de tablas lo llevan. La pista de una barra de medición es un tono más claro del mismo color que su relleno.
- Commits locales en la rama `feat/entrega-1`, sin push. Los mensajes terminan con la línea `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Entorno de verificación

Todo corre contra el Postgres local real (`localhost:5432`, usuario `postgres`, con la clave que el usuario indicó; vive solo en `backend/.env`, que no se versiona). `InventarioInformatica` ya existía y estaba vacía; `InventarioInformatica_test` se creó para los e2e. Las otras bases del servidor (`Truco-Uruguayo`, `asado-y-acero`, `postgres`) no se tocan. Los e2e solo borran datos si el nombre de la base termina en `_test`.

## File Structure

```text
backend/
  .env.example  .env.test  .env (sin versionar)
  src/
    main.ts                       arranque
    app.setup.ts                  prefijo, CORS y ValidationPipe (compartido con e2e)
    app.module.ts                 ConfigModule + TypeOrmModule + módulos de dominio
    common/fecha.ts               formatearFechaLocal(Date): 'AAAA-MM-DD' en hora local
    articulos/
      articulo.entity.ts          entidad + Check de stock >= 0
      articulos.module.ts  articulos.controller.ts  articulos.service.ts
      clasificar-nivel.ts         función pura + tipo NivelAlerta
      articulo-con-disponibilidad.ts   tipo de respuesta + mapper
      dto/create-articulo.dto.ts  dto/update-articulo.dto.ts
    prestamos/prestamo.entity.ts  prestamos/prestamos.module.ts
    movimientos/movimiento.entity.ts  movimientos/movimientos.module.ts
    alertas/alertas.module.ts  alertas.controller.ts  alertas.service.ts  alertas.types.ts
    seed/datos-ejemplo.ts  seed/cargar-datos-ejemplo.ts  seed/seed.ts
  test/
    helpers.ts                    crearApp(), limpiarBase()
    esquema.e2e-spec.ts  articulos.e2e-spec.ts  alertas.e2e-spec.ts  seed.e2e-spec.ts
frontend/
  .env.example  vite.config.js  index.html
  src/
    main.jsx  App.jsx  index.css
    lib/api.js  lib/nivel.js  lib/csv.js  (+ nivel.test.js, csv.test.js)
    hooks/useApi.js
    components/layout/{DashboardLayout,Sidebar,PageHeader}.jsx
    components/ui/NivelBadge.jsx
    components/dashboard/{StatCard,AlertasStock}.jsx
    pages/{Inicio,Articulos,Proximamente}.jsx
```

---

### Task 1: Backend base (scaffold, configuración, conexión)

**Files:**
- Create (CLI): `backend/` (proyecto Nest)
- Create: `backend/.env.example`, `backend/.env.test`, `backend/.env`, `backend/src/app.setup.ts`
- Modify: `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/package.json` (script `test:e2e`)
- Delete: `backend/src/app.controller.ts`, `app.controller.spec.ts`, `app.service.ts`, `backend/test/app.e2e-spec.ts`

**Interfaces:**
- Produces: `configurarApp(app: INestApplication): void` en `src/app.setup.ts`; `AppModule` con `ConfigModule` global y conexión TypeORM (`autoLoadEntities: true`).

- [ ] **Step 1: Generar el proyecto Nest**

Run (desde `sanjoInventario/`): `npx @nestjs/cli new backend --package-manager npm --skip-git`
Expected: carpeta `backend/` con `src/main.ts`, `package.json` y `node_modules`. Si el CLI pregunta algo o cambió un flag, adaptar y anotar la diferencia.

- [ ] **Step 2: Instalar dependencias**

Run (en `backend/`): `npm i @nestjs/typeorm @nestjs/config @nestjs/mapped-types typeorm pg class-validator class-transformer`
Expected: sin errores de peer dependencies.

- [ ] **Step 3: Quitar el "hello world" del scaffold**

Run (en `backend/`): `Remove-Item src\app.controller.ts, src\app.controller.spec.ts, src\app.service.ts, test\app.e2e-spec.ts`

- [ ] **Step 4: Archivos de entorno**

`backend/.env.example`:
```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=cambiar_esta_clave
DB_NAME=InventarioInformatica
PORT=3000
```
`backend/.env.test` (versionado, sin claves; la clave sale de `.env`):
```dotenv
DB_NAME=InventarioInformatica_test
```
`backend/.env` (NO se versiona): copia de `.env.example` con `DB_PASSWORD` completado con la clave de Postgres del usuario.

- [ ] **Step 5: `src/app.setup.ts`**

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configurarApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
```

- [ ] **Step 6: `src/main.ts`**

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

- [ ] **Step 7: `src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // En tests: .env.test pisa solo DB_NAME; el resto sale de .env.
      envFilePath:
        process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        // Solo para desarrollo local; antes de desplegar hay que pasar a migraciones.
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Script e2e en serie**

En `backend/package.json`, cambiar `"test:e2e"` a: `"test:e2e": "jest --config ./test/jest-e2e.json --runInBand"` (los e2e comparten base y no pueden correr en paralelo).

- [ ] **Step 9: Verificar que compila y conecta**

Run: `npm run build` → Expected: sin errores.
Run: `$env:PORT='3055'; npm run start` (dejar unos segundos y cortar).
Expected: log `Nest application successfully started` sin errores de conexión.

- [ ] **Step 10: Commit**

```bash
git add backend .gitignore
git commit -m "feat(backend): proyecto Nest con configuración y conexión a Postgres"
```
(agregar la línea `Co-Authored-By` al final del mensaje)

---

### Task 2: Entidades y esquema de base de datos

**Files:**
- Create: `backend/src/articulos/articulo.entity.ts`, `backend/src/prestamos/prestamo.entity.ts`, `backend/src/movimientos/movimiento.entity.ts`
- Create: `backend/src/articulos/articulos.module.ts`, `backend/src/prestamos/prestamos.module.ts`, `backend/src/movimientos/movimientos.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/test/helpers.ts`, `backend/test/esquema.e2e-spec.ts`

**Interfaces:**
- Produces: `Articulo`, `Prestamo` (+ `enum EstadoPrestamo { ACTIVO, DEVUELTO }`), `Movimiento` (+ `enum TipoMovimiento { ENTRADA, SALIDA }`); `crearApp(): Promise<INestApplication>` y `limpiarBase(app): Promise<void>` en `test/helpers.ts`.

- [ ] **Step 1: Escribir helpers y el test que falla**

`backend/test/helpers.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';

export async function crearApp(): Promise<INestApplication> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Los e2e deben correr con NODE_ENV=test');
  }
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configurarApp(app);
  await app.init();
  const base = String(app.get(DataSource).options.database);
  if (!base.endsWith('_test')) {
    await app.close();
    throw new Error(`Los e2e solo corren contra una base *_test, no "${base}"`);
  }
  return app;
}

export async function limpiarBase(app: INestApplication): Promise<void> {
  await app
    .get(DataSource)
    .query(
      'TRUNCATE TABLE prestamos, movimientos, articulos RESTART IDENTITY CASCADE',
    );
}
```

`backend/test/esquema.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Articulo } from '../src/articulos/articulo.entity';
import { crearApp, limpiarBase } from './helpers';

describe('Esquema de base de datos', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    app = await crearApp();
    ds = app.get(DataSource);
  });
  beforeEach(async () => {
    await limpiarBase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('crea las tablas articulos, prestamos y movimientos', async () => {
    const filas: { table_name: string }[] = await ds.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    expect(filas.map((f) => f.table_name)).toEqual(
      expect.arrayContaining(['articulos', 'prestamos', 'movimientos']),
    );
  });

  it('usa columnas snake_case en articulos', async () => {
    const filas: { column_name: string }[] = await ds.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'articulos'",
    );
    expect(filas.map((f) => f.column_name)).toEqual(
      expect.arrayContaining([
        'es_retornable',
        'stock_actual',
        'stock_minimo',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('rechaza un stock_actual negativo (CHECK)', async () => {
    const repo = ds.getRepository(Articulo);
    await expect(
      repo.insert({
        nombre: 'Malo',
        categoria: 'X',
        esRetornable: false,
        stockActual: -1,
        stockMinimo: 0,
      }),
    ).rejects.toThrow();
  });

  it('impide repetir el nombre de un artículo (UNIQUE)', async () => {
    const repo = ds.getRepository(Articulo);
    const datos = { nombre: 'Cable', categoria: 'X', esRetornable: false };
    await repo.insert(datos);
    await expect(repo.insert(datos)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run (en `backend/`): `npm run test:e2e`
Expected: FAIL — `Cannot find module '../src/articulos/articulo.entity'`.

- [ ] **Step 3: Entidades**

`backend/src/articulos/articulo.entity.ts`:
```ts
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Movimiento } from '../movimientos/movimiento.entity';
import { Prestamo } from '../prestamos/prestamo.entity';

@Entity('articulos')
@Check('"stock_actual" >= 0')
@Check('"stock_minimo" >= 0')
export class Articulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 60 })
  categoria: string;

  @Column({ name: 'es_retornable', type: 'boolean' })
  esRetornable: boolean;

  /** Total del colegio. No baja al prestar: lo prestado se calcula aparte. */
  @Column({ name: 'stock_actual', type: 'int', default: 0 })
  stockActual: number;

  @Column({ name: 'stock_minimo', type: 'int', default: 0 })
  stockMinimo: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Prestamo, (prestamo) => prestamo.articulo)
  prestamos: Prestamo[];

  @OneToMany(() => Movimiento, (movimiento) => movimiento.articulo)
  movimientos: Movimiento[];
}
```

`backend/src/prestamos/prestamo.entity.ts`:
```ts
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Articulo } from '../articulos/articulo.entity';

export enum EstadoPrestamo {
  ACTIVO = 'ACTIVO',
  DEVUELTO = 'DEVUELTO',
}

@Entity('prestamos')
@Check('"cantidad" >= 1')
export class Prestamo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'articulo_id', type: 'int' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.prestamos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ name: 'prestado_a', type: 'varchar', length: 120 })
  prestadoA: string;

  @Column({ name: 'fecha_salida', type: 'timestamptz', default: () => 'now()' })
  fechaSalida: Date;

  /** 'AAAA-MM-DD' (columna date). */
  @Column({ name: 'fecha_devolucion_esperada', type: 'date' })
  fechaDevolucionEsperada: string;

  @Column({ name: 'fecha_devolucion_real', type: 'timestamptz', nullable: true })
  fechaDevolucionReal: Date | null;

  @Column({
    type: 'enum',
    enum: EstadoPrestamo,
    enumName: 'estado_prestamo',
    default: EstadoPrestamo.ACTIVO,
  })
  estado: EstadoPrestamo;
}
```

`backend/src/movimientos/movimiento.entity.ts`:
```ts
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Articulo } from '../articulos/articulo.entity';

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

@Entity('movimientos')
@Check('"cantidad" >= 1')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'articulo_id', type: 'int' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.movimientos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'enum', enum: TipoMovimiento, enumName: 'tipo_movimiento' })
  tipo: TipoMovimiento;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  detalle: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date;
}
```

- [ ] **Step 4: Módulos y registro en `AppModule`**

`backend/src/articulos/articulos.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from '../prestamos/prestamo.entity';
import { Articulo } from './articulo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Articulo, Prestamo])],
})
export class ArticulosModule {}
```
`backend/src/prestamos/prestamos.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from './prestamo.entity';

@Module({ imports: [TypeOrmModule.forFeature([Prestamo])] })
export class PrestamosModule {}
```
`backend/src/movimientos/movimientos.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './movimiento.entity';

@Module({ imports: [TypeOrmModule.forFeature([Movimiento])] })
export class MovimientosModule {}
```
En `backend/src/app.module.ts` importar los tres módulos y agregarlos a `imports` después de `TypeOrmModule.forRootAsync(...)`:
```ts
import { ArticulosModule } from './articulos/articulos.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { PrestamosModule } from './prestamos/prestamos.module';
// ...
imports: [ /* ConfigModule, TypeOrmModule */ ArticulosModule, PrestamosModule, MovimientosModule ],
```

- [ ] **Step 5: Correr y ver que pasa**

Run (en `backend/`): `npm run test:e2e`
Expected: PASS, 4 tests. Si TypeScript se queja de propiedades sin inicializar (`strictPropertyInitialization`), agregar `!` a las propiedades de las entidades (`id!: number;`).

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat(backend): entidades Articulo, Prestamo y Movimiento con su esquema"
```

---

### Task 3: Artículos, lectura (`nivel`, `prestados`, `disponibles`)

**Files:**
- Create: `backend/src/articulos/clasificar-nivel.ts`, `backend/src/articulos/clasificar-nivel.spec.ts`
- Create: `backend/src/articulos/articulo-con-disponibilidad.ts`, `backend/src/articulos/articulos.service.ts`, `backend/src/articulos/articulos.controller.ts`
- Modify: `backend/src/articulos/articulos.module.ts`, `backend/test/helpers.ts`
- Test: `backend/src/articulos/clasificar-nivel.spec.ts`, `backend/test/articulos.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `type NivelAlerta = 'SIN_STOCK' | 'BAJO'`; `clasificarNivel(stockActual: number, stockMinimo: number): NivelAlerta | null`
  - `interface ArticuloConDisponibilidad { id; nombre; categoria; esRetornable; stockActual; stockMinimo; prestados: number; disponibles: number; nivel: NivelAlerta | null; createdAt: Date; updatedAt: Date }` y `conDisponibilidad(a: Articulo, prestados: number): ArticuloConDisponibilidad`
  - `ArticulosService.listarConDisponibilidad(): Promise<ArticuloConDisponibilidad[]>` y `obtener(id: number): Promise<ArticuloConDisponibilidad>` (404 si no existe); el módulo exporta `ArticulosService`.
  - En `test/helpers.ts`: `crearArticulo(app, datos)` y `crearPrestamo(app, datos)`.

- [ ] **Step 1: Test unitario de `clasificarNivel` (falla)**

`backend/src/articulos/clasificar-nivel.spec.ts`:
```ts
import { clasificarNivel } from './clasificar-nivel';

describe('clasificarNivel', () => {
  it('devuelve null si el stock supera el mínimo', () => {
    expect(clasificarNivel(6, 5)).toBeNull();
  });
  it('devuelve BAJO si el stock es igual al mínimo', () => {
    expect(clasificarNivel(5, 5)).toBe('BAJO');
  });
  it('devuelve BAJO si el stock está entre 1 y el mínimo', () => {
    expect(clasificarNivel(3, 5)).toBe('BAJO');
  });
  it('devuelve SIN_STOCK si el stock es 0', () => {
    expect(clasificarNivel(0, 5)).toBe('SIN_STOCK');
  });
  it('devuelve SIN_STOCK con mínimo 0 y stock 0', () => {
    expect(clasificarNivel(0, 0)).toBe('SIN_STOCK');
  });
  it('devuelve null con mínimo 0 y stock 1', () => {
    expect(clasificarNivel(1, 0)).toBeNull();
  });
});
```
Run: `npm test -- clasificar-nivel` → Expected: FAIL (módulo inexistente).

- [ ] **Step 2: Implementar `clasificarNivel`**

`backend/src/articulos/clasificar-nivel.ts`:
```ts
export type NivelAlerta = 'SIN_STOCK' | 'BAJO';

/** Regla de alerta: entra si stock <= mínimo; SIN_STOCK si el stock es 0. */
export function clasificarNivel(
  stockActual: number,
  stockMinimo: number,
): NivelAlerta | null {
  if (stockActual > stockMinimo) return null;
  return stockActual === 0 ? 'SIN_STOCK' : 'BAJO';
}
```
Run: `npm test -- clasificar-nivel` → Expected: PASS, 6 tests.

- [ ] **Step 3: Helpers de datos para e2e**

Agregar al final de `backend/test/helpers.ts` (y los imports arriba):
```ts
import { Articulo } from '../src/articulos/articulo.entity';
import { EstadoPrestamo, Prestamo } from '../src/prestamos/prestamo.entity';

export async function crearArticulo(
  app: INestApplication,
  datos: Partial<Articulo> & Pick<Articulo, 'nombre'>,
): Promise<Articulo> {
  const repo = app.get(DataSource).getRepository(Articulo);
  return repo.save(
    repo.create({
      categoria: 'General',
      esRetornable: false,
      stockActual: 0,
      stockMinimo: 0,
      ...datos,
    }),
  );
}

export async function crearPrestamo(
  app: INestApplication,
  datos: { articuloId: number } & Partial<Prestamo>,
): Promise<Prestamo> {
  const repo = app.get(DataSource).getRepository(Prestamo);
  return repo.save(
    repo.create({
      cantidad: 1,
      prestadoA: 'Prof. de prueba',
      fechaDevolucionEsperada: '2099-01-01',
      estado: EstadoPrestamo.ACTIVO,
      ...datos,
    }),
  );
}
```

- [ ] **Step 4: Tests e2e de lectura (fallan)**

`backend/test/articulos.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EstadoPrestamo } from '../src/prestamos/prestamo.entity';
import {
  crearApp,
  crearArticulo,
  crearPrestamo,
  limpiarBase,
} from './helpers';

describe('Artículos (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
  });
  beforeEach(async () => {
    await limpiarBase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/articulos', () => {
    it('devuelve prestados, disponibles y nivel, ordenados por categoría y nombre', async () => {
      const proyector = await crearArticulo(app, {
        nombre: 'Proyector',
        categoria: 'Equipos',
        esRetornable: true,
        stockActual: 4,
        stockMinimo: 2,
      });
      await crearPrestamo(app, { articuloId: proyector.id, cantidad: 1 });
      await crearPrestamo(app, {
        articuloId: proyector.id,
        cantidad: 2,
        estado: EstadoPrestamo.DEVUELTO, // no cuenta como prestado
      });
      await crearArticulo(app, {
        nombre: 'Pilas AA',
        categoria: 'Insumos',
        stockActual: 0,
        stockMinimo: 10,
      });
      await crearArticulo(app, {
        nombre: 'Cable HDMI',
        categoria: 'Cables',
        stockActual: 3,
        stockMinimo: 5,
      });

      const { body } = await request(app.getHttpServer())
        .get('/api/articulos')
        .expect(200);

      expect(body.map((a: { nombre: string }) => a.nombre)).toEqual([
        'Cable HDMI', // Cables
        'Proyector', // Equipos
        'Pilas AA', // Insumos
      ]);
      expect(body[1]).toMatchObject({
        prestados: 1,
        disponibles: 3,
        stockActual: 4,
        nivel: null,
      });
      expect(body[0]).toMatchObject({ prestados: 0, disponibles: 3, nivel: 'BAJO' });
      expect(body[2]).toMatchObject({ nivel: 'SIN_STOCK' });
    });
  });

  describe('GET /api/articulos/:id', () => {
    it('devuelve el artículo con su disponibilidad', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Parlante',
        esRetornable: true,
        stockActual: 1,
        stockMinimo: 1,
      });
      await crearPrestamo(app, { articuloId: a.id });
      const { body } = await request(app.getHttpServer())
        .get(`/api/articulos/${a.id}`)
        .expect(200);
      expect(body).toMatchObject({
        id: a.id,
        prestados: 1,
        disponibles: 0,
        nivel: 'BAJO',
      });
    });

    it('responde 404 si no existe', async () => {
      await request(app.getHttpServer()).get('/api/articulos/9999').expect(404);
    });

    it('responde 400 si el id no es un número', async () => {
      await request(app.getHttpServer()).get('/api/articulos/abc').expect(400);
    });
  });
});
```
Run: `npm run test:e2e` → Expected: FAIL (rutas inexistentes → 404 en vez de 200).

- [ ] **Step 5: Tipo de respuesta y servicio**

`backend/src/articulos/articulo-con-disponibilidad.ts`:
```ts
import { Articulo } from './articulo.entity';
import { clasificarNivel, NivelAlerta } from './clasificar-nivel';

export interface ArticuloConDisponibilidad {
  id: number;
  nombre: string;
  categoria: string;
  esRetornable: boolean;
  stockActual: number;
  stockMinimo: number;
  prestados: number;
  disponibles: number;
  nivel: NivelAlerta | null;
  createdAt: Date;
  updatedAt: Date;
}

export function conDisponibilidad(
  articulo: Articulo,
  prestados: number,
): ArticuloConDisponibilidad {
  return {
    id: articulo.id,
    nombre: articulo.nombre,
    categoria: articulo.categoria,
    esRetornable: articulo.esRetornable,
    stockActual: articulo.stockActual,
    stockMinimo: articulo.stockMinimo,
    prestados,
    disponibles: articulo.stockActual - prestados,
    nivel: clasificarNivel(articulo.stockActual, articulo.stockMinimo),
    createdAt: articulo.createdAt,
    updatedAt: articulo.updatedAt,
  };
}
```

`backend/src/articulos/articulos.service.ts`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoPrestamo, Prestamo } from '../prestamos/prestamo.entity';
import {
  ArticuloConDisponibilidad,
  conDisponibilidad,
} from './articulo-con-disponibilidad';
import { Articulo } from './articulo.entity';

@Injectable()
export class ArticulosService {
  constructor(
    @InjectRepository(Articulo) private readonly articulos: Repository<Articulo>,
    @InjectRepository(Prestamo) private readonly prestamos: Repository<Prestamo>,
  ) {}

  /** Unidades en préstamo ACTIVO, por artículo. */
  private async prestadosPorArticulo(): Promise<Map<number, number>> {
    const filas = await this.prestamos
      .createQueryBuilder('p')
      .select('p.articuloId', 'articuloId')
      .addSelect('SUM(p.cantidad)', 'prestados')
      .where('p.estado = :estado', { estado: EstadoPrestamo.ACTIVO })
      .groupBy('p.articuloId')
      .getRawMany<{ articuloId: number; prestados: string }>();
    return new Map(filas.map((f) => [Number(f.articuloId), Number(f.prestados)]));
  }

  async listarConDisponibilidad(): Promise<ArticuloConDisponibilidad[]> {
    const [lista, prestados] = await Promise.all([
      this.articulos.find({ order: { categoria: 'ASC', nombre: 'ASC' } }),
      this.prestadosPorArticulo(),
    ]);
    return lista.map((a) => conDisponibilidad(a, prestados.get(a.id) ?? 0));
  }

  async obtener(id: number): Promise<ArticuloConDisponibilidad> {
    const articulo = await this.articulos.findOneBy({ id });
    if (!articulo) throw new NotFoundException(`No existe el artículo ${id}`);
    const prestados = (await this.prestadosPorArticulo()).get(id) ?? 0;
    return conDisponibilidad(articulo, prestados);
  }
}
```

- [ ] **Step 6: Controller y módulo**

`backend/src/articulos/articulos.controller.ts`:
```ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ArticulosService } from './articulos.service';

@Controller('articulos')
export class ArticulosController {
  constructor(private readonly servicio: ArticulosService) {}

  @Get()
  listar() {
    return this.servicio.listarConDisponibilidad();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtener(id);
  }
}
```
`backend/src/articulos/articulos.module.ts` (reemplazar):
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from '../prestamos/prestamo.entity';
import { Articulo } from './articulo.entity';
import { ArticulosController } from './articulos.controller';
import { ArticulosService } from './articulos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Articulo, Prestamo])],
  controllers: [ArticulosController],
  providers: [ArticulosService],
  exports: [ArticulosService],
})
export class ArticulosModule {}
```

- [ ] **Step 7: Correr todo y ver que pasa**

Run: `npm test` → Expected: PASS (6 tests de `clasificarNivel`).
Run: `npm run test:e2e` → Expected: PASS (esquema + lectura de artículos). Si `import request from 'supertest'` falla por `esModuleInterop`, usar `import * as request from 'supertest'`.

- [ ] **Step 8: Commit**

```bash
git add backend
git commit -m "feat(backend): lectura de artículos con prestados, disponibles y nivel"
```

---

### Task 4: Artículos, escritura (crear, editar, eliminar; reglas R1–R3)

**Files:**
- Create: `backend/src/articulos/dto/create-articulo.dto.ts`, `backend/src/articulos/dto/update-articulo.dto.ts`
- Modify: `backend/src/articulos/articulos.service.ts`, `backend/src/articulos/articulos.controller.ts`
- Test: `backend/test/articulos.e2e-spec.ts`

**Interfaces:**
- Consumes: `conDisponibilidad`, `prestadosPorArticulo()` (privado del servicio), helpers `crearArticulo`/`crearPrestamo`.
- Produces: `ArticulosService.crear(dto: CreateArticuloDto)`, `actualizar(id: number, dto: UpdateArticuloDto)` → ambos `Promise<ArticuloConDisponibilidad>`; `eliminar(id: number): Promise<void>`. Rutas `POST /api/articulos` (201), `PATCH /api/articulos/:id` (200), `DELETE /api/articulos/:id` (204).

- [ ] **Step 1: Escribir los tests que fallan**

Dentro del `describe('Artículos (e2e)')` de `backend/test/articulos.e2e-spec.ts`, después del bloque `GET /api/articulos/:id`, agregar:
```ts
  describe('POST /api/articulos', () => {
    it('crea el artículo, recorta espacios y usa stock 0 por defecto', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/articulos')
        .send({ nombre: '  Mouse USB  ', categoria: 'Periféricos', esRetornable: false })
        .expect(201);
      expect(body).toMatchObject({
        nombre: 'Mouse USB',
        stockActual: 0,
        stockMinimo: 0,
        prestados: 0,
        disponibles: 0,
        nivel: 'SIN_STOCK',
      });
    });

    it.each([
      ['nombre vacío', { nombre: '', categoria: 'X', esRetornable: false }],
      ['stock negativo', { nombre: 'A', categoria: 'X', esRetornable: false, stockActual: -1 }],
      ['stock decimal', { nombre: 'A', categoria: 'X', esRetornable: false, stockMinimo: 1.5 }],
      ['esRetornable que no es booleano', { nombre: 'A', categoria: 'X', esRetornable: 'si' }],
      ['un campo no permitido', { nombre: 'A', categoria: 'X', esRetornable: false, id: 7 }],
    ])('responde 400 con %s', async (_caso, cuerpo) => {
      await request(app.getHttpServer()).post('/api/articulos').send(cuerpo).expect(400);
    });

    it('responde 409 si el nombre ya existe', async () => {
      await crearArticulo(app, { nombre: 'Cable' });
      await request(app.getHttpServer())
        .post('/api/articulos')
        .send({ nombre: 'Cable', categoria: 'X', esRetornable: false })
        .expect(409);
    });
  });

  describe('PATCH /api/articulos/:id', () => {
    it('actualiza campos y devuelve el artículo', async () => {
      const a = await crearArticulo(app, { nombre: 'Cable', stockActual: 3, stockMinimo: 5 });
      const { body } = await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ stockActual: 8, categoria: 'Cables' })
        .expect(200);
      expect(body).toMatchObject({ stockActual: 8, categoria: 'Cables', nivel: null });
    });

    it('R1: rechaza cambiar esRetornable', async () => {
      const a = await crearArticulo(app, { nombre: 'Cable' });
      await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ esRetornable: true })
        .expect(400);
    });

    it('R2: rechaza dejar el stock por debajo de lo prestado y acepta igualarlo', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 4,
        stockMinimo: 1,
      });
      await crearPrestamo(app, { articuloId: a.id, cantidad: 3 });
      const patch = (stockActual: number) =>
        request(app.getHttpServer()).patch(`/api/articulos/${a.id}`).send({ stockActual });
      await patch(2).expect(409);
      await patch(3).expect(200);
    });

    it('responde 404 si no existe', async () => {
      await request(app.getHttpServer())
        .patch('/api/articulos/9999')
        .send({ stockActual: 1 })
        .expect(404);
    });

    it('responde 409 si el nuevo nombre ya existe', async () => {
      await crearArticulo(app, { nombre: 'Cable' });
      const b = await crearArticulo(app, { nombre: 'Pilas' });
      await request(app.getHttpServer())
        .patch(`/api/articulos/${b.id}`)
        .send({ nombre: 'Cable' })
        .expect(409);
    });
  });

  describe('DELETE /api/articulos/:id', () => {
    it('elimina un artículo sin historial', async () => {
      const a = await crearArticulo(app, { nombre: 'Cable' });
      await request(app.getHttpServer()).delete(`/api/articulos/${a.id}`).expect(204);
      await request(app.getHttpServer()).get(`/api/articulos/${a.id}`).expect(404);
    });

    it('R3: responde 409 si tiene préstamos', async () => {
      const a = await crearArticulo(app, { nombre: 'Proyector', esRetornable: true, stockActual: 2 });
      await crearPrestamo(app, { articuloId: a.id });
      await request(app.getHttpServer()).delete(`/api/articulos/${a.id}`).expect(409);
    });

    it('responde 404 si no existe', async () => {
      await request(app.getHttpServer()).delete('/api/articulos/9999').expect(404);
    });
  });
```
Run (en `backend/`): `npm run test:e2e -- articulos` → Expected: FAIL (POST/PATCH/DELETE devuelven 404).

- [ ] **Step 2: DTOs**

`backend/src/articulos/dto/create-articulo.dto.ts`:
```ts
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateArticuloDto {
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  categoria: string;

  @IsBoolean()
  esRetornable: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockActual?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;
}
```
`backend/src/articulos/dto/update-articulo.dto.ts`:
```ts
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateArticuloDto } from './create-articulo.dto';

// R1: esRetornable no se puede modificar después de crear el artículo.
export class UpdateArticuloDto extends PartialType(
  OmitType(CreateArticuloDto, ['esRetornable'] as const),
) {}
```

- [ ] **Step 3: Métodos de escritura en el servicio**

En `backend/src/articulos/articulos.service.ts`: importar `ConflictException` (de `@nestjs/common`) y los dos DTOs, y agregar dentro de la clase:
```ts
  async crear(dto: CreateArticuloDto): Promise<ArticuloConDisponibilidad> {
    try {
      const articulo = await this.articulos.save(this.articulos.create(dto));
      return conDisponibilidad(articulo, 0);
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
  }

  async actualizar(
    id: number,
    dto: UpdateArticuloDto,
  ): Promise<ArticuloConDisponibilidad> {
    const articulo = await this.articulos.findOneBy({ id });
    if (!articulo) throw new NotFoundException(`No existe el artículo ${id}`);
    const prestados = (await this.prestadosPorArticulo()).get(id) ?? 0;
    // R2: el total nunca puede quedar por debajo de lo que está prestado.
    if (dto.stockActual !== undefined && dto.stockActual < prestados) {
      throw new ConflictException(
        `No se puede dejar el stock en ${dto.stockActual}: hay ${prestados} unidades prestadas`,
      );
    }
    Object.assign(articulo, dto);
    try {
      await this.articulos.save(articulo);
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
    return conDisponibilidad(articulo, prestados);
  }

  async eliminar(id: number): Promise<void> {
    const articulo = await this.articulos.findOneBy({ id });
    if (!articulo) throw new NotFoundException(`No existe el artículo ${id}`);
    try {
      await this.articulos.remove(articulo); // R3: la FK RESTRICT frena si hay historial
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
  }

  /** Traduce violaciones de UNIQUE (23505) y FK (23503) de Postgres a 409. */
  private traducirErrorDeBase(error: unknown): unknown {
    const codigo = (error as { driverError?: { code?: string } })?.driverError?.code;
    if (codigo === '23505') {
      return new ConflictException('Ya existe un artículo con ese nombre');
    }
    if (codigo === '23503') {
      return new ConflictException(
        'El artículo tiene préstamos o movimientos y no se puede eliminar',
      );
    }
    return error;
  }
```

- [ ] **Step 4: Rutas del controller**

En `backend/src/articulos/articulos.controller.ts`, importar `Body, Delete, HttpCode, HttpStatus, Patch, Post` y los DTOs, y agregar:
```ts
  @Post()
  crear(@Body() dto: CreateArticuloDto) {
    return this.servicio.crear(dto);
  }

  @Patch(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticuloDto) {
    return this.servicio.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.eliminar(id);
  }
```

- [ ] **Step 5: Correr y ver que pasa**

Run: `npm run test:e2e -- articulos` → Expected: PASS (lectura + escritura).

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat(backend): alta, edición y baja de artículos con reglas R1 a R3"
```

---

### Task 5: Alertas de stock

**Files:**
- Create: `backend/src/alertas/alertas.types.ts`, `alertas.service.ts`, `alertas.controller.ts`, `alertas.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/src/alertas/alertas.service.spec.ts`, `backend/test/alertas.e2e-spec.ts`

**Interfaces:**
- Consumes: `ArticulosService.listarConDisponibilidad()` y `ArticuloConDisponibilidad`.
- Produces: `AlertasService.obtenerAlertasDeStock(): Promise<AlertasStockRespuesta>`; `GET /api/alertas/stock`. Tipos `AlertaStockItem` y `AlertasStockRespuesta` (forma del spec, sección 7).

- [ ] **Step 1: Test unitario del servicio (falla)**

`backend/src/alertas/alertas.service.spec.ts`:
```ts
import { ArticuloConDisponibilidad } from '../articulos/articulo-con-disponibilidad';
import { ArticulosService } from '../articulos/articulos.service';
import { clasificarNivel } from '../articulos/clasificar-nivel';
import { AlertasService } from './alertas.service';

function art(
  id: number,
  nombre: string,
  stockActual: number,
  stockMinimo: number,
  extra: Partial<ArticuloConDisponibilidad> = {},
): ArticuloConDisponibilidad {
  return {
    id,
    nombre,
    categoria: 'General',
    esRetornable: false,
    stockActual,
    stockMinimo,
    prestados: 0,
    disponibles: stockActual,
    nivel: clasificarNivel(stockActual, stockMinimo),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  };
}

function servicioCon(lista: ArticuloConDisponibilidad[]): AlertasService {
  const articulos = { listarConDisponibilidad: jest.fn().mockResolvedValue(lista) };
  return new AlertasService(articulos as unknown as ArticulosService);
}

describe('AlertasService', () => {
  it('deja fuera los artículos por encima del mínimo', async () => {
    const r = await servicioCon([art(1, 'Ok', 10, 5), art(2, 'Bajo', 3, 5)]).obtenerAlertasDeStock();
    expect(r.items.map((i) => i.nombre)).toEqual(['Bajo']);
  });

  it('ordena SIN_STOCK primero, luego mayor faltante, luego nombre', async () => {
    const r = await servicioCon([
      art(1, 'Teclado', 2, 4), // BAJO, faltante 2
      art(2, 'Cat6', 0, 10), // SIN_STOCK, faltante 10
      art(3, 'HDMI', 3, 5), // BAJO, faltante 2
      art(4, 'Parlante', 1, 1), // BAJO, faltante 0
      art(5, 'Pilas', 8, 10), // BAJO, faltante 2
    ]).obtenerAlertasDeStock();
    expect(r.items.map((i) => i.nombre)).toEqual(['Cat6', 'HDMI', 'Pilas', 'Teclado', 'Parlante']);
  });

  it('calcula faltante y resumen', async () => {
    const r = await servicioCon([art(1, 'Cat6', 0, 10), art(2, 'HDMI', 3, 5)]).obtenerAlertasDeStock();
    expect(r.items[0]).toMatchObject({ nivel: 'SIN_STOCK', faltante: 10 });
    expect(r.items[1]).toMatchObject({ nivel: 'BAJO', faltante: 2 });
    expect(r.resumen).toEqual({ total: 2, sinStock: 1, bajos: 1 });
  });

  it('incluye prestados y disponibles de los retornables', async () => {
    const r = await servicioCon([
      art(1, 'Parlante', 1, 1, { esRetornable: true, prestados: 1, disponibles: 0 }),
    ]).obtenerAlertasDeStock();
    expect(r.items[0]).toMatchObject({ esRetornable: true, prestados: 1, disponibles: 0 });
  });

  it('sin alertas devuelve resumen en cero y lista vacía', async () => {
    const r = await servicioCon([art(1, 'Ok', 10, 5)]).obtenerAlertasDeStock();
    expect(r.resumen).toEqual({ total: 0, sinStock: 0, bajos: 0 });
    expect(r.items).toEqual([]);
    expect(typeof r.generadoEn).toBe('string');
  });
});
```
Run: `npm test -- alertas` → Expected: FAIL (módulo inexistente).

- [ ] **Step 2: Tipos y servicio**

`backend/src/alertas/alertas.types.ts`:
```ts
import { NivelAlerta } from '../articulos/clasificar-nivel';

export interface AlertaStockItem {
  id: number;
  nombre: string;
  categoria: string;
  esRetornable: boolean;
  stockActual: number;
  stockMinimo: number;
  /** stock_minimo − stock_actual; 0 si está justo en el mínimo. */
  faltante: number;
  nivel: NivelAlerta;
  prestados: number;
  disponibles: number;
}

export interface AlertasStockRespuesta {
  generadoEn: string;
  resumen: { total: number; sinStock: number; bajos: number };
  items: AlertaStockItem[];
}
```
`backend/src/alertas/alertas.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { ArticulosService } from '../articulos/articulos.service';
import { AlertaStockItem, AlertasStockRespuesta } from './alertas.types';

/** SIN_STOCK primero, después mayor faltante, después nombre. */
function porSeveridad(a: AlertaStockItem, b: AlertaStockItem): number {
  if (a.nivel !== b.nivel) return a.nivel === 'SIN_STOCK' ? -1 : 1;
  if (a.faltante !== b.faltante) return b.faltante - a.faltante;
  return a.nombre.localeCompare(b.nombre, 'es');
}

@Injectable()
export class AlertasService {
  constructor(private readonly articulos: ArticulosService) {}

  async obtenerAlertasDeStock(): Promise<AlertasStockRespuesta> {
    const lista = await this.articulos.listarConDisponibilidad();
    const items: AlertaStockItem[] = lista.flatMap((a) =>
      a.nivel === null
        ? []
        : [
            {
              id: a.id,
              nombre: a.nombre,
              categoria: a.categoria,
              esRetornable: a.esRetornable,
              stockActual: a.stockActual,
              stockMinimo: a.stockMinimo,
              faltante: a.stockMinimo - a.stockActual,
              nivel: a.nivel,
              prestados: a.prestados,
              disponibles: a.disponibles,
            },
          ],
    );
    items.sort(porSeveridad);
    const sinStock = items.filter((i) => i.nivel === 'SIN_STOCK').length;
    return {
      generadoEn: new Date().toISOString(),
      resumen: { total: items.length, sinStock, bajos: items.length - sinStock },
      items,
    };
  }
}
```
Run: `npm test -- alertas` → Expected: PASS, 5 tests.

- [ ] **Step 3: Test e2e (falla)**

`backend/test/alertas.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { crearApp, crearArticulo, crearPrestamo, limpiarBase } from './helpers';

describe('GET /api/alertas/stock (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
  });
  beforeEach(async () => {
    await limpiarBase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  const pedir = () => request(app.getHttpServer()).get('/api/alertas/stock').expect(200);

  it('devuelve solo los artículos en alerta, ordenados', async () => {
    await crearArticulo(app, { nombre: 'Mouse', stockActual: 15, stockMinimo: 5 });
    await crearArticulo(app, { nombre: 'HDMI', stockActual: 3, stockMinimo: 5 });
    await crearArticulo(app, { nombre: 'Cat6', stockActual: 0, stockMinimo: 10 });
    const { body } = await pedir();
    expect(body.resumen).toEqual({ total: 2, sinStock: 1, bajos: 1 });
    expect(body.items.map((i: { nombre: string }) => i.nombre)).toEqual(['Cat6', 'HDMI']);
    expect(body.items[1]).toMatchObject({ faltante: 2, nivel: 'BAJO' });
  });

  it('un préstamo no dispara alerta: se compara el total, no lo disponible', async () => {
    const a = await crearArticulo(app, {
      nombre: 'Proyector',
      esRetornable: true,
      stockActual: 3,
      stockMinimo: 1,
    });
    await crearPrestamo(app, { articuloId: a.id, cantidad: 2 }); // disponibles = 1
    const { body } = await pedir();
    expect(body.items).toEqual([]);
  });

  it('un retornable en alerta trae prestados y disponibles', async () => {
    const a = await crearArticulo(app, {
      nombre: 'Parlante',
      esRetornable: true,
      stockActual: 1,
      stockMinimo: 1,
    });
    await crearPrestamo(app, { articuloId: a.id, cantidad: 1 });
    const { body } = await pedir();
    expect(body.items[0]).toMatchObject({ prestados: 1, disponibles: 0, faltante: 0, nivel: 'BAJO' });
  });

  it('sin artículos devuelve resumen en cero', async () => {
    const { body } = await pedir();
    expect(body.resumen).toEqual({ total: 0, sinStock: 0, bajos: 0 });
    expect(body.items).toEqual([]);
  });
});
```
Run: `npm run test:e2e -- alertas` → Expected: FAIL (404 en la ruta).

- [ ] **Step 4: Controller, módulo y registro**

`backend/src/alertas/alertas.controller.ts`:
```ts
import { Controller, Get } from '@nestjs/common';
import { AlertasService } from './alertas.service';

@Controller('alertas')
export class AlertasController {
  constructor(private readonly servicio: AlertasService) {}

  @Get('stock')
  stock() {
    return this.servicio.obtenerAlertasDeStock();
  }
}
```
`backend/src/alertas/alertas.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { ArticulosModule } from '../articulos/articulos.module';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';

@Module({
  imports: [ArticulosModule],
  controllers: [AlertasController],
  providers: [AlertasService],
})
export class AlertasModule {}
```
Agregar `AlertasModule` (con su import) a `imports` de `backend/src/app.module.ts`.

- [ ] **Step 5: Correr y ver que pasa**

Run: `npm test` → Expected: PASS (nivel + alertas). Run: `npm run test:e2e` → Expected: PASS (esquema, artículos, alertas).

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat(backend): endpoint GET /api/alertas/stock"
```

---

### Task 6: Seed de datos de ejemplo

**Files:**
- Create: `backend/src/common/fecha.ts`, `backend/src/common/fecha.spec.ts`
- Create: `backend/src/seed/datos-ejemplo.ts`, `cargar-datos-ejemplo.ts`, `seed.ts`
- Modify: `backend/package.json` (script `seed`)
- Test: `backend/test/seed.e2e-spec.ts`

**Interfaces:**
- Produces: `formatearFechaLocal(fecha: Date): string` ('AAAA-MM-DD' en hora local); `ARTICULOS_EJEMPLO`; `cargarDatosEjemplo(ds: DataSource, hoy?: Date): Promise<boolean>` (`false` si `articulos` ya tenía datos).

- [ ] **Step 1: Test de `formatearFechaLocal` (falla) e implementación**

`backend/src/common/fecha.spec.ts`:
```ts
import { formatearFechaLocal } from './fecha';

describe('formatearFechaLocal', () => {
  it('usa la fecha local aunque en UTC ya sea otro día', () => {
    expect(formatearFechaLocal(new Date(2026, 8, 18, 23, 30))).toBe('2026-09-18');
  });
  it('completa con ceros mes y día', () => {
    expect(formatearFechaLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
```
Run: `npm test -- fecha` → FAIL. Luego crear `backend/src/common/fecha.ts`:
```ts
/** 'AAAA-MM-DD' con la fecha LOCAL del servidor (no UTC). */
export function formatearFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}
```
Run: `npm test -- fecha` → PASS.

- [ ] **Step 2: Test e2e del seed (falla)**

`backend/test/seed.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { cargarDatosEjemplo } from '../src/seed/cargar-datos-ejemplo';
import { crearApp, limpiarBase } from './helpers';

describe('Seed de datos de ejemplo (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
  });
  beforeEach(async () => {
    await limpiarBase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('carga los datos una sola vez y nunca pisa una tabla con datos', async () => {
    const ds = app.get(DataSource);
    expect(await cargarDatosEjemplo(ds)).toBe(true);
    expect(await cargarDatosEjemplo(ds)).toBe(false);
    const { body } = await request(app.getHttpServer()).get('/api/articulos').expect(200);
    expect(body).toHaveLength(10);
  });

  it('produce las alertas esperadas, en orden', async () => {
    await cargarDatosEjemplo(app.get(DataSource));
    const { body } = await request(app.getHttpServer()).get('/api/alertas/stock').expect(200);
    expect(body.resumen).toEqual({ total: 5, sinStock: 1, bajos: 4 });
    expect(body.items.map((i: { nombre: string }) => i.nombre)).toEqual([
      'Cable de red Cat6',
      'Cable HDMI 2 m',
      'Pilas AAA',
      'Teclado USB',
      'Parlante portátil',
    ]);
  });

  it('deja 1 unidad prestada del proyector y del parlante', async () => {
    await cargarDatosEjemplo(app.get(DataSource));
    const { body } = await request(app.getHttpServer()).get('/api/articulos').expect(200);
    const por = (nombre: string) => body.find((a: { nombre: string }) => a.nombre === nombre);
    expect(por('Proyector Epson EB-X06')).toMatchObject({ prestados: 1, disponibles: 3 });
    expect(por('Parlante portátil')).toMatchObject({ prestados: 1, disponibles: 0 });
  });
});
```
Run: `npm run test:e2e -- seed` → Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Datos y cargador**

`backend/src/seed/datos-ejemplo.ts`:
```ts
export interface ArticuloEjemplo {
  nombre: string;
  categoria: string;
  esRetornable: boolean;
  stockActual: number;
  stockMinimo: number;
}

export const ARTICULOS_EJEMPLO: readonly ArticuloEjemplo[] = [
  { nombre: 'Proyector Epson EB-X06', categoria: 'Equipos', esRetornable: true, stockActual: 4, stockMinimo: 2 },
  { nombre: 'Notebook Lenovo ThinkPad', categoria: 'Equipos', esRetornable: true, stockActual: 6, stockMinimo: 2 },
  { nombre: 'Parlante portátil', categoria: 'Equipos', esRetornable: true, stockActual: 1, stockMinimo: 1 },
  { nombre: 'Cable HDMI 2 m', categoria: 'Cables', esRetornable: false, stockActual: 3, stockMinimo: 5 },
  { nombre: 'Cable de red Cat6', categoria: 'Cables', esRetornable: false, stockActual: 0, stockMinimo: 10 },
  { nombre: 'Pilas AA', categoria: 'Insumos', esRetornable: false, stockActual: 12, stockMinimo: 10 },
  { nombre: 'Pilas AAA', categoria: 'Insumos', esRetornable: false, stockActual: 8, stockMinimo: 10 },
  { nombre: 'Mouse USB', categoria: 'Periféricos', esRetornable: false, stockActual: 15, stockMinimo: 5 },
  { nombre: 'Teclado USB', categoria: 'Periféricos', esRetornable: false, stockActual: 2, stockMinimo: 4 },
  { nombre: 'Pendrive 32 GB', categoria: 'Almacenamiento', esRetornable: false, stockActual: 6, stockMinimo: 3 },
];
```
`backend/src/seed/cargar-datos-ejemplo.ts`:
```ts
import { DataSource } from 'typeorm';
import { formatearFechaLocal } from '../common/fecha';
import { Articulo } from '../articulos/articulo.entity';
import { EstadoPrestamo, Prestamo } from '../prestamos/prestamo.entity';
import { ARTICULOS_EJEMPLO } from './datos-ejemplo';

/** Carga los datos de ejemplo solo si `articulos` está vacía. Devuelve si cargó. */
export async function cargarDatosEjemplo(
  ds: DataSource,
  hoy: Date = new Date(),
): Promise<boolean> {
  return ds.transaction(async (manager) => {
    if ((await manager.count(Articulo)) > 0) return false;

    const guardados = await manager.save(
      Articulo,
      ARTICULOS_EJEMPLO.map((a) => manager.create(Articulo, a)),
    );
    const idDe = (nombre: string): number => {
      const encontrado = guardados.find((a) => a.nombre === nombre);
      if (!encontrado) throw new Error(`Falta el artículo de ejemplo "${nombre}"`);
      return encontrado.id;
    };
    const enDias = (n: number): Date => {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + n);
      return fecha;
    };

    await manager.save(Prestamo, [
      manager.create(Prestamo, {
        articuloId: idDe('Proyector Epson EB-X06'),
        cantidad: 1,
        prestadoA: 'Prof. Gómez - 3° B',
        fechaSalida: enDias(-3),
        fechaDevolucionEsperada: formatearFechaLocal(enDias(-1)), // vencido ayer
        estado: EstadoPrestamo.ACTIVO,
      }),
      manager.create(Prestamo, {
        articuloId: idDe('Parlante portátil'),
        cantidad: 1,
        prestadoA: 'Preceptoría 1° año',
        fechaSalida: enDias(-1),
        fechaDevolucionEsperada: formatearFechaLocal(enDias(3)),
        estado: EstadoPrestamo.ACTIVO,
      }),
    ]);
    return true;
  });
}
```
`backend/src/seed/seed.ts`:
```ts
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { cargarDatosEjemplo } from './cargar-datos-ejemplo';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const cargo = await cargarDatosEjemplo(app.get(DataSource));
    console.log(
      cargo
        ? 'Datos de ejemplo cargados: 10 artículos y 2 préstamos.'
        : 'La tabla articulos ya tiene datos: no se cargó nada.',
    );
  } finally {
    await app.close();
  }
}
void main();
```
En `backend/package.json`, agregar a `scripts`: `"seed": "nest build && node dist/seed/seed.js"`.

- [ ] **Step 4: Correr todo**

Run: `npm test` → Expected: PASS. Run: `npm run test:e2e` → Expected: PASS (esquema, artículos, alertas, seed).

- [ ] **Step 5: Humo manual contra la base real**

Run (en `backend/`): `npm run seed` → Expected: `Datos de ejemplo cargados: 10 artículos y 2 préstamos.` (en `InventarioInformatica`).
Run: `$env:PORT='3055'; npm run start` en segundo plano y `Invoke-RestMethod http://localhost:3055/api/alertas/stock` → Expected: `resumen` total 5, sinStock 1, bajos 4. Cortar el servidor.

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat(backend): seed con 10 artículos y 2 préstamos de ejemplo"
```

---

### Task 7: Frontend base (scaffold, tema marino, router, layout)

**Files:**
- Create (CLI): `frontend/`
- Modify: `frontend/vite.config.js`, `frontend/index.html`, `frontend/package.json` (scripts `lint`, `test`), `frontend/src/index.css`, `frontend/src/main.jsx`, `frontend/src/App.jsx`
- Create: `frontend/.env.example`, `frontend/src/lib/api.js`, `frontend/src/hooks/useApi.js`
- Create: `frontend/src/components/layout/DashboardLayout.jsx`, `Sidebar.jsx`, `PageHeader.jsx`
- Create: `frontend/src/pages/Inicio.jsx`, `Articulos.jsx`, `Proximamente.jsx` (Inicio y Articulos quedan como cascarón hasta las tareas 9 y 10)
- Delete: archivos de ejemplo del scaffold (`src/App.css`, `src/assets/`)

**Interfaces:**
- Produces: `apiGet(path, { signal }): Promise<any>` (lanza `Error` si la respuesta no es 2xx); `useApi(path): { data, error, loading, reload }`; `<PageHeader titulo descripcion />`; `<Proximamente titulo descripcion />`; tokens Tailwind `marino-50…950`.

- [ ] **Step 1: Generar el proyecto e instalar dependencias**

Run (desde `sanjoInventario/`): `npm create vite@latest frontend -- --template react`
Si el asistente pregunta algo (rolldown, instalar y arrancar), responder que **no** arranque solo. Expected: carpeta `frontend/` con React 19 + Vite 8, JS plano.
Run (en `frontend/`): `npm i` y luego `npm i react-router-dom lucide-react` y `npm i -D tailwindcss @tailwindcss/vite oxlint vitest`.

- [ ] **Step 2: Verificar los íconos que se van a usar**

Run: `node -e "import('lucide-react').then(m => console.log(['OctagonAlert','TriangleAlert','CircleCheck','LayoutDashboard','Package','HandHelping','ArrowLeftRight','Menu','X','Download','RefreshCw','WifiOff','Clock'].map(n => n + ':' + (n in m)).join('  ')))"`
Expected: todos `true`. Si alguno da `false`, buscar el nombre vigente (`Object.keys(m).filter(k => /alert|help|clock/i.test(k))`) y usarlo en el resto de las tareas.

- [ ] **Step 3: Limpiar el scaffold**

Run (en `frontend/`): `Remove-Item src\App.css; Remove-Item -Recurse src\assets` (si existen).

- [ ] **Step 4: `vite.config.js`, `index.html`, `.env.example`, scripts**

`frontend/vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```
`frontend/index.html` (dejar el resto del scaffold): `<html lang="es">`, `<title>Sanjo · Informática — Stock</title>`.
`frontend/.env.example`:
```dotenv
VITE_API_URL=http://localhost:3000/api
```
En `frontend/package.json` dejar en `scripts`: `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`, `"lint": "oxlint"`, `"test": "vitest run"`.

- [ ] **Step 5: Paleta y estilos base (`src/index.css`)**

```css
@import "tailwindcss";

@theme {
  --color-marino-50: #F1F5FA;
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

@layer base {
  body {
    @apply bg-slate-50 text-marino-900 antialiased;
  }
}
```

- [ ] **Step 6: Cliente de API y hook**

`frontend/src/lib/api.js`:
```js
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function apiGet(path, { signal } = {}) {
  const respuesta = await fetch(`${BASE_URL}${path}`, { signal });
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió ${respuesta.status} al pedir ${path}`);
  }
  return respuesta.json();
}
```
`frontend/src/hooks/useApi.js`:
```js
import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api.js';

export function useApi(path) {
  const [estado, setEstado] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    setEstado((previo) => ({ ...previo, error: null, loading: true }));
    apiGet(path, { signal: controlador.signal })
      .then((data) => setEstado({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setEstado({ data: null, error, loading: false });
        }
      });
    return () => controlador.abort();
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...estado, reload };
}
```

- [ ] **Step 7: Layout**

`frontend/src/components/layout/PageHeader.jsx`:
```jsx
export default function PageHeader({ titulo, descripcion }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-marino-900">{titulo}</h1>
      {descripcion && <p className="mt-1 text-sm text-slate-600">{descripcion}</p>}
    </header>
  );
}
```
`frontend/src/components/layout/Sidebar.jsx`:
```jsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeftRight, HandHelping, LayoutDashboard, Menu, Package, X } from 'lucide-react';

const ITEMS = [
  { to: '/', etiqueta: 'Inicio', Icono: LayoutDashboard, end: true },
  { to: '/articulos', etiqueta: 'Artículos', Icono: Package },
  { to: '/prestamos', etiqueta: 'Préstamos', Icono: HandHelping },
  { to: '/movimientos', etiqueta: 'Movimientos', Icono: ArrowLeftRight },
];

const claseItem = ({ isActive }) =>
  isActive
    ? 'flex items-center gap-3 rounded-lg bg-white/15 px-3 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
    : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-marino-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

function Marca() {
  return (
    <div>
      <p className="text-lg font-semibold text-white">Sanjo · Informática</p>
      <p className="text-xs text-marino-300">Control de stock y préstamos</p>
    </div>
  );
}

function Navegacion({ alNavegar }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {ITEMS.map(({ to, etiqueta, Icono, end }) => (
        <NavLink key={to} to={to} end={end} className={claseItem} onClick={alNavegar}>
          <Icono className="size-5" aria-hidden="true" />
          {etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-8 bg-marino-950 px-4 py-6 lg:flex">
        <Marca />
        <Navegacion />
      </aside>

      <header className="sticky top-0 z-20 bg-marino-950 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Marca />
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-lg p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {abierto ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
        {abierto && (
          <div id="menu-movil" className="mt-3 border-t border-white/10 pt-3">
            <Navegacion alNavegar={() => setAbierto(false)} />
          </div>
        )}
      </header>
    </>
  );
}
```
`frontend/src/components/layout/DashboardLayout.jsx`:
```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 8: Páginas cascarón, rutas y arranque**

`frontend/src/pages/Proximamente.jsx`:
```jsx
import { Clock } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';

export default function Proximamente({ titulo, descripcion }) {
  return (
    <>
      <PageHeader titulo={titulo} descripcion={descripcion} />
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        <Clock className="size-6 text-marino-600" aria-hidden="true" />
        <p>Esta sección llega en la próxima entrega.</p>
      </div>
    </>
  );
}
```
`frontend/src/pages/Inicio.jsx` y `frontend/src/pages/Articulos.jsx` (cascarones; se reemplazan en las tareas 9 y 10):
```jsx
import PageHeader from '../components/layout/PageHeader.jsx';

export default function Inicio() {
  return <PageHeader titulo="Inicio" descripcion="Estado del stock del Departamento de Informática." />;
}
```
(`Articulos.jsx` igual, con `titulo="Artículos"` y la función `Articulos`.)

`frontend/src/App.jsx`:
```jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Articulos from './pages/Articulos.jsx';
import Inicio from './pages/Inicio.jsx';
import Proximamente from './pages/Proximamente.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Inicio />} />
        <Route path="articulos" element={<Articulos />} />
        <Route
          path="prestamos"
          element={<Proximamente titulo="Préstamos" descripcion="Registro de equipos prestados y devoluciones." />}
        />
        <Route
          path="movimientos"
          element={<Proximamente titulo="Movimientos" descripcion="Historial de ingresos y consumo de insumos." />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
```
`frontend/src/main.jsx`:
```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 9: Verificar**

Run (en `frontend/`): `npm run build` → Expected: build OK. `npm run lint` → Expected: sin errores (corregir lo que marque). `npm run dev`, abrir `http://localhost:5173`: barra lateral marino con 4 ítems, Inicio y las dos pantallas "Próximamente" navegan sin errores en consola.

- [ ] **Step 10: Commit**

```bash
git add frontend
git commit -m "feat(frontend): proyecto Vite con tema marino, router y layout del dashboard"
```

---

### Task 8: Helpers puros con tests (porcentaje de stock y reporte CSV)

**Files:**
- Create: `frontend/src/lib/porcentaje.js`, `frontend/src/lib/porcentaje.test.js`
- Create: `frontend/src/lib/csv.js`, `frontend/src/lib/csv.test.js`
- Create: `frontend/src/lib/nivelEstilos.js`

**Interfaces:**
- Produces:
  - `porcentajeStock(stockActual: number, stockMinimo: number): number` (0–100, entero; 0 si el mínimo es 0)
  - `armarCsvReporteCompra(items): string` (separador `;`, saltos `\r\n`, sin BOM), `nombreArchivoReporte(fecha?: Date): string`, `descargarCsv(nombreArchivo: string, contenido: string): void` (agrega el BOM UTF-8 al armar el Blob)
  - `NIVELES`: `{ SIN_STOCK, BAJO }`, cada uno con `{ etiqueta, Icono, insignia, fila, borde, relleno, pista }` (clases de Tailwind literales)

- [ ] **Step 1: Tests que fallan**

`frontend/src/lib/porcentaje.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { porcentajeStock } from './porcentaje.js';

describe('porcentajeStock', () => {
  it('es 0 si el stock es 0', () => expect(porcentajeStock(0, 5)).toBe(0));
  it('es proporcional al mínimo', () => expect(porcentajeStock(3, 5)).toBe(60));
  it('llega a 100 justo en el mínimo', () => expect(porcentajeStock(5, 5)).toBe(100));
  it('nunca pasa de 100', () => expect(porcentajeStock(9, 5)).toBe(100));
  it('es 0 si el mínimo es 0', () => {
    expect(porcentajeStock(0, 0)).toBe(0);
    expect(porcentajeStock(3, 0)).toBe(0);
  });
});
```
`frontend/src/lib/csv.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { armarCsvReporteCompra, nombreArchivoReporte } from './csv.js';

const item = (extra = {}) => ({
  nombre: 'Cable HDMI 2 m',
  categoria: 'Cables',
  esRetornable: false,
  stockActual: 3,
  stockMinimo: 5,
  faltante: 2,
  nivel: 'BAJO',
  ...extra,
});

describe('armarCsvReporteCompra', () => {
  it('arma encabezado y filas con ; y saltos CRLF', () => {
    expect(armarCsvReporteCompra([item()])).toBe(
      'Artículo;Categoría;Tipo;Stock actual;Stock mínimo;Faltante;Nivel\r\n' +
        'Cable HDMI 2 m;Cables;Consumible;3;5;2;Stock bajo',
    );
  });
  it('traduce tipo y nivel', () => {
    const csv = armarCsvReporteCompra([
      item({ esRetornable: true, nivel: 'SIN_STOCK', stockActual: 0, faltante: 5 }),
    ]);
    expect(csv).toContain('Retornable');
    expect(csv).toContain('Sin stock');
  });
  it('escapa punto y coma y comillas', () => {
    const csv = armarCsvReporteCompra([item({ nombre: 'Cable "HDMI"; 2 m' })]);
    expect(csv).toContain('"Cable ""HDMI""; 2 m"');
  });
  it('sin ítems devuelve solo el encabezado', () => {
    expect(armarCsvReporteCompra([])).toBe(
      'Artículo;Categoría;Tipo;Stock actual;Stock mínimo;Faltante;Nivel',
    );
  });
});

describe('nombreArchivoReporte', () => {
  it('usa la fecha local con ceros', () => {
    expect(nombreArchivoReporte(new Date(2026, 8, 5))).toBe('reporte-compra-2026-09-05.csv');
  });
});
```
Run (en `frontend/`): `npm test` → Expected: FAIL (módulos inexistentes).

- [ ] **Step 2: Implementación**

`frontend/src/lib/porcentaje.js`:
```js
/** Ancho de la barra de stock: stock actual respecto del mínimo, entre 0 y 100. */
export function porcentajeStock(stockActual, stockMinimo) {
  if (stockMinimo <= 0) return 0;
  return Math.min(100, Math.round((stockActual / stockMinimo) * 100));
}
```
`frontend/src/lib/csv.js`:
```js
const COLUMNAS = ['Artículo', 'Categoría', 'Tipo', 'Stock actual', 'Stock mínimo', 'Faltante', 'Nivel'];
const TEXTO_NIVEL = { SIN_STOCK: 'Sin stock', BAJO: 'Stock bajo' };

function celda(valor) {
  const texto = String(valor);
  return /[;"\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/** Separador `;` porque Excel en español (Argentina) lo usa como separador de lista. */
export function armarCsvReporteCompra(items) {
  const filas = items.map((i) => [
    i.nombre,
    i.categoria,
    i.esRetornable ? 'Retornable' : 'Consumible',
    i.stockActual,
    i.stockMinimo,
    i.faltante,
    TEXTO_NIVEL[i.nivel] ?? i.nivel,
  ]);
  return [COLUMNAS, ...filas].map((fila) => fila.map(celda).join(';')).join('\r\n');
}

export function nombreArchivoReporte(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `reporte-compra-${anio}-${mes}-${dia}.csv`;
}

/** El BOM UTF-8 hace que Excel muestre bien los acentos. */
export function descargarCsv(nombreArchivo, contenido) {
  const blob = new Blob(['﻿', contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
```
`frontend/src/lib/nivelEstilos.js` (clases literales; ver constraint de Tailwind):
```js
import { OctagonAlert, TriangleAlert } from 'lucide-react';

export const NIVELES = {
  SIN_STOCK: {
    etiqueta: 'Sin stock',
    Icono: OctagonAlert,
    insignia: 'bg-red-100 text-red-800',
    fila: 'bg-red-50',
    borde: 'border-l-4 border-red-600',
    relleno: 'bg-red-600',
    pista: 'bg-red-100',
  },
  BAJO: {
    etiqueta: 'Stock bajo',
    Icono: TriangleAlert,
    insignia: 'bg-amber-100 text-amber-900',
    fila: 'bg-amber-50',
    borde: 'border-l-4 border-amber-500',
    relleno: 'bg-amber-500',
    pista: 'bg-amber-100',
  },
};
```

- [ ] **Step 3: Correr y ver que pasa**

Run: `npm test` → Expected: PASS (5 + 5 tests). `npm run lint` → sin errores.

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): helpers de porcentaje de stock y reporte CSV con tests"
```

---

### Task 9: Inicio — tarjetas KPI y panel Alertas de Stock

**Files:**
- Create: `frontend/src/components/ui/NivelBadge.jsx`, `frontend/src/components/ui/ErrorConexion.jsx`
- Create: `frontend/src/components/dashboard/StatCard.jsx`, `frontend/src/components/dashboard/AlertasStock.jsx`
- Modify: `frontend/src/pages/Inicio.jsx` (reemplaza el cascarón)

**Interfaces:**
- Consumes: `useApi`, `NIVELES`, `porcentajeStock`, `armarCsvReporteCompra`, `nombreArchivoReporte`, `descargarCsv`, `PageHeader`; respuesta de `GET /alertas/stock` (`{ generadoEn, resumen: { total, sinStock, bajos }, items: [{ id, nombre, categoria, esRetornable, stockActual, stockMinimo, faltante, nivel, prestados, disponibles }] }`).
- Produces: `<NivelBadge nivel />`; `<ErrorConexion onReintentar />`; `<StatCard etiqueta valor Icono tono cargando />` (`tono`: `'neutro' | 'alerta'`); `<AlertasStock datos cargando error onReintentar />`.

- [ ] **Step 1: Componentes de UI compartidos**

`frontend/src/components/ui/NivelBadge.jsx`:
```jsx
import { NIVELES } from '../../lib/nivelEstilos.js';

/** Nivel de alerta con color, ícono y texto: nunca solo color. */
export default function NivelBadge({ nivel }) {
  const estilo = NIVELES[nivel];
  if (!estilo) return null;
  const { Icono } = estilo;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${estilo.insignia}`}>
      <Icono className="size-3.5" aria-hidden="true" />
      {estilo.etiqueta}
    </span>
  );
}
```
`frontend/src/components/ui/ErrorConexion.jsx`:
```jsx
import { RefreshCw, WifiOff } from 'lucide-react';

export default function ErrorConexion({ onReintentar }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 px-5 py-6 text-slate-700">
      <WifiOff className="size-6 text-red-700" aria-hidden="true" />
      <p className="font-medium">No se pudo conectar con el servidor.</p>
      <button
        type="button"
        onClick={onReintentar}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-marino-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `StatCard`**

Etiqueta en minúscula inicial sin dos puntos; el valor en `text-marino-900` siempre (el estado lo dan el fondo y el ícono, no el color del número) y sin `tabular-nums`.
```jsx
const TONOS = {
  neutro: { tarjeta: 'border-slate-200 bg-white', icono: 'bg-marino-50 text-marino-700' },
  alerta: { tarjeta: 'border-red-200 bg-red-50', icono: 'bg-red-100 text-red-700' },
};

export default function StatCard({ etiqueta, valor, Icono, tono = 'neutro', cargando = false }) {
  const estilo = TONOS[tono];
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-5 shadow-sm ${estilo.tarjeta}`}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${estilo.icono}`}>
        <Icono className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-slate-600">{etiqueta}</p>
        <p className="text-3xl font-semibold text-marino-900" aria-busy={cargando}>
          {cargando ? '—' : (valor ?? '—')}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `AlertasStock`**

`frontend/src/components/dashboard/AlertasStock.jsx`:
```jsx
import { CircleCheck, Download } from 'lucide-react';
import { armarCsvReporteCompra, descargarCsv, nombreArchivoReporte } from '../../lib/csv.js';
import { NIVELES } from '../../lib/nivelEstilos.js';
import { porcentajeStock } from '../../lib/porcentaje.js';
import ErrorConexion from '../ui/ErrorConexion.jsx';
import NivelBadge from '../ui/NivelBadge.jsx';

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

function FilaAlerta({ item }) {
  const estilo = NIVELES[item.nivel];
  const porcentaje = porcentajeStock(item.stockActual, item.stockMinimo);
  const contexto = item.esRetornable
    ? ` · ${plural(item.prestados, 'prestado', 'prestados')} · ${plural(item.disponibles, 'disponible', 'disponibles')}`
    : '';
  return (
    <li
      className={`grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center ${estilo.fila} ${estilo.borde}`}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-marino-900">{item.nombre}</p>
        <p className="text-sm text-slate-600">
          {item.categoria}
          {contexto}
        </p>
      </div>
      <div>
        <p className="text-sm text-slate-700">
          Stock <span className="font-semibold text-marino-900">{item.stockActual}</span> de mín. {item.stockMinimo}
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={porcentaje}
          aria-label={`Stock de ${item.nombre} respecto del mínimo`}
          className={`mt-1.5 h-2 overflow-hidden rounded-full ${estilo.pista}`}
        >
          <div className={`h-full rounded-full ${estilo.relleno}`} style={{ width: `${porcentaje}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        <NivelBadge nivel={item.nivel} />
        <span className="text-sm font-medium text-slate-700">
          {item.faltante > 0 ? `Faltan ${item.faltante}` : 'En el mínimo'}
        </span>
      </div>
    </li>
  );
}

export default function AlertasStock({ datos, cargando, error, onReintentar }) {
  const items = datos?.items ?? [];
  const hayAlertas = items.length > 0;
  const subtitulo = hayAlertas
    ? `${items.length} ${items.length === 1 ? 'artículo requiere' : 'artículos requieren'} reposición`
    : 'Compara el stock actual con el mínimo de cada artículo.';

  let cuerpo;
  if (cargando) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando alertas…
      </p>
    );
  } else if (error) {
    cuerpo = <ErrorConexion onReintentar={onReintentar} />;
  } else if (!hayAlertas) {
    cuerpo = (
      <div className="flex items-center gap-3 bg-emerald-50 px-5 py-6 text-emerald-900">
        <CircleCheck className="size-6 text-emerald-700" aria-hidden="true" />
        <p className="font-medium">Todo el stock está por encima del mínimo.</p>
      </div>
    );
  } else {
    cuerpo = (
      <ul className="divide-y divide-slate-200">
        {items.map((item) => (
          <FilaAlerta key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="titulo-alertas" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${hayAlertas && !cargando ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}
      >
        <div>
          <h2 id="titulo-alertas" className="text-base font-semibold text-marino-900">
            Alertas de stock
          </h2>
          <p className="text-sm text-slate-600">{cargando ? 'Cargando…' : subtitulo}</p>
        </div>
        <button
          type="button"
          disabled={!hayAlertas || cargando}
          onClick={() => descargarCsv(nombreArchivoReporte(), armarCsvReporteCompra(items))}
          className="inline-flex items-center gap-2 rounded-lg bg-marino-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar CSV
        </button>
      </header>
      {cuerpo}
    </section>
  );
}
```

- [ ] **Step 4: Página Inicio**

`frontend/src/pages/Inicio.jsx`:
```jsx
import { OctagonAlert, Package, TriangleAlert } from 'lucide-react';
import AlertasStock from '../components/dashboard/AlertasStock.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { useApi } from '../hooks/useApi.js';

export default function Inicio() {
  const alertas = useApi('/alertas/stock');
  const articulos = useApi('/articulos');
  const resumen = alertas.data?.resumen;

  return (
    <>
      <PageHeader titulo="Inicio" descripcion="Estado del stock del Departamento de Informática." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard etiqueta="Artículos" valor={articulos.data?.length} Icono={Package} cargando={articulos.loading} />
        <StatCard
          etiqueta="En alerta"
          valor={resumen?.total}
          Icono={TriangleAlert}
          tono={resumen?.total > 0 ? 'alerta' : 'neutro'}
          cargando={alertas.loading}
        />
        <StatCard
          etiqueta="Sin stock"
          valor={resumen?.sinStock}
          Icono={OctagonAlert}
          tono={resumen?.sinStock > 0 ? 'alerta' : 'neutro'}
          cargando={alertas.loading}
        />
      </div>
      <div className="mt-6">
        <AlertasStock
          datos={alertas.data}
          cargando={alertas.loading}
          error={alertas.error}
          onReintentar={alertas.reload}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 5: Verificar**

Con el backend sembrado (tarea 6) corriendo en `:3000`: `npm run dev` en `frontend/`, abrir `http://localhost:5173`.
Expected: tarjetas 10 / 5 / 1 (las dos últimas en rojo suave); panel con 5 filas en el orden Cable de red Cat6 (rojo, "Sin stock", "Faltan 10"), Cable HDMI 2 m, Pilas AAA, Teclado USB, Parlante portátil (ámbar, "En el mínimo", "1 prestado · 0 disponibles"). Con el backend apagado: mensaje de error con "Reintentar". `npm run lint` y `npm run build` sin errores.

- [ ] **Step 6: Commit**

```bash
git add frontend
git commit -m "feat(frontend): dashboard de inicio con KPIs y panel Alertas de Stock"
```

---

### Task 10: Pantalla Artículos

**Files:**
- Modify: `frontend/src/pages/Articulos.jsx` (reemplaza el cascarón)

**Interfaces:**
- Consumes: `useApi('/articulos')` (cada ítem: `{ id, nombre, categoria, esRetornable, stockActual, stockMinimo, prestados, disponibles, nivel }`), `NIVELES`, `NivelBadge`, `ErrorConexion`, `PageHeader`.

- [ ] **Step 1: Implementar la página**

`frontend/src/pages/Articulos.jsx`:
```jsx
import { CircleCheck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ErrorConexion from '../components/ui/ErrorConexion.jsx';
import NivelBadge from '../components/ui/NivelBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { NIVELES } from '../lib/nivelEstilos.js';

const COLUMNAS_NUMERICAS = 'px-4 py-3 text-right tabular-nums';

function NoAplica() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">No aplica</span>
    </>
  );
}

function FilaArticulo({ articulo }) {
  const estilo = NIVELES[articulo.nivel];
  return (
    <tr className={estilo?.fila ?? ''}>
      <td className={`px-4 py-3 font-medium text-marino-900 ${estilo?.borde ?? 'border-l-4 border-transparent'}`}>
        {articulo.nombre}
      </td>
      <td className="px-4 py-3 text-slate-700">{articulo.categoria}</td>
      <td className="px-4 py-3 text-slate-700">{articulo.esRetornable ? 'Retornable' : 'Consumible'}</td>
      <td className={`${COLUMNAS_NUMERICAS} font-semibold text-marino-900`}>{articulo.stockActual}</td>
      <td className={`${COLUMNAS_NUMERICAS} text-slate-700`}>{articulo.stockMinimo}</td>
      <td className={`${COLUMNAS_NUMERICAS} text-slate-700`}>
        {articulo.esRetornable ? articulo.prestados : <NoAplica />}
      </td>
      <td className={`${COLUMNAS_NUMERICAS} text-slate-700`}>
        {articulo.esRetornable ? articulo.disponibles : <NoAplica />}
      </td>
      <td className="px-4 py-3">
        {articulo.nivel ? (
          <NivelBadge nivel={articulo.nivel} />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            En orden
          </span>
        )}
      </td>
    </tr>
  );
}

export default function Articulos() {
  const { data, error, loading, reload } = useApi('/articulos');

  let cuerpo;
  if (loading) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando artículos…
      </p>
    );
  } else if (error) {
    cuerpo = <ErrorConexion onReintentar={reload} />;
  } else if (data.length === 0) {
    cuerpo = (
      <p className="px-5 py-8 text-sm text-slate-600">
        Todavía no hay artículos cargados. Para ver datos de ejemplo, ejecutá <strong>npm run seed</strong> en la
        carpeta backend.
      </p>
    );
  } else {
    cuerpo = (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Artículo</th>
              <th scope="col" className="px-4 py-3">Categoría</th>
              <th scope="col" className="px-4 py-3">Tipo</th>
              <th scope="col" className="px-4 py-3 text-right">Stock</th>
              <th scope="col" className="px-4 py-3 text-right">Mínimo</th>
              <th scope="col" className="px-4 py-3 text-right">Prestados</th>
              <th scope="col" className="px-4 py-3 text-right">Disponibles</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((articulo) => (
              <FilaArticulo key={articulo.id} articulo={articulo} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Artículos"
        descripcion="Stock total del colegio, lo que está prestado y lo que queda disponible."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{cuerpo}</div>
    </>
  );
}
```

- [ ] **Step 2: Verificar**

`http://localhost:5173/articulos` con datos sembrados. Expected: 10 filas ordenadas por categoría y nombre; Cable de red Cat6 con fondo rojo y "Sin stock"; Cable HDMI 2 m, Pilas AAA, Teclado USB y Parlante portátil en ámbar con "Stock bajo"; Proyector con 1 prestado y 3 disponibles; consumibles con "—" en prestados y disponibles; los demás "En orden". La tabla se desplaza horizontalmente en pantallas angostas. `npm run lint` y `npm run build` sin errores.

- [ ] **Step 3: Commit**

```bash
git add frontend
git commit -m "feat(frontend): pantalla de artículos con stock, prestados y disponibles"
```

---

### Task 11: Documentación y verificación final

**Files:**
- Modify: `readme.md`

- [ ] **Step 1: Reescribir `readme.md`**

```markdown
# Sistema de Gestión de Stock - Informática 💻

Plataforma web interna para el control de inventario, préstamos de equipos y alertas de reposición del Departamento de Informática del **Colegio San José de la Providencia**. Corre 100% local.

## Tecnologías

- **Frontend:** React 19 + Vite + Tailwind CSS v4 (azul marino y blanco)
- **Backend:** NestJS (API REST) + TypeORM
- **Base de datos:** PostgreSQL 18 instalado en la PC (sin Docker)

## Estructura

    sanjoInventario/
    ├── backend/    API REST en NestJS
    ├── frontend/   Aplicación React (Vite)
    ├── docs/       Diseño y planes de implementación
    └── readme.md

## Requisitos

Node 24 y PostgreSQL 18 corriendo en `localhost:5432`.

## Puesta en marcha

1. **Bases de datos** (una sola vez; pide la contraseña del usuario `postgres`):

       $psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
       @'
       CREATE DATABASE "InventarioInformatica";
       CREATE DATABASE "InventarioInformatica_test";
       '@ | & $psql -U postgres -h localhost

2. **Backend** (`backend/`):

       npm install
       copy .env.example .env     # completar DB_PASSWORD
       npm run seed               # opcional: 10 artículos y 2 préstamos de ejemplo
       npm run start:dev          # http://localhost:3000/api

3. **Frontend** (`frontend/`, en otra terminal):

       npm install
       npm run dev                # http://localhost:5173

## Tests

- Backend: `npm test` (unitarios) y `npm run test:e2e` (usa la base `InventarioInformatica_test`).
- Frontend: `npm test` (funciones puras) y `npm run lint`.

## API (prefijo `/api`)

| Recurso | Endpoints |
|---|---|
| Artículos | `GET /articulos`, `POST /articulos`, `GET/PATCH/DELETE /articulos/:id` |
| Alertas | `GET /alertas/stock` |

## Cómo se calcula el stock

`stock_actual` es el **total del colegio**: no baja cuando se presta un equipo. Lo prestado y lo disponible se calculan aparte. Un artículo entra en alerta cuando `stock_actual <= stock_minimo` (**Sin stock** si es 0, **Stock bajo** si no), y por eso un préstamo nunca dispara una alerta de compra.

## Estado

- **Entrega 1 (esta):** artículos, alertas de stock y dashboard.
- **Entrega 2:** préstamos y movimientos (endpoints y pantallas).

Diseño completo: `docs/superpowers/specs/2026-09-18-sistema-stock-informatica-design.md`.
```

- [ ] **Step 2: Verificación completa (evidencia antes de afirmar)**

Ejecutar y registrar la salida de cada uno:
1. `backend/`: `npm test`, `npm run test:e2e`, `npm run build` → todo en verde.
2. `frontend/`: `npm test`, `npm run lint`, `npm run build` → todo en verde.
3. Criterio 3: con el backend levantado, `Invoke-RestMethod http://localhost:3000/api/alertas/stock` → 5 ítems en el orden Cable de red Cat6, Cable HDMI 2 m, Pilas AAA, Teclado USB, Parlante portátil.
4. Criterio 4: con ambas apps corriendo, capturas de `/` y `/articulos` en ancho de escritorio (1280) y móvil (390), con Playwright y el canal `msedge` desde un script fuera del repo; revisar que no haya texto cortado ni desborde horizontal de la página. Descargar el CSV desde el botón y comprobar que empieza con los bytes `EF BB BF` (BOM), usa `;` y conserva los acentos.

- [ ] **Step 3: Commit**

```bash
git add readme.md docs
git commit -m "docs: readme con puesta en marcha sin Docker y plan de la entrega 1"
```
