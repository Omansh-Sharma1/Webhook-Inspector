import { getDb } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET to fetch captured requests.' });
  }

  const { id, since } = req.query;

  try {
    const db = await getDb();

    const inspector = await db.collection('inspectors').findOne({ slug: id });
    if (!inspector) {
      return res.status(404).json({ error: 'This inspector does not exist or has expired.' });
    }

    const filter = { inspectorId: id };

    // `since` lets the frontend poll for only NEW requests instead of
    // re-downloading the whole history every 2-3 seconds.
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        filter.receivedAt = { $gt: sinceDate };
      }
    }

    const requests = await db
      .collection('requests')
      .find(filter)
      .sort({ receivedAt: -1 })
      .limit(200)
      .toArray();

    return res.status(200).json({
      inspector: {
        slug: inspector.slug,
        createdAt: inspector.createdAt,
        expiresAt: inspector.expiresAt
      },
      requests
    });
  } catch (err) {
    console.error('Failed to fetch requests:', err);
    return res.status(500).json({ error: 'Failed to fetch requests.' });
  }
}
