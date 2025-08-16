export type Product = {
  id: string;
  name: string;
  code: string; // SKU
  quantity: number;
  price: number;
  description: string;
  image: string;
  supplier: string;
  location: string;
  tags: string[];
  keywords: string[];
  category: string; // Shopify Category
  ebayCategoryId: string;
  listingStatus: 'draft' | 'listed' | 'error' | 'new' | 'used' | 'refurbished';
  technicalSpecs: Record<string, string | string[]>;
  sourceModified?: string; // ISO string date from ERPNext 'modified'
  
  // The following fields are now managed under technicalSpecs
  // but kept here for potential future direct use or legacy data.
  brand?: string;
  productType?: string;
  model?: string;
  mpn?: string; // Manufacturer Part Number
  ean?: string;
  color?: string;
  material?: string;
  size?: string;
  dimensions?: string; // e.g., "10x20x30 cm"
  weight?: string; // e.g., "1.5 kg"
};
