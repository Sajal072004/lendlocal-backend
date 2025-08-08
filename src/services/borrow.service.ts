import { BorrowRequest, IBorrowRequest } from '../models/BorrowRequest.model';
import { Item } from '../models/Item.model';
import { Review } from '../models/Review.model';
import { User } from '../models/User.model';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();


const recalculateReputation = async (userId: string) => {
  const reviews = await Review.find({ reviewee: userId });
  if (reviews.length === 0) {
      await User.findByIdAndUpdate(userId, { reputationScore: 5.0 }); 
      return;
  }
  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  await User.findByIdAndUpdate(userId, { reputationScore: averageRating });
};

export class BorrowService {
  /**
   * Creates a borrow request for an item.
   */
  public async createRequest(
    itemId: string,
    borrowerId: string
  ): Promise<IBorrowRequest> {
    
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found.');
    }
    if (item.availabilityStatus !== 'available') {
      throw new Error('Item is not available to borrow.');
    }

    
    if (item.owner.toString() === borrowerId) {
      throw new Error('You cannot borrow your own item.');
    }

    
    const existingRequest = await BorrowRequest.findOne({
      item: itemId,
      borrower: borrowerId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existingRequest) {
      throw new Error('You already have an active request for this item.');
    }

    
    const borrowRequest = await BorrowRequest.create({
      item: itemId,
      borrower: borrowerId,
      lender: item.owner,
      status: 'pending',
    });

    
    await notificationService.createNotification({
      recipient: item.owner.toString(),
      sender: borrowerId,
      type: 'new_borrow_request',
      message: `You have a new request to borrow "${item.name}".`,
      link: `/requests/${borrowRequest._id}`,
    });
    

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

    
    if (borrowRequest.lender.toString() !== lenderId) {
      throw new Error('You are not authorized to respond to this request.');
    }

    
    if (borrowRequest.status !== 'pending') {
      throw new Error('This request has already been responded to.');
    }

    
    borrowRequest.status = response;
    
    if (response === 'approved') {
      await Item.findByIdAndUpdate(borrowRequest.item, {
        availabilityStatus: 'borrowed',
      });
    }

    await borrowRequest.save();

    
    const notificationType = response === 'approved' ? 'request_approved' : 'request_denied';
    const message = `Your request to borrow "${(borrowRequest.item as any).name}" has been ${response}.`;
    
    await notificationService.createNotification({
      recipient: borrowRequest.borrower.toString(),
      sender: lenderId,
      type: notificationType,
      message: message,
      link: `/requests/${borrowRequest._id}`,
    });
    

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
      .populate('item', 'name photos').sort({ createdAt: -1 });

    const outgoing = await BorrowRequest.find({ borrower: userId })
      .populate('lender', 'name profilePicture')
      .populate('item', 'name photos').sort({ createdAt: -1 });

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

 
 public async initiateReturn(requestId: string, borrowerId: string, review?: { rating: number; comment: string }): Promise<IBorrowRequest> {
  const request = await BorrowRequest.findById(requestId).populate('item');
  if (!request) throw new Error('Request not found.');
  if (request.borrower.toString() !== borrowerId) throw new Error('Not authorized.');
  if (request.status !== 'approved') throw new Error('This item has not been approved for borrowing.');

  request.status = 'awaiting_confirmation';
  
  
  if (review && review.rating) {
      await Review.create({
          rating: review.rating,
          comment: review.comment,
          reviewer: borrowerId,
          reviewee: request.lender, 
          item: (request.item as any)._id,
          borrowRequest: requestId
      });
      await recalculateReputation(request.lender.toString());
  }

  await request.save();

  
  const itemDoc = request.item as any;
  const notificationService = new NotificationService();
  await notificationService.createNotification({
      recipient: request.lender.toString(),
      sender: borrowerId,
      type: 'item_returned',
      message: `has marked "${itemDoc.name}" as returned. Please confirm you have received it.`,
      link: `/requests/${requestId}`
  });

  return request;
}


public async confirmReturn(requestId: string, lenderId: string, review?: { rating: number; comment: string }): Promise<IBorrowRequest> {
  const request = await BorrowRequest.findById(requestId);
  if (!request) throw new Error('Request not found.');
  if (request.lender.toString() !== lenderId) throw new Error('Not authorized.');
  

  request.status = 'returned';

  
  if (review && review.rating) {
      await Review.create({
          rating: review.rating,
          comment: review.comment,
          reviewer: lenderId,
          reviewee: request.borrower, 
          item: request.item,
          borrowRequest: requestId
      });
      await recalculateReputation(request.borrower.toString());
  }
  
  await request.save();
  await Item.findByIdAndUpdate(request.item, { availabilityStatus: 'available' });

  await notificationService.createNotification({
      recipient: request.borrower.toString(),
      sender: lenderId,
      type: 'return_confirmed',
      message: `has confirmed the return of the item.`,
      link: `/requests/${requestId}`
  });

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

    
    if (borrowRequest.borrower.toString() !== borrowerId) {
      throw new Error('You are not authorized to return this item.');
    }

    
    if (borrowRequest.status !== 'approved') {
      throw new Error('This item cannot be returned as it was not in an approved borrowing state.');
    }

    
    borrowRequest.status = 'returned';
    borrowRequest.returnDate = new Date();

    
    await Item.findByIdAndUpdate(borrowRequest.item, {
      availabilityStatus: 'available',
    });
    
    await borrowRequest.save();

    
    await notificationService.createNotification({
        recipient: borrowRequest.lender.toString(),
        sender: borrowerId,
        type: 'item_returned',
        message: `"${(borrowRequest.item as any).name}" has been marked as returned.`,
        link: `/history/lent`
    });
    
    
    return borrowRequest;
  }
}