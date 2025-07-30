import { Admin, IAdmin } from '../models/Admin.model';
import { User } from '../models/User.model';
import { Item } from '../models/Item.model';
import { Community } from '../models/Community.model';
import { BorrowRequest } from '../models/BorrowRequest.model';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { Report, IReport } from '../models/Report.model';

export class AdminService {
  /**
   * Logs in an admin.
   */
  public async login(email: string, password: string): Promise<{ token: string; admin: IAdmin }> {
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken((admin._id as string | { toString(): string }).toString(), 'admin');
    
    const adminObject = admin.toObject() as any;
    delete adminObject.password;

    return { token, admin: adminObject };
  }
  
  /**
   * Gathers key statistics for the admin dashboard.
   */
  public async getDashboardAnalytics(): Promise<object> {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const totalCommunities = await Community.countDocuments();
    const activeLoans = await BorrowRequest.countDocuments({ status: 'approved' });

    return {
      totalUsers,
      totalItems,
      totalCommunities,
      activeLoans,
    };
  }

  /**
   * Retrieves a list of all users.
   */
  public async getAllUsers(): Promise<any[]> {
    return User.find().select('-password');
  }

  /**
   * Disables or re-enables a user's account.
   */
  public async setUserDisabledStatus(userId: string, shouldDisable: boolean): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    user.isDisabled = shouldDisable;
    await user.save();
    return user;
  }

  // ... inside the AdminService class

  /**
   * Retrieves all reports from the system.
   */
  public async getAllReports(): Promise<IReport[]> {
    return Report.find()
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reportedItem', 'name')
      .sort({ createdAt: -1 });
  }

  /**
   * Updates the status of a specific report.
   */
  public async updateReportStatus(reportId: string, status: string): Promise<IReport> {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error('Report not found.');
    }
    // You might want to add more validation for the status value here
    report.status = status as any;
    await report.save();
    return report;
  }
}