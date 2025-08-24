'use server';

import { NextResponse } from 'next/server';
import { verifyShopifyHmac, ShopifyOrderWebhook } from '@/lib/shopify-webhook';
import { erpFindOne, erpCreate } from '@/lib/erpnext-server';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  if (!SHOPIFY_WEBHOOK_SECRET) {
      console.error('SHOPIFY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured on server' }, { status: 500 });
  }

  try {
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');

    const rawBody = await req.text(); // IMPORTANT: must read raw for HMAC

    if (!verifyShopifyHmac({ rawBody, secret: SHOPIFY_WEBHOOK_SECRET, hmacHeader })) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as ShopifyOrderWebhook;

    // Minimal idempotency: we store/order by the unique shopify order id (numeric) on Sales Order as custom field.
    const shopifyOrderId = String(payload.id);

    // 1) Ensure Customer (by email if present, else by phone, else fallback to "Guest")
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
        // Custom field to retain mapping
        shopify_customer_id: payload.customer?.id ? String(payload.customer.id) : undefined,
      });
      customerDocName = c.name;
    }

    // 2) Ensure (optional) Address docs (kept minimal; can be expanded later)
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

    // 3) Idempotent Sales Order creation (skip if already mirrored)
    const existingSO = await erpFindOne('Sales Order', { shopify_order_id: shopifyOrderId });
    if (existingSO) {
      console.log(`Webhook ignored: Sales Order for Shopify Order ID ${shopifyOrderId} already exists (${existingSO}).`);
      return NextResponse.json({ ok: true, message: 'Sales Order already exists', sales_order: existingSO });
    }

    // 4) Build SO items from line_items
    const items = payload.line_items.map(li => ({
      item_code: li.sku || `SHOPIFY_${li.variant_id || li.product_id || li.id}`, // Fallback SKU
      item_name: li.title,
      qty: li.quantity,
      rate: parseFloat(li.price || '0'),
    }));

    // 5) Shipping as a charge (optional)
    const totalShipping = (payload.shipping_lines || []).reduce((s, x) => s + parseFloat(x.price || '0'), 0);

    // NOTE: Taxes can be handled via Tax Template or passed at item level; keep minimal here.

    // 6) Create Sales Order in ERPNext
    const salesOrder = await erpCreate('Sales Order', {
      customer: customerDocName!,
      currency: payload.currency || 'EUR',
      transaction_date: payload.created_at?.slice(0, 10),
      po_no: payload.name, // human-friendly order name #XXXX
      shopify_order_id: shopifyOrderId, // custom field — create it in ERPNext (Data)
      // Optional ship-to/bill-to
      customer_address: billingAddressName,
      shipping_address_name: shippingAddressName,
      items,
      // Shipping charge minimal example (requires a suitable Sales Taxes and Charges Template or inline charge rows)
      // taxes_and_charges: 'DE VAT 19% - SALES',
      // other_charges_calculation: totalShipping > 0 ? `Total Shipping Costs: ${totalShipping}` : undefined,
    });

    // 7) If paid, create Sales Invoice + Payment Entry
    if ((payload.financial_status || '').toLowerCase() === 'paid') {
      const existingSI = await erpFindOne('Sales Invoice', { shopify_order_id: shopifyOrderId });
      if(!existingSI) {
        await erpCreate('Sales Invoice', {
          customer: customerDocName!,
          currency: payload.currency || 'EUR',
          against_sales_order: salesOrder.name,
          shopify_order_id: shopifyOrderId,
          items: items.map(it => ({ item_code: it.item_code, qty: it.qty, rate: it.rate, against_sales_order: salesOrder.name, so_detail: `${salesOrder.name}-${it.item_code}` })),
          // update_stock: 0, // can be enabled if you want stock impact at invoice stage
        });
      }
    }

    // 8) If fulfilled, create Delivery Note (draft)
    if ((payload.fulfillment_status || '').toLowerCase() === 'fulfilled') {
      const existingDN = await erpFindOne('Delivery Note', { shopify_order_id: shopifyOrderId });
       if(!existingDN) {
        await erpCreate('Delivery Note', {
          customer: customerDocName!,
          against_sales_order: salesOrder.name,
          currency: payload.currency || 'EUR',
          shopify_order_id: shopifyOrderId,
          items: items.map(it => ({ item_code: it.item_code, qty: it.qty, against_sales_order: salesOrder.name, so_detail: `${salesOrder.name}-${it.item_code}` })),
          // Posting date/time can be set; leaving defaults
        });
       }
    }

    return NextResponse.json({ ok: true, sales_order: salesOrder.name, topic });
  } catch (err: any) {
    console.error('Shopify->ERPNext webhook error:', err.message, err.stack);
    return NextResponse.json({ error: err.message || 'Unhandled error' }, { status: 500 });
  }
}

export async function GET() {
  // Simple healthcheck to help configure the webhook in Shopify
  return NextResponse.json({ ok: true, path: '/api/shopify/webhooks/orders', timestamp: new Date().toISOString() });
}
