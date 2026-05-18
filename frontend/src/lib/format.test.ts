import { describe, expect, test } from 'vitest';
import { monthLabel, toMonthInput } from './format';

describe('format helpers', () => {
  test('formats month label', () => {
    expect(monthLabel('2026-05')).toBe('Tháng 05/2026');
  });

  test('formats month input', () => {
    expect(toMonthInput(new Date('2026-05-18T00:00:00.000Z'))).toBe('2026-05');
  });
});
