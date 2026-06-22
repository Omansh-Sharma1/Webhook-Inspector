import { nanoid } from 'nanoid';
import { getDb, INSPECTOR_TTL_HOURS } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to create a new inspector.' });
  }

  try {
    const db = await getDb();
    const slug = nanoid(10); // short, URL-safe, collision odds are negligible at this scale

    const now = new Date();
    const expiresAt = new Date(now.getTime() + INSPECTOR_TTL_HOURS * 60 * 60 * 1000);

    await db.collection('inspectors').insertOne({
      slug,
      createdAt: now,
      expiresAt
    });

    return res.status(201).json({
      slug,
      inspectUrl: `/api/i/${slug}`,
      dashboardUrl: `/i/${slug}`,
      expiresAt
    });
  } catch (err) {
    console.error('Failed to create inspector:', err);
    return res.status(500).json({ error: 'Could not create inspector. Try again.' });
  }
}
