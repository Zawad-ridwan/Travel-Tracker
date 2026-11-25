import { Router } from 'express';
import { getRates } from '../lib/currency';

export const currencyRouter = Router();

/** GET /api/currency/rates — "1 US dollar = x" for every supported currency. Open to everyone. */
currencyRouter.get('/rates', async (_req, res) => {
  const rates = await getRates();
  // Browsers may reuse the answer for 15 minutes
  res.set('Cache-Control', 'private, max-age=900').json(rates);
});
