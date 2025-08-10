// src/app/api/genkit/[[...path]]/route.ts
import { genkit } from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { NextRequest } from 'next/server';
import { genkitNext } from '@genkit-ai/next';

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

const all = genkitNext({
  // The new recommended way to handle Genkit routes in Next.js
});

export { all as GET, all as POST, all as PUT, all as PATCH, all as DELETE, all as OPTIONS };
