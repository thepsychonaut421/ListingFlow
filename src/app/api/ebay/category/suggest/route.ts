
import { NextResponse } from 'next/server';

// JSON local; înlocuiește cu Firestore dacă vrei
import categories from '@/data/ebay-categories.json';
import eanMap from '@/data/ean-to-category.json';

type Cat = { id: string; path: string; keywords: string[] };

function normalize(s?: string) {
  return (s ?? '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '');
}

export async function POST(req: Request) {
  const { productName, ean } = await req.json();

  // 1) Regula EAN directă (dacă avem mapare explicită)
  if (ean && (ean as string) in eanMap) {
    const cat = (categories as Cat[]).find(c => c.id === (eanMap as Record<string, string>)[ean]);
    if (cat) return NextResponse.json({ categoryId: cat.id, categoryPath: cat.path });
  }

  // 2) Scor pe cuvinte-cheie (din baza internă)
  const q = normalize(productName);
  if (!q) return NextResponse.json({ error: 'missing_query' }, { status: 400 });

  // Scor simplu: apariții și lungimea expresiei
  let best: { cat: Cat; score: number } | null = null;
  for (const cat of categories as Cat[]) {
    let score = 0;
    for (const kw of cat.keywords) {
      const k = normalize(kw);
      if (!k) continue;
      if (q.includes(k)) {
        // bonus pentru match mai lung și pentru match la început de cuvânt
        const exact = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        score += exact.test(q) ? 5 + Math.min(k.length, 10) : 2 + Math.min(k.length, 5);
      }
    }
    if (!best || score > best.score) best = { cat, score };
  }

  if (best && best.score > 0) {
    return NextResponse.json({ categoryId: best.cat.id, categoryPath: best.cat.path });
  }
  return NextResponse.json({ error: 'no_match' }, { status: 404 });
}
