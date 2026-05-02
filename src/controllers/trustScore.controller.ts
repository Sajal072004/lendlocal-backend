import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { BorrowRequest } from '../models/BorrowRequest.model';

type TrustLevel = 'Newcomer' | 'Trusted' | 'Reliable' | 'Top Lender';

interface TrustSignals {
  reputation: number;
  kyc: number;
  accountAge: number;
  itemsLent: number;
  borrowActivity: number;
  returnRate: number;
}

interface TrustScoreResponse {
  label: 'AI Trust Score';
  score: number;
  level: TrustLevel;
  signals: TrustSignals;
}

const computeLevel = (score: number): TrustLevel => {
  if (score <= 40) return 'Newcomer';
  if (score <= 60) return 'Trusted';
  if (score <= 80) return 'Reliable';
  return 'Top Lender';
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Statuses considered "approved or later" — i.e. requests that actually
// progressed beyond pending/denied/cancelled. These form the denominator
// for return-rate computation.
const APPROVED_OR_LATER_STATUSES = [
  'approved',
  'returned',
  'awaiting_confirmation',
  'return_confirmed',
];

const RETURNED_STATUSES = ['returned', 'return_confirmed'];

export const getTrustScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    const user = await User.findById(id).select(
      'reputationScore kycCompleted createdAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userObjectId = new mongoose.Types.ObjectId(id);

    // Run independent counts in parallel — single round-trip latency.
    const [
      lentCount,
      borrowCount,
      approvedOrLaterAsBorrower,
      returnedAsBorrower,
    ] = await Promise.all([
      BorrowRequest.countDocuments({ lender: userObjectId }),
      BorrowRequest.countDocuments({ borrower: userObjectId }),
      BorrowRequest.countDocuments({
        borrower: userObjectId,
        status: { $in: APPROVED_OR_LATER_STATUSES },
      }),
      BorrowRequest.countDocuments({
        borrower: userObjectId,
        status: { $in: RETURNED_STATUSES },
      }),
    ]);

    // --- Signal computation ---
    const reputationScore =
      typeof user.reputationScore === 'number' ? user.reputationScore : 0;
    const reputation = (reputationScore / 5) * 30;

    const kyc = user.kycCompleted ? 20 : 0;

    const createdAt = (user as unknown as { createdAt?: Date }).createdAt;
    const ageDays = createdAt
      ? Math.max(0, (Date.now() - new Date(createdAt).getTime()) / MS_PER_DAY)
      : 0;
    const accountAge = Math.min(ageDays / 365, 1) * 15;

    const itemsLent = Math.min(lentCount / 10, 1) * 15;

    const borrowActivity = Math.min(borrowCount / 5, 1) * 10;

    const returnRateRatio =
      approvedOrLaterAsBorrower > 0
        ? returnedAsBorrower / approvedOrLaterAsBorrower
        : 0;
    const returnRate = returnRateRatio * 10;

    const signals: TrustSignals = {
      reputation: Math.round(reputation),
      kyc: Math.round(kyc),
      accountAge: Math.round(accountAge),
      itemsLent: Math.round(itemsLent),
      borrowActivity: Math.round(borrowActivity),
      returnRate: Math.round(returnRate),
    };

    // Total uses raw (un-rounded) signals to avoid double-rounding drift.
    const rawTotal =
      reputation + kyc + accountAge + itemsLent + borrowActivity + returnRate;
    const score = Math.min(100, Math.round(rawTotal));

    const response: TrustScoreResponse = {
      label: 'AI Trust Score',
      score,
      level: computeLevel(score),
      signals,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to compute trust score.',
      error: (error as Error).message,
    });
  }
};
