import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createReview, getMyReviews } from '../controllers/review.controller';

const router = Router();

router.use(protect);

router.get('/my-reviews', getMyReviews);
router.post('/:requestId', createReview);

export default router;