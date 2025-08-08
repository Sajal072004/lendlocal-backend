import { Report, IReport } from '../models/Report.model';
import { User } from '../models/User.model';
import { Item } from '../models/Item.model';

interface ICreateReportData {
  reporterId: string;
  reason: string;
  reportedUserId?: string;
  reportedItemId?: string;
}

export class ReportService {
  public async createReport(data: ICreateReportData): Promise<IReport> {
    const { reporterId, reason, reportedUserId, reportedItemId } = data;

    if (!reportedUserId && !reportedItemId) {
      throw new Error('You must report either a user or an item.');
    }

    
    if (reportedUserId && reporterId === reportedUserId) {
      throw new Error("You cannot report yourself.");
    }

    const reportData: any = {
      reporter: reporterId,
      reason,
      reportType: reportedUserId ? 'user' : 'item',
    };

    if (reportedUserId) reportData.reportedUser = reportedUserId;
    if (reportedItemId) reportData.reportedItem = reportedItemId;
    
    const newReport = await Report.create(reportData);
    return newReport;
  }
}