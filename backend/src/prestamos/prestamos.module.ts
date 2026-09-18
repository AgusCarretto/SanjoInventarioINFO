import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from './prestamo.entity.js';

@Module({ imports: [TypeOrmModule.forFeature([Prestamo])] })
export class PrestamosModule {}
