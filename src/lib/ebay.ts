import type { Product } from './types';

const EBAY_API_BASE = process.env.EBAY_API_BASE || 'https://api.ebay.com';

export async function createEbayDraft(product: Product) {
  const token = process.env.EBAY_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Missing EBAY_ACCESS_TOKEN environment variable');
  }

  const body = {
    title: product.name,
    description: product.description,
    availability: {
      shipToLocationAvailability: {
        quantity: product.quantity,
      },
    },
    price: {
      value: product.price,
      currency: 'EUR',
    },
    categoryId: product.ebayCategoryId,
    sku: product.code,
    condition: product.listingStatus,
  };

  const res = await fetch(`${EBAY_API_BASE}/sell/listing/v1/item_draft`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay API error: ${res.status} ${text}`);
  }

  return res.json();
}
