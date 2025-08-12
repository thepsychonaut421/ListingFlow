'use server';

/**
 * @fileOverview A product description AI agent.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { findEan } from './find-ean';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The current category of the product.'),
  listingStatus: z
    .string()
    .describe(
      'The listing status of the product (e.g., new, used, refurbished).'
    ),
  brand: z.string().optional().describe('The brand of the product, if known.'),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description in German.'),
  tags: z.array(z.string()).describe('Suggested tags for SEO as an array of strings, in German.'),
  keywords: z.array(z.string()).describe('Suggested keywords for SEO as an array of strings, in German.'),
  category: z.string().describe('Suggested category for the product. This must follow the Shopify Product Taxonomy format (e.g., "Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders").'),
  ebayCategoryId: z.string().describe('A valid numerical eBay category ID for the product. Refer to eBay\'s official category list. This must be a number as a string, not a category name. It must be a "leaf" category, meaning it cannot have any sub-categories.'),
  brand: z.string().describe('The brand name of the product (e.g., "Sony", "Apple", "Unbranded").'),
  productType: z.string().describe('The specific, custom type of the product (e.g., "Smartphone", "Laptop", "T-Shirt"). This should be in German.'),
  ean: z.string().describe('The EAN/UPC for the product. If not found, return an empty string.'),
});
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const generateDetailsPrompt = ai.definePrompt({
  name: 'generateProductDetailsPrompt',
  input: {schema: z.object({
      productName: z.string().describe('The name of the product.'),
      category: z.string().describe('The current category of the product.'),
      listingStatus: z
        .string()
        .describe(
          'The listing status of the product (e.g., new, used, refurbished).'
        ),
       brand: z.string().optional().describe('The brand of the product, if known.'),
    })
  },
  output: {schema: z.object({
    description: z.string().describe('The generated product description in German.'),
    tags: z.array(z.string()).describe('Suggested tags for SEO as an array of strings, in German.'),
    keywords: z.array(z.string()).describe('Suggested keywords for SEO as an array of strings, in German.'),
    category: z.string().describe('Suggested category for the product. This MUST follow the official Shopify Product Taxonomy format (e.g., "Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders").'),
    ebayCategoryId: z.string().describe('A valid numerical eBay category ID for the product. Refer to eBay\'s official category list. This must be a number as a string, not a category name. It must be a "leaf" category, meaning it cannot have any sub-categories.'),
    brand: z.string().describe('The brand name of the product ("Marke"). If unknown, use "Markenlos".'),
    productType: z.string().describe('The specific, custom type of the product ("Produktart"). This should be a simple category in German (e.g., Küchenmaschine, Wallet).'),
  })},
  prompt: `You are an expert e-commerce product description writer and eBay/Shopify specialist. Your output must be entirely in German. Based on the product name, brand, category, and listing status, create an engaging product description.
  
STRICT RULES:
1. Product Category (for Shopify): MUST be the exact path from Shopify's official product taxonomy, using " > " as a separator.
   - Example: "Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders"
   - DO NOT invent categories. If unsure, choose the closest parent from the taxonomy.
2. eBay Category ID: Must be a valid, specific, numerical "leaf" category ID from eBay's official list.
3. Language: All text fields (description, tags, keywords, productType) MUST be in German.
4. Brand (Marke): Identify the brand from the input. If unknown, use "Markenlos".
5. Product Type (Produktart): Provide a simple, common German product type (e.g., "Küchenmaschine", "Geldbörse").

Inputs:
Product Name: {{{productName}}}
Brand: {{{brand}}}
Current Category: {{{category}}}
Listing Status: {{{listingStatus}}}

Return all fields as a single JSON object. Ensure all string values in the output are in German where applicable.
`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    // Generate product details and find EAN in parallel
    const [detailsResponse, eanResponse] = await Promise.all([
      generateDetailsPrompt(input),
      findEan({ productName: input.productName, brand: input.brand })
    ]);
    
    const details = detailsResponse.output;
    const ean = eanResponse.ean;

    if (!details) {
      throw new Error('Failed to generate product details.');
    }

    return {
      ...details,
      ean: ean || '',
    };
  }
);
