import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';

const reviewService = new ReviewService();

export const createReview = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const reviewerId = req.user!._id.toString();
    const { rating, comment } = req.body;
    
    const reviewData = { requestId, reviewerId, rating, comment };
    const review = await reviewService.create(reviewData);
    
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};