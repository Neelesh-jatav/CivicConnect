import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import sendEmail from '../utils/sendEmail.js';
import User from '../models/User.js';

// Generate OTP and store in User model
export const generateOtp = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler('Email is required', 400));
  }
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated OTP for ${email}: ${otp}`); // Added console log
  const expiresAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  let user = await User.findOne({ email });
  if (!user) {
    // Create a temp user if not exists (for registration flow)
    user = new User({ email, name: 'Temp', password: 'Temp123!', avatar: { public_id: 'temp', url: 'temp' } });
  }
  user.otp = otp;
  user.otpExpire = expiresAt;
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: email,
      subject: 'Your OTP for CivicConnect',
      message: `Your One-Time Password (OTP) is: ${otp}. It is valid for 10 minutes.`,
    });
    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}`,
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler('Failed to send OTP email. Please try again later.', 500));
  }
});

// Verify OTP from User model
export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new ErrorHandler('Email and OTP are required', 400));
  }
  const user = await User.findOne({ email });
  if (!user || !user.otp || !user.otpExpire) {
    return next(new ErrorHandler('OTP not found or expired', 400));
  }
  if (user.otpExpire < Date.now()) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler('OTP has expired', 400));
  }
  if (user.otp !== otp) {
    return next(new ErrorHandler('Invalid OTP', 400));
  }
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
  });
});
