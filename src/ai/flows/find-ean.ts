'use server';
/**
 * @fileOverview An AI agent for finding EAN/UPC codes for products.
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
  ean: z.string().describe('The EAN/UPC for the product. If not found, return an empty string.'),
});
export type FindEanOutput = z.infer<typeof FindEanOutputSchema>;

export async function findEan(input: FindEanInput): Promise<FindEanOutput> {
  return findEanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findEanPrompt',
  input: {schema: FindEanInputSchema},
  output: {schema: FindEanOutputSchema},
  prompt: `You are an expert in e-commerce product data. Your task is to find the EAN (European Article Number) or UPC (Universal Product Code) for the given product.

If you find a valid EAN or UPC, return it. If you cannot find one, you must return an empty string.

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
