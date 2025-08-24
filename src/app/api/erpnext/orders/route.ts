// src/app/api/erpnext/orders/route.ts
'use server';

import { NextResponse } from 'next/server';
import { erpFetch } from '@/lib/erpnext-server';

// This endpoint is designed to be called from the client-side Orders page.
// It fetches a list of Sales Orders from ERPNext.

export async function GET() {
  try {
    const fields = [
      'name',
      'customer',
      'transaction_date',
      'status',
      'delivery_status',
      'grand_total',
      'currency',
    ];

    const params = new URLSearchParams({
      fields: JSON.stringify(fields),
      limit_page_length: '50', // Fetch the 50 most recent orders
      order_by: 'modified desc',
    });

    const response = await erpFetch<{ data: any[] }>(
      `/api/resource/Sales%20Order?${params.toString()}`
    );

    if (response && Array.isArray(response.data)) {
      return NextResponse.json(response.data);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('[API_ERR] /api/erpnext/orders:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred.' },
      { status: 500 }
    );
  }
}
