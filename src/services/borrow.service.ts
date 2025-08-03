import { BorrowRequest, IBorrowRequest } from '../models/BorrowRequest.model';
import { Item } from '../models/Item.model';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

export class BorrowService {
  /**
   * Creates a borrow request for an item.
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
      lender: item.owner,
      status: 'pending',
    });

    // --- NOTIFICATION ---
    await notificationService.createNotification({
      recipient: item.owner.toString(),
      sender: borrowerId,
      type: 'new_borrow_request',
      message: `You have a new request to borrow "${item.name}".`,
      link: `/requests/${borrowRequest._id}`,
    });
    // --------------------

    return borrowRequest;
  }

  /**
   * Allows a lender to respond to a borrow request.
   */
  public async respondToRequest(
    requestId: string,
    lenderId: string,
    response: 'approved' | 'denied'
  ): Promise<IBorrowRequest> {
    const borrowRequest = await BorrowRequest.findById(requestId).populate('item', 'name');

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
    
    if (response === 'approved') {
      await Item.findByIdAndUpdate(borrowRequest.item, {
        availabilityStatus: 'borrowed',
      });
    }

    await borrowRequest.save();

    // --- NOTIFICATION ---
    const notificationType = response === 'approved' ? 'request_approved' : 'request_denied';
    const message = `Your request to borrow "${(borrowRequest.item as any).name}" has been ${response}.`;
    
    await notificationService.createNotification({
      recipient: borrowRequest.borrower.toString(),
      sender: lenderId,
      type: notificationType,
      message: message,
      link: `/requests/${borrowRequest._id}`,
    });
    // --------------------

    return borrowRequest;
  }

  /**
   * Gets all incoming and outgoing borrow requests for a user.
   */
  public async getRequests(
    userId: string
  ): Promise<{ incoming: IBorrowRequest[]; outgoing: IBorrowRequest[] }> {
    const incoming = await BorrowRequest.find({ lender: userId })
      .populate('borrower', 'name profilePicture')
      .populate('item', 'name photos');

    const outgoing = await BorrowRequest.find({ borrower: userId })
      .populate('lender', 'name profilePicture')
      .populate('item', 'name photos');

    return { incoming, outgoing };
  }

  /**
     * Finds a single borrow request by its ID.
     * Ensures the user viewing is either the borrower or the lender.
     * @param requestId The ID of the borrow request.
     * @param userId The ID of the user making the request.
     */
  public async findBorrowRequestById(requestId: string, userId: string): Promise<IBorrowRequest> {
    const request = await BorrowRequest.findById(requestId)
        .populate('item', 'name photos owner')
        .populate('borrower', 'name profilePicture')
        .populate('lender', 'name profilePicture');

    if (!request) {
        throw new Error('Borrow request not found.');
    }

    const isBorrower = request.borrower._id.toString() === userId;
    const isLender = request.lender._id.toString() === userId;

    if (!isBorrower && !isLender) {
        throw new Error('You are not authorized to view this request.');
    }

    return request;
}

  /**
   * Allows a borrower to mark an item as returned.
   */
  public async returnItem(
    requestId: string,
    borrowerId: string
  ): Promise<IBorrowRequest> {
    const borrowRequest = await BorrowRequest.findById(requestId).populate('item', 'name');

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

    // --- NOTIFICATION ---
    await notificationService.createNotification({
        recipient: borrowRequest.lender.toString(),
        sender: borrowerId,
        type: 'item_returned',
        message: `"${(borrowRequest.item as any).name}" has been marked as returned.`,
        link: `/history/lent`
    });
    // --------------------
    
    return borrowRequest;
  }
}