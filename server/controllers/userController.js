import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';

// Get all officers (users with officerLevel set)
export const getOfficers = catchAsyncErrors(async (req, res, next) => {
  const officers = await User.find({ officerLevel: { $ne: null } }).select('name officerLevel');
  console.log('Fetched officers from DB (getOfficers):', officers); // Debugging
  res.status(200).json({
    success: true,
    officers,
  });
});

// Connect with a user
export const connectUser = catchAsyncErrors(async (req, res, next) => {
  const userToConnect = await User.findById(req.body.userId);
  const currentUser = await User.findById(req.user.id);

  if (!userToConnect || !currentUser) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Add to connections
  currentUser.connections.push(userToConnect._id);
  await currentUser.save();

  // Create notification
  await Notification.create({
    user: userToConnect._id,
    title: 'New Connection',
    message: `${currentUser.name} connected with you.`,
    link: `/user/${currentUser._id}`, // Link to the user's profile
  });

  res.status(200).json({
    success: true,
    message: 'User connected successfully',
  });
});

// Disconnect from a user
export const disconnectUser = catchAsyncErrors(async (req, res, next) => {
  const userToDisconnect = await User.findById(req.body.userId);
  const currentUser = await User.findById(req.user.id);

  if (!userToDisconnect || !currentUser) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Remove from connections
  currentUser.connections = currentUser.connections.filter(
    (connectionId) => connectionId.toString() !== userToDisconnect._id.toString()
  );
  await currentUser.save();

  res.status(200).json({
    success: true,
    message: 'User disconnected successfully',
  });
});

// Get all users -- Admin
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

// Delete user -- Admin
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 404));
  }

  await user.deleteOne(); // Use deleteOne() instead of remove()

  res.status(200).json({
    success: true,
    message: 'User Deleted Successfully',
  });
});

// Suspend/Unsuspend user -- Admin
export const suspendUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 404));
  }

  user.isSuspended = req.body.isSuspended; // Assuming req.body.isSuspended is a boolean

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
  });
});