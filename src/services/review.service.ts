import { Review, IReview } from '../models/Review.model';
import { BorrowRequest } from '../models/BorrowRequest.model';
import { User } from '../models/User.model';

interface ICreateReviewData {
  requestId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
}

export class ReviewService {
  public async create(data: ICreateReviewData): Promise<IReview> {
    const { requestId, reviewerId, rating, comment } = data;

    const borrowRequest = await BorrowRequest.findById(requestId);

    // 1. Verify the request is completed.
    if (!borrowRequest || borrowRequest.status !== 'returned') {
      throw new Error('You can only review a completed transaction.');
    }
    
    // 2. Determine who is being reviewed.
    const isBorrowerReviewing = borrowRequest.borrower.toString() === reviewerId;
    const revieweeId = isBorrowerReviewing ? borrowRequest.lender : borrowRequest.borrower;
    
    // 3. Prevent duplicate reviews.
    const existingReview = await Review.findOne({ borrowRequest: requestId, reviewer: reviewerId });
    if (existingReview) {
      throw new Error('You have already reviewed this transaction.');
    }
    
    // 4. Create the review.
    const review = await Review.create({
      borrowRequest: requestId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating,
      comment,
    });
    
    // 5. Update the reviewee's reputation score.
    await this.updateReputationScore(revieweeId.toString());

    return review;
  }
  
  private async updateReputationScore(userId: string): Promise<void> {
    // Find all reviews where this user was the reviewee
    const reviews = await Review.find({ reviewee: userId });
    
    // Calculate the new average rating
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const newScore = totalRating / reviews.length;
    
    // Update the user's score in the User document
    await User.findByIdAndUpdate(userId, { reputationScore: newScore });
  }
}