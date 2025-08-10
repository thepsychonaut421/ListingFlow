import { findEbayCategoryId } from '@/ai/flows/find-ebay-category-id';

export async function POST(req: Request) {
  const input = await req.json();
  const result = await findEbayCategoryId(input);
  return Response.json(result);
}
