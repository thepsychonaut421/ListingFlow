import type { Product } from './types';

export const initialProducts: Product[] = [
  {
    id: 'prod-006',
    name: 'Silvercrest SKM 600 B2 - Weiss (600 W)',
    code: 'SKM-600',
    quantity: 10,
    price: 79.99,
    description: 'Powerful kitchen machine for kneading, mixing and blending. Includes a large stainless steel bowl and various attachments.',
    images: [{
        url: 'https://cdn.idealo.com/folder/Product/201673/3/201673324/s1_produktbild_gross/silvercrest-skm-600-b2-600-w-weiss.jpg',
        isMain: true,
    }],
    supplier: 'Lidl',
    location: 'Warehouse D, Shelf 2',
    tags: ['kitchen', 'mixer', 'baking', 'appliance'],
    keywords: ['stand mixer', 'dough maker', 'kitchen appliance'],
    category: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders',
    ebayCategoryId: '183597', // Haushaltsgeräte > Kleingeräte Küche > Küchenmaschinen
    listingStatus: 'draft',
    ean: '4055334050142',
    technicalSpecs: {
      'Leistung': '600 W',
      'Geschwindigkeitsstufen': '8',
      'Schüsselkapazität': '5 L',
      'brand': 'Silvercrest',
      'productType': 'Küchenmaschine',
    }
  }
];
