import Notification from '../models/Notification.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';

// Get all notifications for a user
export const getNotifications = catchAsyncErrors(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    notifications,
  });
});

// Mark all notifications as read
export const markAllAsRead = catchAsyncErrors(async (req, res, next) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
