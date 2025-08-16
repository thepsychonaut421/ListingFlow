// scripts/sync-ebay-categories.de.ts
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

// This script requires 'cheerio' and 'undici' (or node-fetch).
// Run `npm install cheerio undici` if you don't have them.
// We use undici's fetch as it's closer to the web standard fetch.
const fetch = global.fetch || require('undici').fetch;

const URL = 'https://pages.ebay.de/categorychanges/DE_Category_Changes.html';

type Cat = {
  id: string;
  name: string;
  path: string[];
  keywords: string[];
};

(async () => {
  console.log(`Fetching category data from ${URL}...`);
  const res = await fetch(URL, { headers: { 'accept': 'text/html' }});
  if (!res.ok) throw new Error(`GET ${URL} -> ${res.status}`);
  
  const html = await res.text();
  const $ = cheerio.load(html);

  const cats: Cat[] = [];
  const path: string[] = [];

  function getKeywords(name: string, path: string[]): string[] {
    const uniqueWords = new Set<string>();
    // Add words from the current category name
    name.toLowerCase().split(/[\s,()]+/).forEach(w => w.length > 2 && uniqueWords.add(w));
    // Add words from the full path
    path.forEach(p => p.toLowerCase().split(/[\s,()]+/).forEach(w => w.length > 2 && uniqueWords.add(w)));
    return Array.from(uniqueWords);
  }

  function walk($ul: cheerio.Cheerio) {
    $ul.children('li').each((_, li) => {
      const $li = $(li);
      const label = $li.clone().children('ul').remove().end().text().trim();
      const m = label.match(/\bID:\s*(\d+)/);
      const id = m?.[1] ?? '';
      const name = label.replace(/\|\s*ID:\s*\d+.*/, '').trim();

      path.push(name);
      
      if (id) {
        cats.push({ 
            id, 
            name, 
            path: [...path],
            keywords: getKeywords(name, path),
        });
      }
      
      const $childUl = $li.children('ul');
      if ($childUl.length) {
        walk($childUl);
      }
      
      path.pop();
    });
  }
  
  // The root contains multiple <ul> sections for different meta-categories.
  // We process them all to get a complete list.
  $('div.entry-content > ul').each((_, ul) => {
    walk($(ul));
  });

  const finalData = {
    source: URL,
    fetchedAt: new Date().toISOString(),
    total: cats.length,
    categories: cats.map(c => ({
        id: c.id,
        name: c.name,
        path: c.path.join(' > '), // Store the path as a single string for easier display
        keywords: c.keywords
    }))
  };

  const file = join(process.cwd(), 'public', 'data', 'ebay-categories.de.json');
  await writeFile(file, JSON.stringify(finalData, null, 2), 'utf8');
  
  console.log(`✅ Success! Saved ${cats.length} categories to ${file}`);
})();
