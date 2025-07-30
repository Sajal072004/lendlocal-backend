import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

const reportService = new ReportService();

export const submitReport = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user!._id.toString();
    const { reason, reportedUserId, reportedItemId } = req.body;

    const report = await reportService.createReport({
      reporterId,
      reason,
      reportedUserId,
      reportedItemId,
    });

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};