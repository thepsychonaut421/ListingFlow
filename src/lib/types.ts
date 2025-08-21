

export type ProductImage = {
  url: string; // Can be a remote URL or a base64 Data URI
  isMain: boolean;
};

export type Product = {
  id: string;
  name:string;
  code: string; // SKU
  quantity: number;
  price: number;
  description: string;
  images: ProductImage[];
  supplier: string;
  location: string;
  tags: string[];
  keywords: string[];
  category: string; // Shopify Category
  ebayCategoryId: string;
  listingStatus: 'draft' | 'listed' | 'error' | 'new' | 'used' | 'refurbished' | 'active' | 'archived';
  technicalSpecs: Record<string, string | string[]>;
  sourceModified?: string; // ISO string date from ERPNext 'modified'
  ean?: string;
};
