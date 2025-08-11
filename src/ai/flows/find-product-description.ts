'use server';
/**
 * @fileOverview An AI agent for finding product descriptions and specs from external sites.
 *
 * - findProductDescription - A function that finds a product description and specs.
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
  description: z.string().describe('The product description found on the specified source. If not found, return an empty string. This should be in German.'),
  technicalSpecs: z.any().describe('A key-value object of technical specifications found on the page. For example, {"Leistung": "600 W", "Maße": "30x20x10 cm"}. If none are found, return an empty object. The keys and values should be in German.'),
});
export type FindProductDescriptionOutput = z.infer<typeof FindProductDescriptionOutputSchema>;

export async function findProductDescription(input: FindProductDescriptionInput): Promise<FindProductDescriptionOutput> {
  return findProductDescriptionFlow(input);
}


const prompt = ai.definePrompt({
    name: 'findProductDescriptionPrompt',
    input: { schema: FindProductDescriptionInputSchema },
    output: { schema: FindProductDescriptionOutputSchema },
    prompt: `You are an expert product researcher. Your task is to find the official product description and technical specifications for a given product on a specific website. All output must be in German.

Product Name: {{{productName}}}
Brand: {{{brand}}}
EAN/UPC: {{{ean}}}
Source Website: {{{source}}}.de

Please search for the product on {{{source}}}.de and return:
1. Its full, detailed product description in German.
2. A JSON object containing its technical specifications in German (e.g., "Leistung", "Maße", "Gewicht").

Return the data as a single JSON object. If you cannot find the product or the information, return an object with empty values.`,
});


const findProductDescriptionFlow = ai.defineFlow(
  {
    name: 'findProductDescriptionFlow',
    inputSchema: FindProductDescriptionInputSchema,
    outputSchema: FindProductDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || { description: '', technicalSpecs: {} };
  }
);
