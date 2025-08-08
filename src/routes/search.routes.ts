import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { searchAll } from '../controllers/search.controller';

const router = Router();


router.get('/', protect, searchAll);

export default router;