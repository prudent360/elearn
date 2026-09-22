const encode = values => {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== null && value !== '') body.set(key, String(value));
  return body;
};

async function stripeRequest(config, path, values) {
  if (!config?.secretKey) throw Error('Stripe is not configured.');
  const response = await (config.fetch || fetch)(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encode(values)
  });
  const result = await response.json();
  if (!response.ok) throw Error(result?.error?.message || 'Stripe could not complete the request.');
  return result;
}

export async function retrievePrice(config, priceId) {
  if (!config?.secretKey || !priceId) throw Error('Stripe pricing is not configured.');
  const response = await (config.fetch || fetch)(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
    headers: { Authorization: `Bearer ${config.secretKey}` }
  });
  const result = await response.json();
  if (!response.ok) throw Error(result?.error?.message || 'Stripe pricing is unavailable.');
  return result;
}

export function createCheckout(config, { user, customerId, plan, origin }) {
  const price = config?.prices?.[plan];
  if (!price) throw Error('That billing plan is not configured.');
  return stripeRequest(config, 'checkout/sessions', {
    mode: 'subscription',
    'line_items[0][price]': price,
    'line_items[0][quantity]': 1,
    customer: customerId,
    customer_email: customerId ? undefined : user.email,
    client_reference_id: user.id,
    'metadata[user_id]': user.id,
    'metadata[plan_key]': plan,
    'subscription_data[metadata][user_id]': user.id,
    'subscription_data[metadata][plan_key]': plan,
    allow_promotion_codes: 'true',
    success_url: `${origin}/settings?billing=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`
  });
}

export function createPortal(config, { customerId, origin }) {
  return stripeRequest(config, 'billing_portal/sessions', {
    customer: customerId,
    return_url: `${origin}/settings?tab=billing`,
    configuration: config?.portalConfigurationId
  });
}

function parseSignature(value) {
  const parts = {};
  for (const item of (value || '').split(',')) {
    const [key, entry] = item.split('=', 2);
    if (key && entry) (parts[key] ||= []).push(entry);
  }
  return parts;
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifyStripeEvent(rawBody, signature, secret, toleranceSeconds = 300) {
  if (!secret) throw Error('Stripe webhook signing secret is not configured.');
  const parsed = parseSignature(signature);
  const timestamp = Number(parsed.t?.[0]);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) throw Error('Webhook timestamp is outside the allowed window.');
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', bytes.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, bytes.encode(`${timestamp}.${rawBody}`));
  const expected = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  if (!(parsed.v1 || []).some(value => safeEqual(value, expected))) throw Error('Webhook signature is invalid.');
  return JSON.parse(rawBody);
}

export const billingConfigured = config => Boolean(config?.enabled && config?.secretKey && config?.webhookSecret && config?.prices?.['pro-monthly'] && config?.prices?.['pro-yearly']);
