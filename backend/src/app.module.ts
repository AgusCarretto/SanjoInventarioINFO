import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
