// src/app/api/genkit/[[...path]]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Stub minimal: răspunde ok fără să folosească GenKit
export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: true });
}
