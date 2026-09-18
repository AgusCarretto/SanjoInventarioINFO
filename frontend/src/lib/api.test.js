import { describe, expect, it } from 'vitest';
import { mensajeDeErrorApi } from './api.js';

describe('mensajeDeErrorApi', () => {
  it('usa el mensaje del servidor cuando es un texto', () => {
    expect(mensajeDeErrorApi({ message: 'Ya existe un artículo con ese nombre' }, 409)).toBe(
      'Ya existe un artículo con ese nombre',
    );
  });

  it('une con punto los mensajes de validación cuando son varios', () => {
    expect(mensajeDeErrorApi({ message: ['El nombre es obligatorio', 'Otro problema'] }, 400)).toBe(
      'El nombre es obligatorio. Otro problema',
    );
  });

  it('sin mensaje usa un texto genérico con el código de estado', () => {
    expect(mensajeDeErrorApi(null, 500)).toBe('El servidor respondió 500');
    expect(mensajeDeErrorApi({}, 404)).toBe('El servidor respondió 404');
  });
});
