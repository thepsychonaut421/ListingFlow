// src/app/api/logs/route.ts
'use server';

import { NextResponse } from 'next/server';
import { readEvents } from '@/lib/logging';

// Force dynamic execution and disable caching
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await readEvents();
    // Return events sorted with the most recent first
    const sortedEvents = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json(sortedEvents, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    // If the file doesn't exist yet, return an empty array gracefully.
    if (error.code === 'ENOENT') {
      return NextResponse.json([]);
    }
    console.error('[API_LOGS_ERROR] Failed to read log events:', error);
    return NextResponse.json({ error: 'Failed to retrieve log events.' }, { status: 500 });
  }
}
