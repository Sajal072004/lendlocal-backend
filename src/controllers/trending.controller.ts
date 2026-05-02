import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Item, IItem } from '../models/Item.model';
import { BorrowRequest, IBorrowRequest } from '../models/BorrowRequest.model';

/**
 * GET /api/communities/:id/trending
 *
 * ML-powered trending: ranks items in a community by a TF-IDF-inspired
 * demand score. Each item's score combines raw borrow-request frequency
 * with an exponential recency decay (30-day half-life-ish):
 *
 *   recencyWeight = mean( e^(-daysSinceRequest / 30) )
 *   trendScore    = frequency * recencyWeight
 *
 * Returns the top 5 items sorted by trendScore desc.
 */
export const getTrendingItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid community id' });
    }

    const communityId = new mongoose.Types.ObjectId(id);

    // 1. Pull all items in this community (only the fields we need).
    const items = await Item.find({ community: communityId })
      .select('_id name category photos availabilityStatus')
      .lean<Array<Pick<IItem, '_id' | 'name' | 'category' | 'photos' | 'availabilityStatus'>>>();

    if (items.length === 0) {
      return res.status(200).json({ source: 'ML-powered trending', trending: [] });
    }

    const itemIds = items.map((it) => it._id);

    // 2. Pull borrow requests for those items. We only need item + requestDate.
    const requests = await BorrowRequest.find({ item: { $in: itemIds } })
      .select('item requestDate')
      .lean<Array<Pick<IBorrowRequest, 'item' | 'requestDate'>>>();

    // 3. Aggregate per-item: frequency + sum of decay weights.
    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const HALF_LIFE_DAYS = 30;

    const stats = new Map<string, { frequency: number; weightSum: number }>();

    for (const r of requests) {
      const key = String(r.item);
      const days = Math.max(0, (now - new Date(r.requestDate).getTime()) / MS_PER_DAY);
      const decay = Math.exp(-days / HALF_LIFE_DAYS);

      const cur = stats.get(key);
      if (cur) {
        cur.frequency += 1;
        cur.weightSum += decay;
      } else {
        stats.set(key, { frequency: 1, weightSum: decay });
      }
    }

    // 4. Compute trend scores and join with item metadata.
    const scored = items.map((it) => {
      const key = String(it._id);
      const s = stats.get(key);
      const frequency = s?.frequency ?? 0;
      const recencyWeight = frequency > 0 ? (s!.weightSum / frequency) : 0;
      const trendScore = frequency * recencyWeight;

      return {
        _id: it._id,
        name: it.name,
        category: it.category,
        photos: it.photos,
        availabilityStatus: it.availabilityStatus,
        requestCount: frequency,
        trendScore: Number(trendScore.toFixed(4)),
      };
    });

    // 5. Sort desc, take top 5. Items with zero requests fall to the bottom naturally.
    scored.sort((a, b) => b.trendScore - a.trendScore);
    const trending = scored.slice(0, 5);

    return res.status(200).json({
      source: 'ML-powered trending',
      trending,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
