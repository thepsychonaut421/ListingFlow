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
};
