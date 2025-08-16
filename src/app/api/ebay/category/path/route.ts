'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

type CategoryRecord = { id: string; path: string };

async function loadLocalData<T>(filename: string): Promise<T | null> {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', filename);
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.warn(`Could not load local data file "${filename}":`, error);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    const db = await loadLocalData<{ categories: CategoryRecord[] }>('ebay-categories.de.json');
    const category = db?.categories.find(c => c.id === id);

    if (category) {
      return NextResponse.json({ path: category.path });
    } else {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to resolve eBay category path:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
