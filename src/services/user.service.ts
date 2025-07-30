import { BorrowRequest } from '../models/BorrowRequest.model';
import { Item } from '../models/Item.model';
import { User, IUser } from '../models/User.model';

// Interface for the data that can be updated
interface IUpdateProfileData {
  name?: string;
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
    // Select only the fields that should be public
    const user = await User.findById(userId).select(
      'name profilePicture reputationScore createdAt'
    );
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
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
    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }


  // ... inside the UserService class

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
}