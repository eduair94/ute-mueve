import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../src/app.js';
import { getContainer } from '../src/container.js';

export const config = { runtime: 'nodejs' };

const app = createApp(getContainer());

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function toWebHeaders(raw: IncomingMessage['headers']): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) for (const x of v) h.append(k, x);
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const host = req.headers.host ?? 'localhost';
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
    const url = `${proto}://${host}${req.url ?? '/'}`;
    const body = await readBody(req);
    const webReq = new Request(url, {
      method: req.method,
      headers: toWebHeaders(req.headers),
      body: body && body.length ? body : undefined,
    });
    const webRes = await app.fetch(webReq);
    res.statusCode = webRes.status;
    webRes.headers.forEach((v, k) => {
      try {
        res.setHeader(k, v);
      } catch {
        // some headers (e.g. set-cookie variants) may be problematic — skip
      }
    });
    const arrayBuffer = await webRes.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'INTERNAL', status: 500, message: (err as Error).message } }));
  }
}
