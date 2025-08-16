
import { NextResponse } from "next/server";
import data from "@/data/ebay-categories.json";

type Cat = { id: string; name?: string; path: string, keywords?: string[] };

function calculateScore(cat: Cat, query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return 0;

    let score = 0;
    const path = (cat.path || "").toLowerCase();
    const name = (cat.name || "").toLowerCase();
    const keywords = (cat.keywords || []).map(k => k.toLowerCase());

    const queryWords = q.split(/\s+/).filter(w => w.length > 2);

    // High score for matching keywords
    for (const keyword of keywords) {
        if (q.includes(keyword)) {
            score += 10;
        }
    }
    
    // Score for words from query appearing in path
    for (const word of queryWords) {
        if (path.includes(word)) {
            score += 2;
        }
    }

    // Bonus for exact name match in path
    if (name && path.includes(name)) {
        score += 5;
    }
    
    return score;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ suggestions: [] });

  const cats: Cat[] = (data as any) ?? [];
  
  const ranked = cats
    .map(c => ({ ...c, _score: calculateScore(c, q) }))
    .filter(c => c._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)
    .map(({ _score, ...c }) => c);

  return NextResponse.json({ suggestions: ranked });
}
