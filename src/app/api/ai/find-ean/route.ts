import { findEan } from '@/ai/flows/find-ean';

export async function POST(req: Request) {
  const input = await req.json();
  const result = await findEan(input);
  return Response.json(result);
}
