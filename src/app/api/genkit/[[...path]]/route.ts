// Temporary stub: disable Genkit route in production to unblock build
const DISABLED = process.env.ENABLE_GENKIT_API !== 'true';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (DISABLED) {
    return new Response('Genkit API disabled', { status: 503 });
  }
  // lazy import to avoid bundling unless enabled
  const mod = await import('./real-handler');
  return mod.GET();
}

export async function POST(req: Request) {
  if (DISABLED) {
    return new Response('Genkit API disabled', { status: 503 });
  }
  const mod = await import('./real-handler');
  return mod.POST(req);
}
