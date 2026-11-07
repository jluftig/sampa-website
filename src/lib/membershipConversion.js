import { isCheckoutSessionId } from '../../api/_lib/membershipReceipt.js';

// The Ads account already has one Google tag. Fetching gtag/js?id=AW-18372431189
// returns the linked container GTM-K8FNBLFL, so a second GTM snippet would
// initialize that same tag twice. The container's first-party data tag is set
// to auto-collect email, phone, and address, so this module never loads it
// in the join page. The blank frame does, once, and only for a verified
// new membership.
export const EXISTING_GOOGLE_ADS_TAG_ID = 'AW-18372431189';
export const EXISTING_GTM_CONTAINER_ID = 'GTM-K8FNBLFL';
export const PRODUCTION_ADS_HOST = 'www.addictionpas.org';
export const ADS_PARENT_ORIGIN = 'https://www.addictionpas.org';
export const ADS_FRAME_PATH = '/membership-conversion.html';
export const ADS_MESSAGE_SOURCE = 'sampa-membership-conversion';

const LABEL_RE = /^[A-Za-z0-9_-]{1,40}$/;
const TAG_RE = /^AW-\d{6,20}$/;
const OUTCOMES = new Set(['new_membership', 'renewal', 'patron', 'donation', 'unpaid', 'unknown']);
const inflight = new Set();

export function adsConfigFromEnv(env = {}) {
  const override = env.VITE_GOOGLE_ADS_TAG_ID;
  const tagId = override == null || override === '' ? EXISTING_GOOGLE_ADS_TAG_ID : String(override);
  const labelRaw = env.VITE_GOOGLE_ADS_NEW_MEMBERSHIP_LABEL || '';
  const label = LABEL_RE.test(labelRaw) ? labelRaw : null;
  const tagOk = TAG_RE.test(tagId) && tagId === EXISTING_GOOGLE_ADS_TAG_ID;
  return {
    tagId: tagOk ? tagId : null,
    containerId: EXISTING_GTM_CONTAINER_ID,
    label,
    configured: Boolean(tagOk && label),
  };
}

export function normalizeReceipt(body) {
  const outcome = OUTCOMES.has(body?.outcome) ? body.outcome : 'unknown';
  const transactionId = isCheckoutSessionId(body?.transactionId) ? body.transactionId : null;
  const value = typeof body?.value === 'number' && Number.isFinite(body.value) && body.value >= 0
    ? body.value
    : null;
  const currency = body?.currency === 'USD' && value != null ? 'USD' : null;
  return { outcome, transactionId, value, currency };
}

export function planMembershipConversion({ receipt, config, hostname, sentIds }) {
  const clean = normalizeReceipt(receipt);
  if (!config?.configured || !config.label || config.tagId !== EXISTING_GOOGLE_ADS_TAG_ID) {
    return { send: false, reason: 'unconfigured' };
  }
  if (hostname !== PRODUCTION_ADS_HOST) {
    return { send: false, reason: 'off_host' };
  }
  if (clean.outcome !== 'new_membership' || !clean.transactionId || clean.currency !== 'USD' || clean.value == null) {
    return { send: false, reason: 'ineligible' };
  }
  if (sentIds?.has?.(clean.transactionId) || inflight.has(clean.transactionId)) {
    return { send: false, reason: 'duplicate' };
  }
  return {
    send: true,
    reason: 'ready',
    payload: {
      tagId: EXISTING_GOOGLE_ADS_TAG_ID,
      label: config.label,
      transactionId: clean.transactionId,
      value: clean.value,
      currency: 'USD',
      gclid: null,
      gbraid: null,
      wbraid: null,
    },
  };
}

const CLICK_RE = /^[\w-]{1,200}$/;

export function withClickIds(payload, click) {
  const next = { ...payload, gclid: null, gbraid: null, wbraid: null };
  for (const key of ['gclid', 'gbraid', 'wbraid']) {
    if (typeof click?.[key] === 'string' && CLICK_RE.test(click[key])) next[key] = click[key];
  }
  return next;
}

export function payloadHasContactData(payload) {
  return JSON.stringify(payload).includes('@');
}

export function mountConversionFrame({ document, payload, hostname }) {
  if (hostname !== PRODUCTION_ADS_HOST) return { mounted: false, reason: 'off_host' };
  if (!payload?.label || payload.tagId !== EXISTING_GOOGLE_ADS_TAG_ID || !payload.transactionId) {
    return { mounted: false, reason: 'unconfigured' };
  }
  if (payloadHasContactData(payload)) return { mounted: false, reason: 'pii' };
  if (!document?.createElement || !document.body) return { mounted: false, reason: 'no_document' };

  const iframe = document.createElement('iframe');
  // allow-scripts without allow-same-origin keeps the tag off the join page,
  // where the newsletter form and profile fields live.
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.setAttribute('title', 'Membership conversion');
  iframe.setAttribute('src', ADS_FRAME_PATH);
  iframe.setAttribute('style', 'position:absolute;width:0;height:0;border:0');
  iframe.addEventListener?.('load', () => {
    iframe.contentWindow?.postMessage(
      { source: ADS_MESSAGE_SOURCE, payload },
      '*',
    );
  });
  document.body.appendChild(iframe);
  return { mounted: true, iframe };
}

function browserSentIds() {
  try {
    const raw = sessionStorage.getItem('sampa_ads_sent');
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function rememberBrowserSentId(id) {
  try {
    const ids = browserSentIds();
    ids.add(id);
    sessionStorage.setItem('sampa_ads_sent', JSON.stringify([...ids]));
  } catch { /* a storage failure must not send the hit twice on the next tick */ }
}

export function reportVerifiedMembershipConversion({
  confirmation,
  receipt,
  config,
  hostname,
  click,
  storage,
  document,
  emit,
} = {}) {
  if (!confirmation?.sendConversion) return { send: false, reason: 'ineligible' };
  const sentIds = storage?.read?.() ?? browserSentIds();
  const plan = planMembershipConversion({ receipt, config, hostname, sentIds });
  if (!plan.send) return plan;
  const id = plan.payload.transactionId;
  if (inflight.has(id) || sentIds.has(id)) return { send: false, reason: 'duplicate' };
  inflight.add(id);
  const payload = withClickIds(plan.payload, click);
  if (payloadHasContactData(payload)) {
    inflight.delete(id);
    return { send: false, reason: 'pii' };
  }
  const mount = emit || mountConversionFrame;
  const result = mount({
    document: document ?? globalThis.document,
    payload,
    hostname,
  });
  if (!result?.mounted) {
    inflight.delete(id);
    return { send: false, reason: result?.reason || 'off_host' };
  }
  if (storage?.add) storage.add(id);
  else rememberBrowserSentId(id);
  return { send: true, payload };
}
