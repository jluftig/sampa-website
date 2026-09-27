import { monthKeys } from './membershipStats.js';

export function financeConfigFromEnv(env = {}) {
  const key = env.STRIPE_SECRET_KEY || '';
  return { key, configured: Boolean(key) };
}

function monthKeyFromUnix(unix) {
  const date = new Date(Number(unix) * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 7);
}

export function shapeFinanceStats(transactions, now = new Date()) {
  const keys = monthKeys(now);
  const byMonth = new Map(keys.map((month) => [month, {
    month,
    revenueCents: 0,
    refundCents: 0,
    feeCents: 0,
  }]));
  let revenueCents = 0;
  let refundCents = 0;
  let feeCents = 0;

  for (const row of Array.isArray(transactions) ? transactions : []) {
    if (row?.currency && row.currency !== 'usd') continue;
    const bucket = byMonth.get(monthKeyFromUnix(row.created));
    if (!bucket) continue;
    const amount = Number(row.amount) || 0;
    const fee = Math.max(0, Number(row.fee) || 0);
    if (row.type === 'charge' || row.type === 'payment') {
      revenueCents += amount;
      feeCents += fee;
      bucket.revenueCents += amount;
      bucket.feeCents += fee;
    } else if (row.type === 'refund' || row.type === 'payment_refund') {
      const refunded = Math.abs(amount);
      refundCents += refunded;
      feeCents += fee;
      bucket.refundCents += refunded;
      bucket.feeCents += fee;
    } else if (row.type === 'stripe_fee') {
      const stripeFee = Math.abs(amount);
      feeCents += stripeFee;
      bucket.feeCents += stripeFee;
    }
  }

  const series = keys.map((month) => {
    const bucket = byMonth.get(month);
    return {
      ...bucket,
      netCents: bucket.revenueCents - bucket.refundCents - bucket.feeCents,
    };
  });

  return {
    source: 'stripe',
    currency: 'usd',
    revenueCents,
    refundCents,
    feeCents,
    netCents: revenueCents - refundCents - feeCents,
    series,
    empty: revenueCents === 0 && refundCents === 0 && feeCents === 0,
  };
}
