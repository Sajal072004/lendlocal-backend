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

  /**
   * Allows a lender to respond to a borrow request.
   * @param requestId - The ID of the borrow request.
   * @param lenderId - The ID of the user responding (must be the item owner).
   * @param response - The response, either 'approved' or 'denied'.
   * @returns The updated borrow request document.
   */
  public async respondToRequest(
    requestId: string,
    lenderId: string,
    response: 'approved' | 'denied'
  ): Promise<IBorrowRequest> {
    const borrowRequest = await BorrowRequest.findById(requestId);

    if (!borrowRequest) {
      throw new Error('Borrow request not found.');
    }

    // 1. Verify the user responding is the lender.
    if (borrowRequest.lender.toString() !== lenderId) {
      throw new Error('You are not authorized to respond to this request.');
    }

    // 2. Ensure the request is still pending.
    if (borrowRequest.status !== 'pending') {
      throw new Error('This request has already been responded to.');
    }

    // 3. Update the request status.
    borrowRequest.status = response;

    // 4. If approved, update the item's availability.
    if (response === 'approved') {
      await Item.findByIdAndUpdate(borrowRequest.item, {
        availabilityStatus: 'borrowed',
      });
    }

    await borrowRequest.save();
    return borrowRequest;
  }

  /**
   * Gets all incoming and outgoing borrow requests for a user.
   * @param userId - The ID of the user.
   * @returns An object with lists of incoming and outgoing requests.
   */
  public async getRequests(
    userId: string
  ): Promise<{ incoming: IBorrowRequest[]; outgoing: IBorrowRequest[] }> {
    
    // Find requests where the user is the lender (owner)
    const incoming = await BorrowRequest.find({ lender: userId })
      .populate('borrower', 'name profilePicture') // Get borrower's info
      .populate('item', 'name photos'); // Get item's info

    // Find requests where the user is the borrower
    const outgoing = await BorrowRequest.find({ borrower: userId })
      .populate('lender', 'name profilePicture') // Get lender's info
      .populate('item', 'name photos'); // Get item's info

    return { incoming, outgoing };
  }

  /**
   * Allows a borrower to mark an item as returned.
   * @param requestId - The ID of the borrow request.
   * @param borrowerId - The ID of the user returning the item.
   * @returns The updated borrow request document.
   */
  public async returnItem(
    requestId: string,
    borrowerId: string
  ): Promise<IBorrowRequest> {
    const borrowRequest = await BorrowRequest.findById(requestId);

    if (!borrowRequest) {
      throw new Error('Borrow request not found.');
    }

    // 1. Verify the user returning the item is the borrower.
    if (borrowRequest.borrower.toString() !== borrowerId) {
      throw new Error('You are not authorized to return this item.');
    }

    // 2. Ensure the request was approved and not already returned.
    if (borrowRequest.status !== 'approved') {
      throw new Error('This item cannot be returned as it was not in an approved borrowing state.');
    }

    // 3. Update the request status and set the return date.
    borrowRequest.status = 'returned';
    borrowRequest.returnDate = new Date();

    // 4. Make the item available again.
    await Item.findByIdAndUpdate(borrowRequest.item, {
      availabilityStatus: 'available',
    });

    await borrowRequest.save();
    return borrowRequest;
  }
}