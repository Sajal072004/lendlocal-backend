import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createItemRequest, getCommunityItemRequests } from '../controllers/item-request.controller';

const router = Router();
router.use(protect);

router.post('/', createItemRequest);
router.get('/community/:communityId', getCommunityItemRequests);

export default router;