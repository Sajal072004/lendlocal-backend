import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadItemPhoto} from '../config/cloudinary';
import {
  createItem,
  getItemsByCommunity,
  updateItem,
  deleteItem,
} from '../controllers/item.controller';

const router = Router();

// We are removing 'router.use(protect);' from here

// And adding 'protect' to each route individually
router.post('/', protect, uploadItemPhoto.single('photo'), createItem);
router.get('/community/:communityId', protect, getItemsByCommunity);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

export default router;