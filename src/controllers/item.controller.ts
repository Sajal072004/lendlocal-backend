import { Request, Response } from 'express';
import { ItemService } from '../services/item.service';

const itemService = new ItemService();

export const createItem = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!._id;
    const itemData = { ...req.body, ownerId };

    // If a file was uploaded by multer, add its Cloudinary URL to the photos array
    if (req.file) {
      itemData.photos = [req.file.path];
    }

    const item = await itemService.create(itemData);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getItemsByCommunity = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const userId = req.user!._id;
    const items = await itemService.findByCommunity(communityId, userId);
    res.status(200).json(items);
  } catch (error) {
    res.status(403).json({ message: (error as Error).message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const updatedItem = await itemService.update(id, userId, req.body);
    res.status(200).json(updatedItem);
  } catch (error) {
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('authorized') ? 403 : 404;
    res.status(statusCode).json({ message: errorMessage });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    await itemService.delete(id, userId);
    res.status(204).send();
  } catch (error) {
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('authorized') ? 403 : 404;
    res.status(statusCode).json({ message: errorMessage });
  }
};