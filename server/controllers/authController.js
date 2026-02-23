import User from '../models/User.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';
import { sendToken, getVerificationToken } from '../utils/jwtToken.js';
import otpGenerator from 'otp-generator';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';
import { configDotenv } from 'dotenv';
import { CLOUDINARY_FOLDERS } from '../config/cloudinaryFolders.js';

configDotenv();


// Register a user (Final step after OTP verification)
export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, verificationToken, role, officerLevel } = req.body;
  const avatarFile = req.file; // Get the uploaded file from multer

  if (!verificationToken) {
    return next(new ErrorHandler('Verification token is missing.', 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
  } catch (error) {
    return next(new ErrorHandler('Invalid or expired verification token.', 400));
  }

  if (decoded.email !== email || !decoded.verified) {
    return next(new ErrorHandler('Email verification failed. Invalid token.', 400));
  }

  let user = await User.findOne({ email }); // Use let because we might re-fetch or update

  if (!user) {
    return next(new ErrorHandler('User not found.', 404));
  }

  if (!name) {
    return next(new ErrorHandler('Please enter your name.', 400));
  }
  if (!password) {
    return next(new ErrorHandler('Please enter your password.', 400));
  }
  if (password.length < 6) {
    return next(new ErrorHandler('Your password must be longer than 6 characters.', 400));
  }

  // Update user with name, password, and role if provided (handle FormData string conversion)
  user.name = name;
  user.password = password;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.isVerified = true;
  // Accept role from req.body, even if sent as string from FormData
  if (typeof req.body.role === 'string' && ['user', 'admin'].includes(req.body.role)) {
    user.role = req.body.role;
  }

  if (typeof req.body.officerLevel === 'string' && ['A', 'B'].includes(req.body.officerLevel)) {
    user.officerLevel = req.body.officerLevel;
    user.role = 'officer';
  }

  // Handle avatar upload to Cloudinary
  if (avatarFile) {
    const b64 = Buffer.from(avatarFile.buffer).toString("base64");
    let dataURI = "data:" + avatarFile.mimetype + ";base64," + b64;
    
    let folder = CLOUDINARY_FOLDERS.PROFILES.USERS;
    if (user.role === 'admin') {
      folder = CLOUDINARY_FOLDERS.PROFILES.ADMINS;
    } else if (user.officerLevel) {
      folder = CLOUDINARY_FOLDERS.PROFILES.OFFICERS;
    }

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      width: 150,
      crop: "scale"
    });

    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } else {
    // If no new avatar is provided, ensure a default is set if it's a new user or was temporary
    if (!user.avatar || !user.avatar.url.includes('cloudinary')) { // Check if it's still the temporary default
      user.avatar = {
        public_id: 'default_avatar',
        url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png', // Update default path
      };
    }
  }

  await user.save();

  sendToken(user, 200, res);
});

// Send OTP to email
export const sendOtp = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    // If user doesn't exist, create a temporary one with a default avatar in the new folder structure
    user = await User.create({
      email,
      password: otpGenerator.generate(10), // Placeholder password
      avatar: {
        public_id: 'default_avatar',
        url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png', // Updated default path
      },
      isVerified: false,
    });
  } else if (user.isVerified) {
    return next(new ErrorHandler('Email is already registered and verified.', 400));
  }

  // Generate OTP
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  user.otp = otp;
  user.otpExpire = Date.now() + 15 * 60 * 1000; // OTP valid for 15 minutes

  await user.save({ validateBeforeSave: false }); // Save without validating password/name

  try {
    const message = `Your OTP for CivicConnect registration is: ${otp}. It is valid for 15 minutes.`;

    await sendEmail({
      email: user.email,
      subject: 'CivicConnect OTP Verification',
      message,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email}`,
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler('Mail had not reached to provided email. Please try again later.', 500));
  }
});

// Verify OTP
export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;

  console.log('Verifying OTP for email:', email, 'OTP:', otp);

  const user = await User.findOne({
    email,
    otp,
    otpExpire: { $gt: Date.now() },
  });

  console.log('User found:', user);

  if (!user) {
    return next(new ErrorHandler('Invalid or expired OTP', 400));
  }

  user.isVerified = true; // Mark as verified in DB
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  // Generate a verification token and send it to the frontend
  const verificationToken = getVerificationToken(user);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now proceed with registration.',
    verificationToken, // Send the token to the frontend
  });
});

// Login user
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password entered
  if (!email || !password) {
    return next(new ErrorHandler('Please enter email & password', 400));
  }

  // Find user in database
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorHandler('Invalid Email or Password', 401));
  }

  // Check if password is correct
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid Email or Password', 401));
  }

  sendToken(user, 200, res);
});

// Logout user
export const logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out',
  });
});

// Get Logged In User
export const getMe = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('connections', 'name avatar email role');

  res.status(200).json({
    success: true,
    user,
  });
});

// Forgot Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler('User not found with this email', 404));
  }

  // Generate OTP
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  user.otp = otp;
  user.otpExpire = Date.now() + 15 * 60 * 1000; // 15 mins

  await user.save({ validateBeforeSave: false });

  try {
    const message = `Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`;

    await sendEmail({
      email: user.email,
      subject: 'CivicConnect Password Reset OTP',
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, otp, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new ErrorHandler('Passwords do not match', 400));
  }

  const user = await User.findOne({
    email,
    otp,
    otpExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler('Invalid OTP or has expired', 400));
  }

  user.password = password;
  user.otp = undefined;
  user.otpExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Update Password (Logged In User)
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler('Passwords do not match', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  const isMatched = await user.comparePassword(oldPassword);

  if (!isMatched) {
    return next(new ErrorHandler('Incorrect Old Password', 400));
  }

  user.password = newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// Update User Profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    phone: req.body.phone,
  };

  const user = await User.findById(req.user.id);

  if (req.file) {
    const avatarFile = req.file;
    const b64 = Buffer.from(avatarFile.buffer).toString("base64");
    let dataURI = "data:" + avatarFile.mimetype + ";base64," + b64;

    let folder = CLOUDINARY_FOLDERS.PROFILES.USERS;
    if (user.role === 'admin') {
      folder = CLOUDINARY_FOLDERS.PROFILES.ADMINS;
    } else if (user.officerLevel) {
      folder = CLOUDINARY_FOLDERS.PROFILES.OFFICERS;
    }

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      width: 150,
      crop: "scale"
    });

    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.phone) user.phone = req.body.phone;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    user,
  });
});

// Connect User (Mutual)
export const connectUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const targetUser = await User.findById(req.body.userId);

  if (!targetUser) {
    return next(new ErrorHandler('User not found', 404));
  }

  if (!user.connections) user.connections = [];
  if (!targetUser.connections) targetUser.connections = [];

  // Add to current user's connections
  if (!user.connections.includes(targetUser._id)) {
    user.connections.push(targetUser._id);
    await user.save({ validateBeforeSave: false });
  }

  // Add to target user's connections (Mutual)
  if (!targetUser.connections.includes(user._id)) {
    targetUser.connections.push(user._id);
    await targetUser.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    message: 'Connected successfully',
  });
});

// Disconnect User (Mutual)
export const disconnectUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const targetUser = await User.findById(req.body.userId);

  if (!targetUser) {
    return next(new ErrorHandler('User not found', 404));
  }

  user.connections = user.connections.filter(id => id.toString() !== targetUser._id.toString());
  targetUser.connections = targetUser.connections.filter(id => id.toString() !== user._id.toString());

  await user.save({ validateBeforeSave: false });
  await targetUser.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Disconnected successfully',
  });
});

// Send Feedback
export const sendFeedback = catchAsyncErrors(async (req, res, next) => {
  const { feedback } = req.body;
  const user = req.user;

  if (!feedback) {
    return next(new ErrorHandler('Please provide feedback message', 400));
  }

  try {
    await sendEmail({
      email: 'neeleshkumar22j@gmail.com',
      subject: `CivicConnect Feedback from ${user.name}`,
      message: `User: ${user.name} (${user.email})\n\nFeedback:\n${feedback}`,
    });

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully',
    });
  } catch (error) {
    return next(new ErrorHandler('Failed to send feedback email', 500));
  }
});