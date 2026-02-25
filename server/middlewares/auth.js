import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from './catchAsyncErrors.js';

const DEMO_ACCOUNT_EMAILS = new Set([
  'laptopdesktopkumar@gmail.com',
  'paradoxoptimus780@gmail.com',
  'johnone1one2025@gmail.com',
]);

export const isDemoAccount = (email = '') => DEMO_ACCOUNT_EMAILS.has(String(email).toLowerCase());

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

export const blockDemoWriteAccess = (req, res, next) => {
  if (isDemoAccount(req.user?.email)) {
    return next(new ErrorHandler('Demo accounts are read-only. You can view content but cannot create, update, or delete.', 403));
  }
  next();
};