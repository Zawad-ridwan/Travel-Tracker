/**
 * Currencies the app supports (ISO 4217 codes).
 * `country` picks the flag shown next to the code (EU = the European Union flag).
 */
export interface Currency {
  code: string;
  name: string;
  country: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', country: 'US' },
  { code: 'EUR', name: 'Euro', country: 'EU' },
  { code: 'GBP', name: 'British Pound', country: 'GB' },
  { code: 'BDT', name: 'Bangladeshi Taka', country: 'BD' },
  { code: 'INR', name: 'Indian Rupee', country: 'IN' },
  { code: 'PKR', name: 'Pakistani Rupee', country: 'PK' },
  { code: 'NPR', name: 'Nepalese Rupee', country: 'NP' },
  { code: 'LKR', name: 'Sri Lankan Rupee', country: 'LK' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', country: 'BT' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', country: 'MV' },
  { code: 'JPY', name: 'Japanese Yen', country: 'JP' },
  { code: 'CNY', name: 'Chinese Yuan', country: 'CN' },
  { code: 'KRW', name: 'South Korean Won', country: 'KR' },
  { code: 'TWD', name: 'New Taiwan Dollar', country: 'TW' },
  { code: 'HKD', name: 'Hong Kong Dollar', country: 'HK' },
  { code: 'MOP', name: 'Macanese Pataca', country: 'MO' },
  { code: 'MNT', name: 'Mongolian Tögrög', country: 'MN' },
  { code: 'SGD', name: 'Singapore Dollar', country: 'SG' },
  { code: 'MYR', name: 'Malaysian Ringgit', country: 'MY' },
  { code: 'THB', name: 'Thai Baht', country: 'TH' },
  { code: 'IDR', name: 'Indonesian Rupiah', country: 'ID' },
  { code: 'PHP', name: 'Philippine Peso', country: 'PH' },
  { code: 'VND', name: 'Vietnamese Dong', country: 'VN' },
  { code: 'KHR', name: 'Cambodian Riel', country: 'KH' },
  { code: 'LAK', name: 'Lao Kip', country: 'LA' },
  { code: 'MMK', name: 'Myanmar Kyat', country: 'MM' },
  { code: 'AED', name: 'UAE Dirham', country: 'AE' },
  { code: 'SAR', name: 'Saudi Riyal', country: 'SA' },
  { code: 'QAR', name: 'Qatari Riyal', country: 'QA' },
  { code: 'KWD', name: 'Kuwaiti Dinar', country: 'KW' },
  { code: 'BHD', name: 'Bahraini Dinar', country: 'BH' },
  { code: 'OMR', name: 'Omani Rial', country: 'OM' },
  { code: 'JOD', name: 'Jordanian Dinar', country: 'JO' },
  { code: 'ILS', name: 'Israeli Shekel', country: 'IL' },
  { code: 'TRY', name: 'Turkish Lira', country: 'TR' },
  { code: 'EGP', name: 'Egyptian Pound', country: 'EG' },
  { code: 'MAD', name: 'Moroccan Dirham', country: 'MA' },
  { code: 'TND', name: 'Tunisian Dinar', country: 'TN' },
  { code: 'ZAR', name: 'South African Rand', country: 'ZA' },
  { code: 'NGN', name: 'Nigerian Naira', country: 'NG' },
  { code: 'GHS', name: 'Ghanaian Cedi', country: 'GH' },
  { code: 'KES', name: 'Kenyan Shilling', country: 'KE' },
  { code: 'TZS', name: 'Tanzanian Shilling', country: 'TZ' },
  { code: 'UGX', name: 'Ugandan Shilling', country: 'UG' },
  { code: 'ETB', name: 'Ethiopian Birr', country: 'ET' },
  { code: 'CHF', name: 'Swiss Franc', country: 'CH' },
  { code: 'SEK', name: 'Swedish Krona', country: 'SE' },
  { code: 'NOK', name: 'Norwegian Krone', country: 'NO' },
  { code: 'DKK', name: 'Danish Krone', country: 'DK' },
  { code: 'ISK', name: 'Icelandic Króna', country: 'IS' },
  { code: 'PLN', name: 'Polish Złoty', country: 'PL' },
  { code: 'CZK', name: 'Czech Koruna', country: 'CZ' },
  { code: 'HUF', name: 'Hungarian Forint', country: 'HU' },
  { code: 'RON', name: 'Romanian Leu', country: 'RO' },
  { code: 'RSD', name: 'Serbian Dinar', country: 'RS' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', country: 'UA' },
  { code: 'GEL', name: 'Georgian Lari', country: 'GE' },
  { code: 'AMD', name: 'Armenian Dram', country: 'AM' },
  { code: 'AZN', name: 'Azerbaijani Manat', country: 'AZ' },
  { code: 'KZT', name: 'Kazakhstani Tenge', country: 'KZ' },
  { code: 'UZS', name: 'Uzbekistani Som', country: 'UZ' },
  { code: 'RUB', name: 'Russian Ruble', country: 'RU' },
  { code: 'AUD', name: 'Australian Dollar', country: 'AU' },
  { code: 'NZD', name: 'New Zealand Dollar', country: 'NZ' },
  { code: 'FJD', name: 'Fijian Dollar', country: 'FJ' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'CA' },
  { code: 'MXN', name: 'Mexican Peso', country: 'MX' },
  { code: 'BRL', name: 'Brazilian Real', country: 'BR' },
  { code: 'ARS', name: 'Argentine Peso', country: 'AR' },
  { code: 'CLP', name: 'Chilean Peso', country: 'CL' },
  { code: 'COP', name: 'Colombian Peso', country: 'CO' },
  { code: 'PEN', name: 'Peruvian Sol', country: 'PE' },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);

const EURO_COUNTRIES = [
  'AD', 'AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MC', 'ME', 'MT', 'NL', 'PT', 'SI', 'SK', 'SM', 'VA', 'XK',
];
const USD_COUNTRIES = ['US', 'EC', 'SV', 'PA', 'PR', 'TL', 'ZW', 'GU', 'VI', 'AS', 'MH', 'FM', 'PW'];
const OTHER: Record<string, string> = { LI: 'CHF', GL: 'DKK', FO: 'DKK', CK: 'NZD', KI: 'AUD', NR: 'AUD', TV: 'AUD' };

/** Country code → the currency people spend there (only for currencies listed above). */
export const COUNTRY_CURRENCY: Record<string, string> = {
  ...Object.fromEntries(CURRENCIES.filter((c) => c.country !== 'EU').map((c) => [c.country, c.code])),
  ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, 'EUR'])),
  ...Object.fromEntries(USD_COUNTRIES.map((c) => [c, 'USD'])),
  ...OTHER,
};

/** The local currency of a country, or null if we don't support it. */
export function currencyForCountry(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  return COUNTRY_CURRENCY[countryCode.toUpperCase()] ?? null;
}

/**
 * How many `to` one `from` buys, from a table of "1 US dollar = x" rates.
 * Returns null when either currency has no rate.
 */
export function crossRate(rates: Record<string, number>, from: string, to: string): number | null {
  if (from === to) return 1;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return null;
  return toRate / fromRate;
}

/** Rounds money to 2 decimals. */
export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}
