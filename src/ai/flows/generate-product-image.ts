'use server';
/**
 * @fileOverview An AI agent for generating product images.
 *
 * - generateProductImage - A function that generates an image for a product.
 * - GenerateProductImageInput - The input type for the generateProductImage function.
 * - GenerateProductImageOutput - The return type for the generateProductImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateProductImageInputSchema = z.object({
  productName: z.string().describe('The name of the product to generate an image for.'),
});
export type GenerateProductImageInput = z.infer<typeof GenerateProductImageInputSchema>;

const GenerateProductImageOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateProductImageOutput = z.infer<typeof GenerateProductImageOutputSchema>;

export async function generateProductImage(input: GenerateProductImageInput): Promise<GenerateProductImageOutput> {
  return generateProductImageFlow(input);
}

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async ({ productName }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a high-quality, professional product photograph of the following item on a clean, white background: "${productName}". The image should be well-lit and look like it's for an e-commerce website.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], 
      },
    });

    const imageUrl = media?.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to return a valid image URL.');
    }

    return { imageUrl };
  }
);
