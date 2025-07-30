import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';

const adminService = new AdminService();

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { token, admin } = await adminService.login(email, password);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/', // Set cookie path to root
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    res.status(200).json({ status: 'success', admin });
  } catch (error) {
    res.status(401).json({ message: (error as Error).message });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await adminService.getDashboardAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve analytics.' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
};

export const toggleUserDisabled = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { disable } = req.body;

    if (typeof disable !== 'boolean') {
      return res.status(400).json({ message: 'A boolean "disable" field is required.' });
    }

    const updatedUser = await adminService.setUserDisabledStatus(userId, disable);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

// ... inside admin.controller.ts

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const reports = await adminService.getAllReports();
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve reports.' });
  }
};

export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status field is required.' });
    }

    const updatedReport = await adminService.updateReportStatus(reportId, status);
    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};