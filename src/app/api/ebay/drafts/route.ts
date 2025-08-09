// This file is deprecated and will be replaced by the new create-draft route.
// Keeping it for now to avoid breaking changes if something still calls it.
// It should be removed once the transition is complete.

import { NextResponse } from 'next/server';
import type { Product } from '@/lib/types';

export async function POST(req: Request) {
  return NextResponse.json({ 
      error: 'This endpoint is deprecated. Please use /api/ebay/create-draft instead.' 
  }, { status: 410 });
}
