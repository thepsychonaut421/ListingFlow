// src/app/api/ebay/create-draft/route.ts
import { NextResponse } from 'next/server';
import type { Product } from '@/lib/types';
import { getAccessToken } from '@/lib/ebay/auth';
import { ensureMerchantLocation, getPolicies, getMarketplaceId } from '@/lib/ebay/account';
import { upsertInventoryItem, createOrUpdateOfferDraft } from '@/lib/ebay/inventory';

export async function POST(req: Request) {
  const product = (await req.json()) as Product;

  // Basic validation
  if (!product.code || !product.price || !product.ebayCategoryId || !product.image) {
      return NextResponse.json({ error: 'Missing required fields: SKU, price, categoryId, and image are required.' }, { status: 400 });
  }
   if (!product.image.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid image URL. Only HTTPS URLs are supported.' }, { status: 400 });
  }


  try {
    // 1. Get Access Token
    const accessToken = await getAccessToken();

    // 2. Ensure Location & Get Policies (can run in parallel)
    const [locationKey, policies] = await Promise.all([
        ensureMerchantLocation(accessToken),
        getPolicies(accessToken, getMarketplaceId())
    ]);

    // 3. Create or replace the inventory item for the SKU
    await upsertInventoryItem(accessToken, product);
    
    // 4. Create or update the offer draft for the inventory item
    const offer = await createOrUpdateOfferDraft(accessToken, product, policies, locationKey);

    return NextResponse.json({ 
        offerId: offer.offerId,
        status: offer.status || 'DRAFT',
        warnings: offer.warnings
    });

  } catch (error: any) {
    console.error('eBay draft creation failed:', error);
    // Return a more specific error message from the caught error
    return NextResponse.json({ error: error.message || 'Failed to create eBay draft' }, { status: 500 });
  }
}
