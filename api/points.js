import { Redis } from '@upstash/redis';

const MAX_POINTS = 25;
const REFILL_RATE_MS = 36 * 60 * 1000; // 36 menit

const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export default async function handler(req, res) {
  // Tangani preflight request (CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- SECURITY SHIELD ---
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const host = req.headers.host || '';

  const isSameHost = (origin && origin.includes(host)) || (referer && referer.includes(host));
  const isLocalhost = origin.includes('localhost:') || referer.includes('localhost:');
  const isVercelApp = origin.endsWith('.vercel.app') || referer.includes('.vercel.app');

  if (!isSameHost && !isLocalhost && !isVercelApp) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // -----------------------

  if (!redis) {
    return res.status(200).json({ status: 'unconfigured' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (ip === 'unknown') {
      return res.status(400).json({ error: 'IP could not be detected' });
    }

    const key = `ratelimit:${ip}`;
    const data = await redis.get(key);
    const now = Date.now();

    if (!data) {
      // User belum pernah request, point penuh
      return res.status(200).json({
        points: MAX_POINTS,
        maxPoints: MAX_POINTS,
        minutesUntilNextRefill: 0,
        isFull: true
      });
    }

    const timePassed = now - data.last_update;
    const pointsToAdd = Math.floor(timePassed / REFILL_RATE_MS);
    
    let currentPoints = data.points;
    let nextRefillTime = data.last_update + REFILL_RATE_MS;

    if (pointsToAdd > 0) {
      currentPoints = Math.min(MAX_POINTS, currentPoints + pointsToAdd);
      const virtualLastUpdate = data.last_update + (pointsToAdd * REFILL_RATE_MS);
      nextRefillTime = virtualLastUpdate + REFILL_RATE_MS;
    }

    const isFull = currentPoints >= MAX_POINTS;
    let minutesUntilNextRefill = 0;
    
    if (!isFull) {
      const timeToWaitMs = nextRefillTime - now;
      minutesUntilNextRefill = Math.max(1, Math.ceil(timeToWaitMs / (60 * 1000)));
    }

    return res.status(200).json({
      points: currentPoints,
      maxPoints: MAX_POINTS,
      minutesUntilNextRefill,
      nextRefillTime,
      isFull
    });

  } catch (err) {
    console.warn("[Points API Error]", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
