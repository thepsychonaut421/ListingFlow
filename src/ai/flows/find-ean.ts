'use server';
/**
 * @fileOverview An AI agent for finding EAN/UPC codes for products using ean-search.org.
 *
 * - findEan - A function that finds an EAN for a product.
 * - FindEanInput - The input type for the findEan function.
 * - FindEanOutput - The return type for the findEan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const FindEanInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  brand: z.string().optional().describe('The brand of the product, if known.'),
});
export type FindEanInput = z.infer<typeof FindEanInputSchema>;

const FindEanOutputSchema = z.object({
  ean: z.string().describe('The EAN/UPC for the product based on a search on ean-search.org. If not found, return an empty string.'),
});
export type FindEanOutput = z.infer<typeof FindEanOutputSchema>;

export async function findEan(input: FindEanInput): Promise<FindEanOutput> {
  return findEanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findEanPrompt',
  input: {schema: FindEanInputSchema},
  output: {schema: FindEanOutputSchema},
  prompt: `You are an expert e-commerce data specialist. Your only task is to find the correct EAN (European Article Number) or UPC (Universal Product Code) for a given product by using the website ean-search.org.

You must act as if you are performing a search on ean-search.org.

1.  Take the Product Name and Brand and search on ean-search.org.
2.  Analyze the search results to find the most accurate EAN/UPC.
3.  Return only the most relevant EAN/UPC code as a string.
4.  If you cannot find an exact match or a highly relevant result, you must return an empty string.

Product Name: {{{productName}}}
{{#if brand}}
Brand: {{{brand}}}
{{/if}}
`,
});

const findEanFlow = ai.defineFlow(
  {
    name: 'findEanFlow',
    inputSchema: FindEanInputSchema,
    outputSchema: FindEanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
