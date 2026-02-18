import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com';
  try {
    const res = await fetch(base + '/api/catalog?module=marketing&limit=300', {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error('Backend ' + res.status);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json(
      { data: { agents: [], total: 0 }, error: String(e) },
      { status: 502 }
    );
  }
}
