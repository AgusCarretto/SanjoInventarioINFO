import { formatearFechaLocal } from './fecha.js';

describe('formatearFechaLocal', () => {
  it('usa la fecha local aunque en UTC ya sea otro día', () => {
    expect(formatearFechaLocal(new Date(2026, 8, 18, 23, 30))).toBe(
      '2026-09-18',
    );
  });
  it('completa con ceros mes y día', () => {
    expect(formatearFechaLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
