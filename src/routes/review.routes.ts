import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createReview } from '../controllers/review.controller';

const router = Router();

router.use(protect);

router.post('/:requestId', createReview);

export default router;