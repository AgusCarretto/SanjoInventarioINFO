import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import { cargarCatalogoInicial } from './catalogo.js';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const ds = app.get(DataSource);
    await cargarCatalogoInicial(ds);
    const [f] = await ds.query(
      'SELECT (SELECT count(*) FROM categorias)::int AS categorias, (SELECT count(*) FROM tipos_articulo)::int AS tipos',
    );
    console.log(
      `Catálogo cargado: ${f.categorias} categorías y ${f.tipos} tipos.`,
    );
  } finally {
    await app.close();
  }
}
await main();
