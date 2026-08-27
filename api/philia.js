import { GoogleGenAI } from '@google/genai';
import { Redis } from '@upstash/redis';

// --- PENGATURAN RATE LIMITING (TOKEN BUCKET) ---
const MAX_POINTS = 25;
const REFILL_RATE_MS = 36 * 60 * 1000; // 36 menit

// Inisialisasi Redis hanya jika environment variables tersedia (pakai prefix KV_ dari integrasi Vercel)
const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;
// -----------------------------------------------

export default async function handler(req, res) {
  // Tangani preflight request (CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- SECURITY SHIELD: BLOKIR AKSES DARI LUAR ---
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const host = req.headers.host || '';

  // Pastikan request datang dari domain yang sama (host), localhost, atau vercel.app
  const isSameHost = (origin && origin.includes(host)) || (referer && referer.includes(host));
  const isLocalhost = origin.includes('localhost:') || referer.includes('localhost:');
  const isVercelApp = origin.endsWith('.vercel.app') || referer.includes('.vercel.app');

  if (!isSameHost && !isLocalhost && !isVercelApp) {
    console.warn(`[Security Block] Origin: ${origin}, Referer: ${referer}, Host: ${host}`);
    return res.status(403).json({
      error: 'Forbidden: Akses API ditolak. Endpoint ini hanya bisa diakses dari web resmi Echo Atur AI.'
    });
  }
  // -----------------------------------------------

  // Rate limiting disabled: Unlimited access
  // ------------------------------------

  const { model, contents, _c, config: plainConfig } = req.body;

  let config = plainConfig;
  if (_c) {
    try {
      config = JSON.parse(decodeURIComponent(Buffer.from(_c, 'base64').toString('utf8')));
    } catch (e) {
      console.error("Failed to decode config payload", e);
    }
  }

  const apiKey = process.env.PHILIA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Service is not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: process.env.PHILIA_MODEL || model || 'gemini-2.0-flash',
      contents: contents,
      config: config
    });

    const result = {
      text: response.text,
      candidates: response.candidates,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Philia Service Error:", error);

    let errorMessage = error.message;
    try {
      if (typeof errorMessage === 'string') {
        const jsonMatch = errorMessage.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    return res.status(500).json({ error: errorMessage || "Service Error" });
  }
}
