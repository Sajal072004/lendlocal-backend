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

    
    if (!borrowRequest || borrowRequest.status !== 'returned') {
      throw new Error('You can only review a completed transaction.');
    }
    
    
    const isBorrowerReviewing = borrowRequest.borrower.toString() === reviewerId;
    const revieweeId = isBorrowerReviewing ? borrowRequest.lender : borrowRequest.borrower;
    
    
    const existingReview = await Review.findOne({ borrowRequest: requestId, reviewer: reviewerId });
    if (existingReview) {
      throw new Error('You have already reviewed this transaction.');
    }
    
    
    const review = await Review.create({
      borrowRequest: requestId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating,
      comment,
    });
    
    
    await this.updateReputationScore(revieweeId.toString());

    return review;
  }
  
  private async updateReputationScore(userId: string): Promise<void> {
    
    const reviews = await Review.find({ reviewee: userId });
    
    
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const newScore = totalRating / reviews.length;
    
    
    await User.findByIdAndUpdate(userId, { reputationScore: newScore });
  }

   
  /**
   * Gets all reviews for a specific user (where the user is the reviewee).
   * @param userId The ID of the user whose reviews are to be fetched.
   */
  public async getReviewsForUser(userId: string): Promise<IReview[]> {
    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name profilePicture') 
      .populate('item', 'name photos') 
      .sort({ createdAt: -1 }); 

    return reviews;
  }
}