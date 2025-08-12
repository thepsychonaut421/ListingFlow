// This file contains logic for mapping product titles to Shopify categories.

import { shopifyTaxonomy } from './shopify-taxonomy';

// Create a Set for faster lookups
const validShopifyCategories = new Set(shopifyTaxonomy);

/**
 * Tries to guess a valid Shopify category from a product title using regex.
 * @param title The product title.
 * @returns A valid Shopify category string or an empty string if no match is found.
 */
function guessShopifyCategoryFromTitle(title: string): string {
  const t = title.toLowerCase();

  // Define regex mappings
  const mappings: { [key: string]: string } = {
    'Heim & Garten > Haushaltsgeräte > Staubsauger & Bodenpflege > Staubsauger': /staubsauger|vacuum cleaner/i,
    'Elektronik > Audio > Lautsprecher': /lautsprecher|speaker/i,
    'Heim & Garten > Küche & Esszimmer > Küchengeräte > Fritteusen': /air ?fryer|heißluft|heissluft/i,
    'Heim & Garten > Küche & Esszimmer > Koch- & Backgeschirr > Kochgeschirrsets': /kochgeschirr|topfset|pfannenset/i,
    'Bekleidung & Zubehör > Kleidung > Hemden & Tops': /hemd|shirt|bluse|top/i,
    'Bekleidung & Zubehör > Kleidung > Hosen': /hose|jeans|pants/i,
    'Bekleidung & Zubehör > Schuhe': /schuhe|sneaker|stiefel|sandalen/i,
  };

  for (const category in mappings) {
    if (mappings[category].test(t)) {
      return category;
    }
  }

  return '';
}

/**
 * Validates a category string against the official Shopify taxonomy.
 * @param category The category string to validate.
 * @returns True if the category is valid, false otherwise.
 */
function isValidShopifyCategory(category: string): boolean {
  return validShopifyCategories.has(category);
}

/**
 * Provides the best possible Shopify category suggestion.
 * It trusts the AI's suggestion if it's valid, otherwise it tries to guess from the title.
 * @param aiSuggestion The category suggested by the AI.
 * @param productTitle The title of the product.
 * @returns A valid Shopify category string or an empty string.
 */
export function getShopifyCategorySuggestion(aiSuggestion: string, productTitle: string): string {
  // 1. Trust the AI if its suggestion is in the official list.
  if (aiSuggestion && isValidShopifyCategory(aiSuggestion)) {
    return aiSuggestion;
  }

  // 2. If AI fails, try to guess based on the product title.
  const guessedCategory = guessShopifyCategoryFromTitle(productTitle);
  if (guessedCategory) {
    return guessedCategory;
  }

  // 3. As a last resort, return an empty string. Shopify accepts this.
  return '';
}
