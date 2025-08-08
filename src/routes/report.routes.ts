import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { submitReport } from '../controllers/report.controller';

const router = Router();


router.use(protect);

router.post('/', submitReport);

export default router;