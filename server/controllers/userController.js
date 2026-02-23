import User from '../models/User.js';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';

// Get all officers (users with officerLevel set)
export const getOfficers = catchAsyncErrors(async (req, res, next) => {
  const officers = await User.find({ officerLevel: { $ne: null } }).select('name email officerLevel');
  res.status(200).json({
    success: true,
    officers,
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