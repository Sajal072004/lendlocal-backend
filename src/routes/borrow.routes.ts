import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requestItem } from '../controllers/borrow.controller';

const router = Router();

// Protect all routes in this file
router.use(protect);

router.post('/request/:itemId', requestItem);

export default router;