import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertasModule } from './alertas/alertas.module.js';
import { ArticulosModule } from './articulos/articulos.module.js';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { MovimientosModule } from './movimientos/movimientos.module.js';
import { PrestamosModule } from './prestamos/prestamos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // En tests: .env.test pisa solo DB_NAME; el resto sale de .env.
      envFilePath:
        process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env'],
    }),
    // Sirve el frontend ya compilado (npm run build en frontend/) para correr
    // como un solo proceso. En desarrollo se sigue usando Vite (npm run dev)
    // aparte; esto no interfiere porque solo entra en juego si existe dist/.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'frontend', 'dist'),
      exclude: ['/api/{*splat}'],
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
    CatalogoModule,
    ArticulosModule,
    PrestamosModule,
    MovimientosModule,
    AlertasModule,
  ],
})
export class AppModule {}
