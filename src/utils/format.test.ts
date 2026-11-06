import { describe, expect, it } from 'vitest';
import { daysUntil, formatCurrency, formatDate } from './format';

describe('format yardımcıları', () => {
  it('geçersiz tarihleri güvenli gösterir', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate('geçersiz')).toBe('—');
  });

  it('para değerini Türk lirası olarak biçimler', () => {
    expect(formatCurrency(1250.5)).toContain('1.250,50');
  });

  it('boş düğün tarihinde gün sayısı üretmez', () => {
    expect(daysUntil('')).toBeNull();
  });
});
