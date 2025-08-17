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
  sourceImageUrl: z.string().optional().describe('An optional URL to an existing image to use as a base or reference for the generation.'),
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
  async ({ productName, sourceImageUrl }) => {
    
    let prompt: any = `Generate a high-quality, professional product photograph of the following item on a clean, white background: "${productName}". The image should be well-lit and look like it's for an e-commerce website.`;

    // If a source image URL is provided, use it as context for the AI.
    // The AI will generate a new image inspired by the source.
    if (sourceImageUrl) {
        try {
            // Check if the URL is already a data URI
            if (sourceImageUrl.startsWith('data:')) {
                 prompt = [
                    { media: { url: sourceImageUrl } },
                    { text: 'Generate a new, high-quality, professional product photograph of this item on a clean, white background, suitable for an e-commerce website.' },
                ];
            } else {
                // Fetch the image and convert it to a data URI if it's a regular URL
                const response = await fetch(sourceImageUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
                }
                const buffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                const base64 = Buffer.from(buffer).toString('base64');
                const dataUri = `data:${contentType};base64,${base64}`;

                prompt = [
                    { media: { url: dataUri } },
                    { text: 'Generate a new, high-quality, professional product photograph of this item on a clean, white background, suitable for an e-commerce website.' },
                ];
            }
        } catch (error) {
            console.error(`Failed to process source image URL (${sourceImageUrl}):`, error);
            // If fetching fails, fall back to the text-only prompt.
            // The original prompt is already set, so no action is needed here.
        }
    }


    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['IMAGE'], 
      },
    });

    const imageUrl = media?.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to return a valid image URL.');
    }

    return { imageUrl };
  }
);
