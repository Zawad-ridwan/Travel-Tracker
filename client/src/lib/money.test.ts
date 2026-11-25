import { describe, expect, it } from 'vitest';
import { convertMoney, currencyLabel, tidyAmount } from './money';

const RATES = { USD: 1, BDT: 120, JPY: 150 };

describe('money helpers', () => {
  it('converts through US dollar rates', () => {
    expect(convertMoney(1500, 'JPY', 'BDT', RATES)).toBe(1200);
    expect(convertMoney(10, 'USD', 'USD', undefined)).toBe(10);
    expect(convertMoney(10, 'USD', 'EUR', RATES)).toBeNull();
    expect(convertMoney(10, 'USD', 'BDT', undefined)).toBeNull();
  });

  it('rounds suggestions to tidy numbers', () => {
    expect(tidyAmount(12345)).toBe(12300);
    expect(tidyAmount(4567)).toBe(4570);
    expect(tidyAmount(87)).toBe(87);
    expect(tidyAmount(0)).toBe(0);
  });

  it('labels currencies with a flag and name', () => {
    expect(currencyLabel('BDT')).toBe('🇧🇩 BDT · Bangladeshi Taka');
    expect(currencyLabel('XYZ')).toBe('XYZ');
  });
});
