import { config } from 'dotenv';
config();

import '@/ai/flows/generate-product-description.ts';
import '@/ai/flows/suggest-tags-keywords-category.ts';
import '@/ai/flows/find-ebay-category-id.ts';
import '@/ai/flows/find-ean.ts';
import '@/ai/flows/find-product-description.ts';
