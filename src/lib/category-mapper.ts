
// This file contains logic for mapping product titles to Shopify categories.

import { shopifyTaxonomy } from './shopify-taxonomy';

type CategoryRule = { category: string; pattern: RegExp };

// A list of rules to map keywords/patterns in a product title to a Shopify category.
// This is more scalable than a single large object.
const rules: CategoryRule[] = [
  { category: 'Heim & Garten > Haushaltsgeräte > Staubsauger & Bodenpflege > Staubsauger', pattern: /staubsauger|vacuum cleaner/i },
  { category: 'Elektronik > Audio > Lautsprecher', pattern: /lautsprecher|speaker/i },
  { category: 'Heim & Garten > Küche & Esszimmer > Küchengeräte > Fritteusen', pattern: /air ?fryer|heißluft|heissluft/i },
  { category: 'Heim & Garten > Küche & Esszimmer > Koch- & Backgeschirr > Kochgeschirrsets', pattern: /kochgeschirr|topfset|pfannenset/i },
  { category: 'Bekleidung & Zubehör > Kleidung > Hemden & Tops', pattern: /hemd|shirt|bluse|top/i },
  { category: 'Bekleidung & Zubehör > Kleidung > Hosen', pattern: /hose|jeans|pants/i },
  { category: 'Bekleidung & Zubehör > Schuhe', pattern: /schuhe|sneaker|stiefel|sandalen/i },
];


/**
 * Validates a category string against the official Shopify taxonomy.
 * @param category The category string to validate.
 * @returns True if the category is valid, false otherwise.
 */
function isValidShopifyCategory(category: string): boolean {
  return shopifyTaxonomy.includes(category);
}


/**
 * Tries to guess a valid Shopify category from a product title using regex rules.
 * @param title The product title.
 * @returns A valid Shopify category string or an empty string if no match is found.
 */
function guessShopifyCategoryFromTitle(title: string): string {
  const normalizedTitle = title.toLowerCase();
  const foundRule = rules.find(rule => rule.pattern.test(normalizedTitle));
  return foundRule ? foundRule.category : '';
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
