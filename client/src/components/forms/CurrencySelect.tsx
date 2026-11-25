import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { CURRENCIES } from '@tt/shared';
import { countryFlag } from '@/lib/format';
import { Select } from './Field';

type CurrencySelectProps = Omit<ComponentPropsWithoutRef<typeof Select>, 'children'>;

/** A currency picker: "🇧🇩 BDT · Bangladeshi Taka". */
export const CurrencySelect = forwardRef<HTMLSelectElement, CurrencySelectProps>((props, ref) => (
  <Select ref={ref} {...props}>
    {CURRENCIES.map((c) => (
      <option key={c.code} value={c.code}>
        {countryFlag(c.country)} {c.code} · {c.name}
      </option>
    ))}
  </Select>
));
CurrencySelect.displayName = 'CurrencySelect';
