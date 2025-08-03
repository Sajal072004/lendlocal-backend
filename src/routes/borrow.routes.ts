import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getRequestById, getRequests, requestItem, respondToRequest, returnItem } from '../controllers/borrow.controller';

const router = Router();

// Protect all routes in this file
router.use(protect);

router.post('/request/:itemId', requestItem);
router.post('/respond/:requestId', respondToRequest);
router.get('/requests', getRequests);
router.get('/requests/:id', getRequestById);
router.post('/return/:requestId', returnItem);

export default router;