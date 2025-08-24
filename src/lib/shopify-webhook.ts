// =============================
// 1) src/lib/shopify-webhook.ts
// Lightweight helpers for HMAC verification and typing. No external deps.
// =============================

'use server';

import crypto from 'crypto';

export function verifyShopifyHmac({
  rawBody,
  secret,
  hmacHeader,
}: {
  rawBody: string;
  secret: string;
  hmacHeader: string | null;
}) {
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export type ShopifyOrderWebhook = {
  id: number;
  name: string; // e.g. "#1024"
  email: string | null;
  phone?: string | null;
  financial_status?: string | null; // "paid" etc.
  fulfillment_status?: string | null; // "fulfilled" etc.
  currency: string; // e.g. "EUR"
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    email: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
  billing_address?: any | null;
  shipping_address?: any | null;
  line_items: Array<{
    id: number;
    sku: string | null;
    title: string;
    quantity: number;
    price: string; // as string per Shopify schema
    variant_id?: number | null;
    product_id?: number | null;
    taxable?: boolean;
  }>;
  shipping_lines?: Array<{ title?: string | null; price: string }>; // total shipping
  total_discounts?: string;
  tax_lines?: Array<{ price: string; rate: number; title: string }>; // aggregated at order level
};
