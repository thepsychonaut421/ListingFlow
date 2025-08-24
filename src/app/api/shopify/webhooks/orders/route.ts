
'use server';

import { NextResponse } from 'next/server';
import { verifyShopifyHmac, ShopifyOrderWebhook } from '@/lib/shopify-webhook';
import { erpFindOne, erpCreate, erpFetch } from '@/lib/erpnext-server';
import { logEvent } from '@/lib/logging';
import { add } from 'date-fns';

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
        customer_group: 'All Customer Groups', // Default value
        territory: 'All Territories', // Default value
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
    
    // 3) Build SO items with fallback for item creation
    const orderItems = [];
    for (const li of payload.line_items) {
      const itemCode = li.sku || `SHOPIFY_${li.variant_id || li.product_id || li.id}`;
      await ensureItemExists(itemCode, li.title);
      orderItems.push({
        item_code: itemCode,
        item_name: li.title,
        qty: li.quantity,
        rate: parseFloat(li.price || '0'),
      });
    }

    // 4) Idempotent Sales Order Management
    let salesOrderName = await erpFindOne('Sales Order', [['shopify_order_id', '=', shopifyOrderId]]);

    if (!salesOrderName) {
        const transactionDate = payload.created_at?.slice(0, 10) || new Date().toISOString().slice(0,10);
        const deliveryDate = add(new Date(transactionDate), { days: 3 }).toISOString().slice(0,10);
        
        const salesOrder = await erpCreate('Sales Order', {
            customer: customerDocName!,
            currency: payload.currency || 'EUR',
            transaction_date: transactionDate,
            delivery_date: deliveryDate,
            po_no: payload.name,
            shopify_order_id: shopifyOrderId,
            customer_address: billingAddressName,
            shipping_address_name: shippingAddressName,
            items: orderItems,
        });
        salesOrderName = salesOrder.name;
         await logEvent({
            level: 'success',
            message: `Created Sales Order ${salesOrderName} for Shopify Order ${payload.name}.`,
            details: { webhookId, shopifyOrderId, erpnextSOName: salesOrderName },
        });
    } else {
         await logEvent({
            level: 'info',
            message: `Sales Order ${salesOrderName} already exists for Shopify Order ${payload.name}. Skipping SO creation.`,
            details: { webhookId, shopifyOrderId, erpnextSOName: salesOrderName },
        });
    }
    
    const soDetails = await erpFetch<{ data: { items: any[] } }>(`/api/resource/Sales%20Order/${salesOrderName}`);
    const lineIdByItemCode = Object.fromEntries(
        soDetails.data.items.map((it: any) => [it.item_code, it.name])
    );
    const itemsForDocs = orderItems.map(it => ({
        ...it,
        against_sales_order: salesOrderName,
        so_detail: lineIdByItemCode[it.item_code],
    }));

    // 5) Handle Paid Status -> Create Sales Invoice
    if ((payload.financial_status || '').toLowerCase() === 'paid') {
      const existingSI = await erpFindOne('Sales Invoice', [['shopify_order_id', '=', shopifyOrderId]]);
      if(!existingSI) {
        const si = await erpCreate('Sales Invoice', {
          customer: customerDocName!,
          currency: payload.currency || 'EUR',
          against_sales_order: salesOrderName,
          shopify_order_id: shopifyOrderId,
          items: itemsForDocs,
        });
         await logEvent({
            level: 'success',
            message: `Created Sales Invoice ${si.name} for paid Shopify Order ${payload.name}.`,
            details: { webhookId, shopifyOrderId, erpnextSOName: salesOrderName, erpnextSIName: si.name },
        });
      }
    }

    // 6) Handle Fulfilled Status -> Create Delivery Note
    if ((payload.fulfillment_status || '').toLowerCase() === 'fulfilled') {
      const existingDN = await erpFindOne('Delivery Note', [['shopify_order_id', '=', shopifyOrderId]]);
       if(!existingDN) {
        const dn = await erpCreate('Delivery Note', {
          customer: customerDocName!,
          against_sales_order: salesOrderName,
          currency: payload.currency || 'EUR',
          shopify_order_id: shopifyOrderId,
          items: itemsForDocs,
        });
        await logEvent({
            level: 'success',
            message: `Created Delivery Note ${dn.name} for fulfilled Shopify Order ${payload.name}.`,
            details: { webhookId, shopifyOrderId, erpnextSOName: salesOrderName, erpnextDNName: dn.name },
        });
       }
    }
    
    return NextResponse.json({ ok: true, sales_order: salesOrderName, topic });
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
