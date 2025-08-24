'use server';

import { NextResponse } from 'next/server';
import { verifyShopifyHmac, ShopifyOrderWebhook } from '@/lib/shopify-webhook';
import { erpFindOne, erpCreate } from '@/lib/erpnext-server';
import { logEvent } from '@/lib/logging';

// Force Node.js runtime to ensure crypto compatibility and disable caching.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

/**
 * Fallback function to ensure an item exists in ERPNext before creating a Sales Order.
 * If the item does not exist, it's created automatically.
 */
async function ensureItemExists(code: string, name: string) {
  const existing = await erpFindOne('Item', [['item_code', '=', code]]);
  if (existing) {
    return existing;
  }
  
  await logEvent({
    level: 'info',
    message: `Item with SKU "${code}" not found. Creating it automatically.`,
    details: { item_code: code, item_name: name },
  });

  const doc = await erpCreate('Item', {
    item_code: code,
    item_name: name,
    item_group: 'All Item Groups', // Or a more specific default
    stock_uom: 'Nos',
    is_sales_item: 1,
  });
  return doc.name;
}


export async function POST(req: Request) {
  const webhookId = `wh_${Date.now()}`; // Unique ID for this webhook invocation

  if (!SHOPIFY_WEBHOOK_SECRET) {
    const errorMsg = 'SHOPIFY_WEBHOOK_SECRET is not configured.';
    console.error(errorMsg);
    await logEvent({
      level: 'error',
      message: errorMsg,
      details: { webhookId, error: 'Configuration Error' },
    });
    return NextResponse.json({ error: 'Webhook secret not configured on server' }, { status: 500 });
  }
  
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  const topic = req.headers.get('x-shopify-topic') || 'unknown-topic';
  const shopDomain = req.headers.get('x-shopify-shop-domain') || 'unknown-shop';
  const rawBody = await req.text(); // IMPORTANT: must read raw for HMAC

  try {
    await logEvent({
      level: 'info',
      message: `Webhook received: ${topic}`,
      details: { webhookId, shopDomain, topic },
    });

    if (!verifyShopifyHmac({ rawBody, secret: SHOPIFY_WEBHOOK_SECRET, hmacHeader })) {
       await logEvent({
        level: 'error',
        message: 'Invalid HMAC signature.',
        details: { webhookId, shopDomain, topic },
      });
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as ShopifyOrderWebhook;
    const shopifyOrderId = String(payload.id);

    // 1) Ensure Customer
    const customerEmail = payload.customer?.email || payload.email || null;
    const customerPhone = payload.customer?.phone || payload.phone || null;
    let customerName = 'Guest';
    if (payload.customer?.first_name || payload.customer?.last_name) {
      customerName = `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim() || 'Guest';
    } else if (payload.billing_address?.name) {
      customerName = payload.billing_address.name;
    }

    let customerDocName: string | null = null;
    if (customerEmail) {
      customerDocName = await erpFindOne('Customer', [['email_id', '=', customerEmail]]);
    }
    if (!customerDocName && customerPhone) {
      customerDocName = await erpFindOne('Customer', [['mobile_no', '=', customerPhone]]);
    }
    if (!customerDocName) {
      const c = await erpCreate('Customer', {
        customer_name: customerName,
        customer_type: 'Individual',
        email_id: customerEmail || undefined,
        mobile_no: customerPhone || undefined,
        shopify_customer_id: payload.customer?.id ? String(payload.customer.id) : undefined,
      });
      customerDocName = c.name;
    }

    // 2) Ensure Addresses
    async function ensureAddress(kind: 'Billing'|'Shipping', a: any | null | undefined) {
      if (!a) return undefined;
      const addrName = `${kind} - ${customerName} (${a.address1 || ''})`.slice(0, 139);
      const existing = await erpFindOne('Address', [['address_title', '=', addrName]]);
      if (existing) return existing;
      const doc = await erpCreate('Address', {
        address_title: addrName,
        address_type: kind,
        address_line1: a.address1 || '-',
        address_line2: a.address2 || undefined,
        city: a.city || undefined,
        pincode: a.zip || undefined,
        country: a.country || undefined,
        phone: a.phone || undefined,
        email_id: customerEmail || undefined,
        links: [{ link_doctype: 'Customer', link_name: customerDocName! }],
      });
      return doc.name;
    }

    const billingAddressName = await ensureAddress('Billing', payload.billing_address);
    const shippingAddressName = await ensureAddress('Shipping', payload.shipping_address);

    // 3) Idempotent Sales Order creation
    const existingSO = await erpFindOne('Sales Order', [['shopify_order_id', '=', shopifyOrderId]]);
    if (existingSO) {
      const message = `Webhook ignored: Sales Order for Shopify Order ID ${shopifyOrderId} already exists (${existingSO}).`;
      await logEvent({ level: 'info', message, details: { webhookId, shopifyOrderId, erpnextSOName: existingSO } });
      return NextResponse.json({ ok: true, message, sales_order: existingSO });
    }

    // 4) Build SO items with fallback for item creation
    const items = [];
    for (const li of payload.line_items) {
      const itemCode = li.sku || `SHOPIFY_${li.variant_id || li.product_id || li.id}`;
      await ensureItemExists(itemCode, li.title);
      items.push({
        item_code: itemCode,
        item_name: li.title,
        qty: li.quantity,
        rate: parseFloat(li.price || '0'),
      });
    }

    // 6) Create Sales Order
    const salesOrder = await erpCreate('Sales Order', {
      customer: customerDocName!,
      currency: payload.currency || 'EUR',
      transaction_date: payload.created_at?.slice(0, 10),
      po_no: payload.name,
      shopify_order_id: shopifyOrderId,
      customer_address: billingAddressName,
      shipping_address_name: shippingAddressName,
      items,
    });

    // 7) Handle Paid Status
    if ((payload.financial_status || '').toLowerCase() === 'paid') {
      const existingSI = await erpFindOne('Sales Invoice', [['shopify_order_id', '=', shopifyOrderId]]);
      if(!existingSI) {
        await erpCreate('Sales Invoice', {
          customer: customerDocName!,
          currency: payload.currency || 'EUR',
          against_sales_order: salesOrder.name,
          shopify_order_id: shopifyOrderId,
          items: items.map(it => ({ ...it, against_sales_order: salesOrder.name, so_detail: `${salesOrder.name}-${it.item_code}` })),
        });
      }
    }

    // 8) Handle Fulfilled Status
    if ((payload.fulfillment_status || '').toLowerCase() === 'fulfilled') {
      const existingDN = await erpFindOne('Delivery Note', [['shopify_order_id', '=', shopifyOrderId]]);
       if(!existingDN) {
        await erpCreate('Delivery Note', {
          customer: customerDocName!,
          against_sales_order: salesOrder.name,
          currency: payload.currency || 'EUR',
          shopify_order_id: shopifyOrderId,
          items: items.map(it => ({ ...it, against_sales_order: salesOrder.name, so_detail: `${salesOrder.name}-${it.item_code}` })),
        });
       }
    }
    
    await logEvent({
      level: 'success',
      message: `Successfully processed order ${payload.name} and created Sales Order ${salesOrder.name}.`,
      details: { webhookId, shopifyOrderId, erpnextSOName: salesOrder.name },
    });

    return NextResponse.json({ ok: true, sales_order: salesOrder.name, topic });
  } catch (err: any) {
    console.error('Shopify->ERPNext webhook error:', err.message, err.stack);
    await logEvent({
        level: 'error',
        message: 'Failed to process webhook.',
        details: { 
            webhookId,
            error: err.message,
            stack: err.stack,
            body: rawBody, // Log the received body for debugging
        },
    });
    return NextResponse.json({ error: err.message || 'Unhandled error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, path: '/api/shopify/webhooks/orders', timestamp: new Date().toISOString() });
}
