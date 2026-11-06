import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../data/defaults';
import { parseBackup } from './export';

describe('yedek doğrulama', () => {
  it('geçerli v2 yedeğini kabul eder', () => {
    const backup = { version: 2, exportedAt: new Date().toISOString(), products: [], categories: [], settings: DEFAULT_SETTINGS };
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
  });

  it('tanınmayan yedek sürümünü reddeder', () => {
    expect(() => parseBackup(JSON.stringify({ version: 1 }))).toThrow();
  });
});
