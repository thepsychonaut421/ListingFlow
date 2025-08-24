
import { NextResponse } from 'next/server';

type ShopifyStoreConfig = {
  name: string;
  url: string;
  token: string;
};

/**
 * An API route to securely retrieve the list of configured Shopify stores.
 * It only returns the names of the stores, not their sensitive credentials.
 */
export async function GET() {
  try {
    const storesJson = process.env.SHOPIFY_STORES;

    if (!storesJson) {
      console.warn('SHOPIFY_STORES environment variable is not set.');
      return NextResponse.json({ stores: [] });
    }

    const stores: ShopifyStoreConfig[] = JSON.parse(storesJson);

    if (!Array.isArray(stores)) {
      throw new Error('SHOPIFY_STORES is not a valid JSON array.');
    }

    // Return only the names of the stores for the client-side UI.
    const storeNames = stores.map(store => store.name).filter(Boolean);

    return NextResponse.json({ stores: storeNames });

  } catch (error: any) {
    console.error('Failed to parse SHOPIFY_STORES environment variable:', error);
    return NextResponse.json({ error: 'Server configuration error for Shopify stores.', details: error.message }, { status: 500 });
  }
}
