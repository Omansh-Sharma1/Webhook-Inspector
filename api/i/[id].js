import { getDb } from '../../lib/db.js';

// Turn off Vercel's automatic body parsing. Webhooks arrive as JSON, form
// data, plain text, or even binary — we want the raw bytes ourselves so we
// don't silently drop or mangle anything the sender included.
export const config = {
  api: {
    bodyParser: false
  }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const db = await getDb();

    const inspector = await db.collection('inspectors').findOne({ slug: id });
    if (!inspector) {
      return res.status(404).json({ error: 'This inspector does not exist or has expired.' });
    }

    const rawBody = await readRawBody(req);
    console.log('Raw body length received:', rawBody.length, '| content:', rawBody);
    const contentType = req.headers['content-type'] || '';
    const parsedBody = contentType.includes('application/json') ? tryParseJson(rawBody) : null;

    // Strip the dynamic route param out of the query object before storing
    const { id: _omit, ...query } = req.query;

    const captured = {
      inspectorId: id,
      method: req.method,
      headers: req.headers,
      query,
      rawBody,
      parsedBody,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
      receivedAt: new Date()
    };

    await db.collection('requests').insertOne(captured);

    // Most webhook senders (GitHub, Stripe, etc.) just need a 2xx to mark
    // delivery successful — keep the response minimal and fast.
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Failed to capture request:', err);
    return res.status(500).json({ error: 'Failed to capture this request.' });
  }
}
