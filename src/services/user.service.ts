import { BorrowRequest } from '../models/BorrowRequest.model';
import { Follow } from '../models/Follow.model';
import { Item } from '../models/Item.model';
import { User, IUser, INotificationPreferences } from '../models/User.model';


interface IUpdateProfileData {
  name?: string;
  username?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  profilePicture?: string;
}

export class UserService {
  

  /**
   * Gets a user's public profile information.
   * @param userId The ID of the user whose profile to fetch.
   */
  public async getProfileById(userId: string): Promise<any> {
    const user = await User.findById(userId).select(
      'name username profilePicture reputationScore createdAt address'
    );
    if (!user) {
      throw new Error('User not found.');
    }

    
    const [followerCount, transactionCount] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      BorrowRequest.countDocuments({
        $or: [{ borrower: userId }, { lender: userId }],
        status: 'returned' 
      })
    ]);

    
    return {
      ...user.toObject(),
      followerCount,
      transactionCount
    };
  }
  /**
   * Updates a user's own profile information.
   * @param userId The ID of the user to update.
   * @param updateData The data to update.
   */
  public async updateProfile(
    userId: string,
    updateData: IUpdateProfileData
  ): Promise<IUser> {
    if (updateData.username) {
      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(updateData.username)) {
        throw new Error('Username must be 3-20 characters: lowercase letters, numbers, underscores only.');
      }
      const existing = await User.findOne({ username: updateData.username, _id: { $ne: userId } });
      if (existing) {
        throw new Error('Username is already taken.');
      }
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }


  

  /**
   * Gets a history of items the user has borrowed.
   * @param userId The ID of the user.
   */
  public async getBorrowingHistory(userId: string): Promise<any> {
    return BorrowRequest.find({ borrower: userId })
      .populate('item', 'name photos availabilityStatus')
      .populate('lender', 'name profilePicture')
      .sort({ createdAt: -1 });
  }

  /**
   * Gets a history of items the user has listed for lending.
   * Includes the current status of each borrow request on those items.
   * @param userId The ID of the user.
   */
  public async getLendingHistory(userId: string): Promise<any> {
    return Item.find({ owner: userId })
      .populate({
          path: 'community',
          select: 'name'
      })
      .sort({ createdAt: -1 });
  }

  public async findAllUsers(currentUserId: string): Promise<any> {
    
    return User.find({ _id: { $ne: currentUserId } }).select('name profilePicture');
  }

  public async updateNotificationPreferences(userId: string, preferences: INotificationPreferences): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }

    
    user.notificationPreferences = {
        ...user.notificationPreferences,
        ...preferences,
    };

    await user.save();
    return user;
}

public async updateEmailNotificationPreferences(userId: string, preferences: INotificationPreferences): Promise<IUser> {
  const user = await User.findByIdAndUpdate(
      userId,
      { $set: { emailNotificationPreferences: preferences } },
      { new: true }
  );
  if (!user) {
      throw new Error('User not found.');
  }
  return user;
}
}