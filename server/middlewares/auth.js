import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from './catchAsyncErrors.js';

export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler('Login first to access this resource.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  console.log('Authenticated User:', req.user);

  next();
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('Checking Authorization: User Role', req.user.role, 'Required Roles', roles);
    if (!roles.includes(req.user.role)) {
      console.log('Unauthorized Access: User Role', req.user.role, 'Required Roles', roles);
      return next(
        new ErrorHandler(
          `Role (${req.user.role}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};