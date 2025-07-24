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

const findEanFlow = ai.defineFlow(
  {
    name: 'findEanFlow',
    inputSchema: FindEanInputSchema,
    outputSchema: FindEanOutputSchema,
  },
  async ({ productName, brand }) => {
    const token = process.env.EAN_SEARCH_API_TOKEN;
    if (!token || token === 'your_token_here') {
      console.log('EAN Search API token is not configured. Skipping API search.');
      // Return empty EAN if token is not available, instead of throwing an error.
      return { ean: '' };
    }
    
    const searchKeywords = brand ? `${brand} ${productName}` : productName;
    const url = `https://api.ean-search.org/api?op=product-search&token=${token}&keywords=${encodeURIComponent(searchKeywords)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();

      // The API returns an object where keys are region names and values are arrays of products.
      // We'll just take the first EAN from the first product in the first region.
      const firstRegion = Object.keys(data)[0];
      if (data[firstRegion] && data[firstRegion].length > 0) {
        const firstProduct = data[firstRegion][0];
        if (firstProduct && firstProduct.ean) {
          return { ean: firstProduct.ean };
        }
      }

      return { ean: '' }; // Return empty if no product or EAN is found
    } catch (error) {
      console.error("Failed to fetch EAN from API:", error);
      // In case of error, gracefully return an empty EAN.
      return { ean: '' };
    }
  }
);
