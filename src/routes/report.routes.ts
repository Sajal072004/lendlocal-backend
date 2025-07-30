import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { submitReport } from '../controllers/report.controller';

const router = Router();

// A user must be logged in to submit a report
router.use(protect);

router.post('/', submitReport);

export default router;