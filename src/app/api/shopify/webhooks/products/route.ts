// src/app/api/shopify/webhooks/products/route.ts
'use server';

import { NextResponse } from 'next/server';
import { verifyShopifyHmac } from '@/lib/shopify-webhook';
import { erpFindOne, erpCreate, erpUpdate } from '@/lib/erpnext-server';
import { logEvent } from '@/lib/logging';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

type ShopifyProductWebhook = {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: 'active' | 'draft' | 'archived';
  tags: string;
  variants: Array<{
    id: number;
    sku: string | null;
    price: string;
    barcode: string | null; // EAN/UPC
    inventory_quantity: number;
  }>;
};

export async function POST(req: Request) {
  const webhookId = `wh_prod_${Date.now()}`;
  
  if (!SHOPIFY_WEBHOOK_SECRET) {
    const errorMsg = 'SHOPIFY_WEBHOOK_SECRET is not configured for product webhooks.';
    console.error(errorMsg);
    await logEvent({ level: 'error', message: errorMsg, details: { webhookId, error: 'Configuration Error' } });
    return NextResponse.json({ error: 'Webhook secret not configured on server' }, { status: 500 });
  }

  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  const topic = req.headers.get('x-shopify-topic') || 'unknown-topic';
  const shopDomain = req.headers.get('x-shopify-shop-domain') || 'unknown-shop';
  const rawBody = await req.text();

  try {
    await logEvent({
      level: 'info',
      message: `Product webhook received: ${topic}`,
      details: { webhookId, shopDomain, topic },
    });

    if (!verifyShopifyHmac({ rawBody, secret: SHOPIFY_WEBHOOK_SECRET, hmacHeader })) {
      await logEvent({ level: 'error', message: 'Invalid HMAC for product webhook.', details: { webhookId } });
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as ShopifyProductWebhook;
    const variant = payload.variants?.[0]; // Assuming single variant for simplicity
    
    if (!variant || !variant.sku) {
        await logEvent({ level: 'info', message: 'Product webhook skipped.', details: { webhookId, reason: 'Product or variant has no SKU.' } });
        return NextResponse.json({ ok: true, message: 'SKU is required.' });
    }

    const erpItem = {
        item_code: variant.sku,
        item_name: payload.title,
        description: payload.body_html,
        standard_rate: parseFloat(variant.price || '0'),
        stock_uom: 'Nos',
        item_group: 'Products', // Default item group
        brand: payload.vendor,
        barcode: variant.barcode,
    };

    const existingItem = await erpFindOne('Item', [['item_code', '=', variant.sku]]);

    if (existingItem) {
      await erpUpdate('Item', existingItem, erpItem);
       await logEvent({
        level: 'success',
        message: `Product updated in ERPNext: ${erpItem.item_name}`,
        details: { webhookId, shopifyId: payload.id, erpNextItemName: existingItem },
      });
    } else {
      const newItem = await erpCreate('Item', erpItem);
      await logEvent({
        level: 'success',
        message: `Product created in ERPNext: ${erpItem.item_name}`,
        details: { webhookId, shopifyId: payload.id, erpNextItemName: newItem.name },
      });
    }

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error('[Product Webhook Error]', err.message, err.stack);
    await logEvent({
        level: 'error',
        message: 'Failed to process product webhook.',
        details: { webhookId, error: err.message, stack: err.stack, body: rawBody },
    });
    return NextResponse.json({ error: err.message || 'Unhandled error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, path: '/api/shopify/webhooks/products', timestamp: new Date().toISOString() });
}
