'use server';

/**
 * @fileOverview A product description AI agent.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The current category of the product.'),
  listingStatus: z
    .string()
    .describe(
      'The listing status of the product (e.g., new, used, refurbished).'
    ),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
  tags: z.array(z.string()).describe('Suggested tags for SEO as an array of strings.'),
  keywords: z.array(z.string()).describe('Suggested keywords for SEO as an array of strings.'),
  category: z.string().describe('Suggested category name for the product.'),
  ebayCategoryId: z.string().describe('A valid numerical eBay category ID for the product. Refer to eBay\'s official category list. This must be a number as a string, not a category name.'),
});
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert e-commerce product description writer and eBay specialist. Based on the product name, category, and listing status, create an engaging product description, suggest tags and keywords for SEO, suggest a product category name, and provide a valid, specific, numerical eBay Category ID.

Product Name: {{{productName}}}
Current Category: {{{category}}}
Listing Status: {{{listingStatus}}}

It is crucial that you find a specific and valid numerical eBay Category ID for the given product. Do not use generic or broad category IDs. Refer to the official eBay category list to find the most appropriate ID. The ebayCategoryId field must be a string containing only numbers.

Return the tags and keywords as a JSON array of strings.
Description:`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
