// SECURITY: never log full API keys or Bearer tokens.
import { NextResponse } from 'next/server';

const RUNWARE_BASE = 'https://api.runware.ai/v1';

export const maxDuration = 120;

function cleanHeaders(request) {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('cookie');
  return headers;
}

export async function POST(request) {
  const headers = cleanHeaders(request);
  const auth = request.headers.get('authorization');
  if (auth) headers.set('Authorization', auth);

  try {
    const body = await request.arrayBuffer();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 115000);

    const response = await fetch(RUNWARE_BASE, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('Content-Type') || 'application/json';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: response.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    const message = error.name === 'AbortError' ? 'Runware proxy timeout' : error.message;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
