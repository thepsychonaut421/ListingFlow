'use server';
/**
 * @fileOverview An AI agent for finding product descriptions from external sites.
 *
 * - findProductDescription - A function that finds a product description.
 * - FindProductDescriptionInput - The input type for the findProductDescription function.
 * - FindProductDescriptionOutput - The return type for the findProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const FindProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  brand: z.string().optional().describe('The brand of the product, if known.'),
  ean: z.string().optional().describe('The EAN/UPC of the product.'),
  source: z.enum(['otto', 'ebay']).describe('The website to search for the description on.'),
});
export type FindProductDescriptionInput = z.infer<typeof FindProductDescriptionInputSchema>;

const FindProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The product description found on the specified source. If not found, return an empty string.'),
});
export type FindProductDescriptionOutput = z.infer<typeof FindProductDescriptionOutputSchema>;

export async function findProductDescription(input: FindProductDescriptionInput): Promise<FindProductDescriptionOutput> {
  return findProductDescriptionFlow(input);
}

const findProductDescriptionFlow = ai.defineFlow(
  {
    name: 'findProductDescriptionFlow',
    inputSchema: FindProductDescriptionInputSchema,
    outputSchema: FindProductDescriptionOutputSchema,
  },
  async ({ productName, brand, ean, source }) => {
    const { output } = await ai.generate({
      prompt: `You are an expert product researcher. Your task is to find the official product description for a given product on a specific website.

Product Name: ${productName}
Brand: ${brand || 'Unknown'}
EAN/UPC: ${ean || 'Unknown'}
Source Website: ${source}.de

Please search for the product on ${source}.de and return only its full, detailed product description. Do not add any extra text, just the description itself. If you cannot find the product or a suitable description, return an empty string.`,
      model: 'googleai/gemini-1.5-flash',
    });

    return { description: output?.text || '' };
  }
);
