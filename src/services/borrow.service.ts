import { BorrowRequest, IBorrowRequest } from '../models/BorrowRequest.model';
import { Item } from '../models/Item.model';
import { IUser } from '../models/User.model';

export class BorrowService {
  /**
   * Creates a borrow request for an item.
   * @param itemId - The ID of the item to borrow.
   * @param borrowerId - The ID of the user requesting the item.
   * @returns The newly created borrow request document.
   */
  public async createRequest(
    itemId: string,
    borrowerId: string
  ): Promise<IBorrowRequest> {
    // 1. Find the item and ensure it's available.
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found.');
    }
    if (item.availabilityStatus !== 'available') {
      throw new Error('Item is not available to borrow.');
    }

    // 2. Prevent a user from borrowing their own item.
    if (item.owner.toString() === borrowerId) {
      throw new Error('You cannot borrow your own item.');
    }

    // 3. Check if an active request already exists for this item by this user.
    const existingRequest = await BorrowRequest.findOne({
      item: itemId,
      borrower: borrowerId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existingRequest) {
      throw new Error('You already have an active request for this item.');
    }

    // 4. Create the new borrow request.
    const borrowRequest = await BorrowRequest.create({
      item: itemId,
      borrower: borrowerId,
      lender: item.owner, // The item owner is the lender.
      status: 'pending',
    });

    // (Later, we can add a notification service to alert the owner here)

    return borrowRequest;
  }
}