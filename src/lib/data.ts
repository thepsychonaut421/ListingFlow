import type { Product } from './types';

export const initialProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Vintage Leather Wallet',
    code: 'VLW-01',
    quantity: 25,
    price: 49.99,
    description: 'A beautifully crafted vintage leather wallet, perfect for the modern gentleman. Features multiple card slots and a coin pocket.',
    image: 'https://placehold.co/400x400.png',
    supplier: 'Crafty Goods Inc.',
    location: 'Warehouse A, Shelf 3',
    tags: ['wallet', 'leather', 'vintage', 'accessory'],
    keywords: ['men wallet', 'bifold wallet', 'genuine leather'],
    category: 'Apparel & Accessories > Handbags, Wallets & Cases',
    ebayCategoryId: '2977', // Men > Men's Accessories > Wallets
    listingStatus: 'draft',
    brand: 'Unbranded',
    productType: 'Wallet',
    ean: '',
    technicalSpecs: {
      'Material': 'Genuine Leather',
      'Dimensions': '11cm x 9.5cm x 2cm',
    }
  },
  {
    id: 'prod-002',
    name: 'Wireless Bluetooth Headphones',
    code: 'WBH-02',
    quantity: 50,
    price: 89.99,
    description: 'Experience immersive sound with these noise-cancelling wireless headphones. Long-lasting battery and comfortable fit.',
    image: 'https://placehold.co/400x400.png',
    supplier: 'SoundWave Electronics',
    location: 'Warehouse B, Shelf 1',
    tags: ['headphones', 'bluetooth', 'wireless', 'audio'],
    keywords: ['noise cancelling', 'over-ear headphones', 'portable audio'],
    category: 'Electronics > Audio > Audio Components > Headsets & Earpieces',
    ebayCategoryId: '172514', // Consumer Electronics > Portable Audio & Headphones > Headphones
    listingStatus: 'listed',
    brand: 'SoundWave',
    productType: 'Headphones',
    ean: '',
    technicalSpecs: {
      'Connectivity': 'Bluetooth 5.0',
      'Battery Life': '20 hours',
      'Noise Cancelling': 'Active Noise Cancellation',
    }
  },
  {
    id: 'prod-003',
    name: 'Organic Green Tea Bags',
    code: 'OGT-03',
    quantity: 120,
    price: 12.50,
    description: '100 premium organic green tea bags, rich in antioxidants. Sourced from the finest tea gardens.',
    image: 'https://placehold.co/400x400.png',
    supplier: 'PureLeaf Organics',
    location: 'Pantry Section, Row 2',
    tags: ['tea', 'organic', 'green tea', 'beverage'],
    keywords: ['healthy drink', 'antioxidant tea', 'natural tea'],
    category: 'Food, Beverages & Tobacco > Beverages > Tea & Infusions',
    ebayCategoryId: '257921', // Home & Garden > Food & Beverages > Tea & Infusions
    listingStatus: 'new',
    brand: 'PureLeaf',
    productType: 'Tea',
    ean: '',
    technicalSpecs: {
      'Ingredients': 'Organic Green Tea Leaves',
      'Count': '100 bags',
    }
  },
  {
    id: 'prod-004',
    name: 'Ergonomic Office Chair',
    code: 'EOC-04',
    quantity: 15,
    price: 250.00,
    description: 'Refurbished ergonomic office chair with lumbar support and adjustable armrests. All parts checked and certified.',
    image: 'https://placehold.co/400x400.png',
    supplier: 'Office Comforts Ltd.',
    location: 'Warehouse A, Shelf 5',
    tags: ['office', 'chair', 'ergonomic', 'furniture'],
    keywords: ['desk chair', 'lumbar support', 'comfortable seating'],
    category: 'Furniture > Office Furniture > Office Chairs',
    ebayCategoryId: '74947', // Business & Industrial > Office > Office Furniture > Chairs
    listingStatus: 'refurbished',
    brand: 'Office Comforts',
    productType: 'Office Chair',
    ean: '',
    technicalSpecs: {}
  },
  {
    id: 'prod-005',
    name: 'Stainless Steel Water Bottle',
    code: 'SSWB-05',
    quantity: 75,
    price: 22.95,
    description: 'Durable and insulated 32oz stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12.',
    image: 'https://placehold.co/400x400.png',
    supplier: 'HydratePro',
    location: 'Warehouse C, Bin 8',
    tags: ['water bottle', 'stainless steel', 'reusable', 'outdoors'],
    keywords: ['insulated bottle', 'eco-friendly', 'hydration'],
    category: 'Home & Garden > Kitchen & Dining > Kitchen Storage & Organization > Water Bottles',
    ebayCategoryId: '184587', // Sporting Goods > Camping & Hiking > Water Bottles
    listingStatus: 'used',
    brand: 'HydratePro',
    productType: 'Water Bottle',
    ean: '',
    technicalSpecs: {}
  },
  {
    id: 'prod-006',
    name: 'Silvercrest SKM 600 B2 - Weiss (600 W)',
    code: 'SKM-600',
    quantity: 10,
    price: 79.99,
    description: 'Powerful kitchen machine for kneading, mixing and blending. Includes a large stainless steel bowl and various attachments.',
    image: 'https://cdn.idealo.com/folder/Product/201673/3/201673324/s1_produktbild_gross/silvercrest-skm-600-b2-600-w-weiss.jpg',
    supplier: 'Lidl',
    location: 'Warehouse D, Shelf 2',
    tags: ['kitchen', 'mixer', 'baking', 'appliance'],
    keywords: ['stand mixer', 'dough maker', 'kitchen appliance'],
    category: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders',
    ebayCategoryId: '183597', // Haushaltsgeräte > Kleingeräte Küche > Küchenmaschinen
    listingStatus: 'draft',
    brand: 'Silvercrest',
    productType: 'Küchenmaschine',
    ean: '4055334050142',
    technicalSpecs: {
      'Leistung': '600 W',
      'Geschwindigkeitsstufen': '8',
      'Schüsselkapazität': '5 L'
    }
  }
];
