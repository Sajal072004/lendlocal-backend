import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

export const searchAll = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const userId = req.user!._id;

    const results = await searchService.searchAll(query, userId.toString());
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred during the search.' });
  }
};