'use server';

import {
  generateProductDescription,
  GenerateProductDescriptionInput,
} from '@/ai/flows/generate-product-description';
import {
  findEbayCategoryId,
  FindEbayCategoryIdInput,
} from '@/ai/flows/find-ebay-category-id';
import { findEan } from '@/ai/flows/find-ean';
import { findTechnicalSpecs } from '@/ai/flows/find-technical-specs';

export async function runGenerateDescription(
  input: GenerateProductDescriptionInput
) {
  return await generateProductDescription(input);
}

export async function runFindCategory(input: FindEbayCategoryIdInput) {
  return await findEbayCategoryId(input);
}

export async function runFindEan(productName: string, brand?: string) {
  return await findEan({ productName, brand });
}

export async function runFindTechSpecs(
  productName: string,
  description?: string
) {
  return await findTechnicalSpecs({ productName, description });
}
