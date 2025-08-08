import { NextResponse } from 'next/server';
import type { Product } from '@/lib/types';
import { createEbayDraft } from '@/lib/ebay';

export async function POST(req: Request) {
  const product = (await req.json()) as Product;
  try {
    const result = await createEbayDraft(product);
    return NextResponse.json(result);
  } catch (error) {
    console.error('eBay draft creation failed', error);
    return NextResponse.json({ error: 'Failed to create eBay draft' }, { status: 500 });
  }
}
