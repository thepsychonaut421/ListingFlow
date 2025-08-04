// src/app/api/genkit/[[...path]]/route.ts
import { genkit } from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { NextRequest, NextResponse } from 'next/server';
import { cors } from '@genkit-ai/next/cors';
import { createNextRequest, createStreamingNextResponse } from '@genkit-ai/next';

import '@/ai/flows/generate-product-description';
import '@/ai/flows/find-ean';
import '@/ai/flows/find-product-description';
import '@/ai/flows/suggest-tags-keywords-category';
import '@/ai/flows/find-ebay-category-id';


genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

async function all(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return cors(req, new NextResponse());
  }
  const genkitReq = createNextRequest(req);
  const genkitRes = await genkitReq.run();
  if (genkitRes.isStreaming()) {
    return createStreamingNextResponse(genkitRes);
  }
  return cors(req, new NextResponse(genkitRes.body, genkitRes.options));
}

export { all as GET, all as POST, all as PUT, all as PATCH, all as DELETE };
