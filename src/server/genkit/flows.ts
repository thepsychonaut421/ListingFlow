'use server';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { findEbayCategoryId } from '@/ai/flows/find-ebay-category-id';
import { findEan } from '@/ai/flows/find-ean';
import { findTechnicalSpecs } from '@/ai/flows/find-technical-specs';


export async function runGenerateDescription(input: string) {
  return await generateProductDescription({ input });
}

export async function runFindCategory(input: string) {
  return await findEbayCategoryId({ productDescription: input });
}

export async function runFindEan(productName: string, brand?: string) {
  return await findEan({ productName, brand });
}

export async function runFindTechSpecs(productName: string, description?: string) {
    return await findTechnicalSpecs({ productName, description });
}
