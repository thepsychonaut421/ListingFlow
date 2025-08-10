// src/app/api/genkit/[[...path]]/route.ts
import { genkit } from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { defineNextHandler } from '@genkit-ai/next';

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

const handler = defineNextHandler();

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
