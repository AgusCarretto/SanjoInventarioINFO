import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import { cargarDatosEjemplo } from './cargar-datos-ejemplo.js';

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
await main();
