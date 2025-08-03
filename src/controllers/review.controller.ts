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

export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const reviews = await reviewService.getReviewsForUser(userId.toString());
    res.status(200).json(reviews);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};