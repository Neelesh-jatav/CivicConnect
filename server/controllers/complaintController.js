import Complaint from '../models/Complaint.js';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import cloudinary from '../config/cloudinary.js'; // Correct import for cloudinary
import mongoose from 'mongoose';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import { verifyOtp } from './otpController.js'; // Import verifyOtp
import User from '../models/User.js'; // Import User model
import Notification from '../models/Notification.js'; // Import Notification model
import otpGenerator from 'otp-generator';
import sendEmail from '../utils/sendEmail.js';
import { CLOUDINARY_FOLDERS } from '../config/cloudinaryFolders.js';

// Create Complaint
export const createComplaint = catchAsyncErrors(async (req, res, next) => {
  // 🔥 DEBUG LOGS - REMOVE AFTER TESTING
  console.log('=== CREATE COMPLAINT DEBUG ===');
  console.log('REQ.USER:', req.user);
  console.log('REQ.FILES:', req.files?.length || 'No files');
  console.log('REQ.BODY:', req.body);
  console.log('============================');

  const { title, description, category, state, district, pincode, landmark } = req.body;
  const images = req.files; // Multer will populate req.files for array uploads

  if (!req.user || !req.user.id) {
    console.error('❌ USER NOT AUTHENTICATED - req.user is:', req.user);
    return next(new ErrorHandler('User not authenticated. Please log in.', 401));
  }

  if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
    console.error('❌ INVALID USER ID:', req.user.id);
    return next(new ErrorHandler('Invalid user ID provided.', 400));
  }

  if (!title || !description || !category || !state || !district || !pincode) {
    console.error('❌ MISSING REQUIRED FIELDS - title:', title, 'description:', description, 'category:', category, 'state:', state, 'district:', district, 'pincode:', pincode);
    return next(new ErrorHandler('Please enter all required fields: title, description, category, state, district, and pincode.', 400));
  }

  const imagesLinks = [];
  if (images && images.length > 0) {
    console.log('📸 Processing', images.length, 'images...');
    for (let i = 0; i < images.length; i++) {
      try {
        const uploadedImage = await uploadToCloudinary(
          images[i].buffer,
          images[i].mimetype,
          CLOUDINARY_FOLDERS.COMPLAINTS.EVIDENCE
        );
        imagesLinks.push(uploadedImage);
        console.log(`✅ Image ${i + 1} uploaded successfully`);
      } catch (cloudinaryError) {
        console.error(`❌ Cloudinary upload error for image ${i + 1}:`, cloudinaryError.message);
        // Continue processing other images even if one fails, but log the error
      }
    }

    if (images.length > 0 && imagesLinks.length === 0) {
      console.error('❌ NO IMAGES WERE UPLOADED SUCCESSFULLY');
      return next(new ErrorHandler('Failed to upload images. Please try again.', 500));
    }
  } else {
    console.log('ℹ️ No images provided in request');
  }

  try {
    console.log('💾 Creating complaint in database...');
    const complaint = await Complaint.create({
      title,
      description,
      images: imagesLinks,
      category,
      state,
      district,
      pincode,
      landmark: landmark || '',
      user: req.user.id,
      status: 'Pending',
      department: null,
      officer: null,
      resolutionImages: [],
      finalComments: '',
    });

    // Initialize status history with the initial pending status
    complaint.statusHistory.push({
      status: 'Pending',
      description: 'Complaint submitted',
      updatedBy: req.user.id,
      timestamp: complaint.createdAt,
    });
    await complaint.save({ validateBeforeSave: true });

    // Create a notification for the user
    await Notification.create({
      user: req.user.id,
      title: 'Complaint Submitted',
      message: `Your complaint "${complaint.title}" has been successfully submitted.`,
      link: '/my-complaints', // Link to the 'My Complaints' page
    });

    console.log('✅ COMPLAINT CREATED SUCCESSFULLY - ID:', complaint._id);
    res.status(201).json({
      success: true,
      complaint,
      message: 'Complaint submitted successfully!',
    });
  } catch (dbError) {
    console.error('❌ DATABASE ERROR:', dbError.message);
    if (dbError.name === 'ValidationError') {
      const messages = Object.values(dbError.errors).map(val => val.message);
      return next(new ErrorHandler(messages.join(', '), 400));
    }
    return next(new ErrorHandler('Failed to save complaint details to database.', 500));
  }
});

// Upload Test Image to Cloudinary
export const uploadTestImage = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      CLOUDINARY_FOLDERS.TESTS
    );

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: result.url,
      public_id: result.public_id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: err.message });
  }
});

// Get All Complaints
export const getAllComplaints = catchAsyncErrors(async (req, res, next) => {
  const complaints = await Complaint.find()
    .populate('user', 'name email')
    .populate('statusHistory.updatedBy', 'name')
    .populate('officer', 'name officerLevel'); // Populate the main officer field
  console.log('Populated complaints (getAllComplaints):', complaints.map(c => ({ _id: c._id, officer: c.officer }))); // Debugging
  res.status(200).json({
    success: true,
    complaints,
  });
});

// Get My Complaints
export const getMyComplaints = catchAsyncErrors(async (req, res, next) => {
  const complaints = await Complaint.find({ user: req.user.id })
    .populate('user', 'name email')
    .populate('statusHistory.updatedBy', 'name')
    .populate('officer', 'name officerLevel'); // Populate the main officer field
  console.log('Populated complaints (getMyComplaints):', complaints.map(c => ({ _id: c._id, officer: c.officer }))); // Debugging
  res.status(200).json({
    success: true,
    complaints,
  });
});

// Get Officer Assigned Complaints
export const getOfficerComplaints = catchAsyncErrors(async (req, res, next) => {
  const complaints = await Complaint.find({ officer: req.user.id })
    .populate('user', 'name email')
    .populate('statusHistory.updatedBy', 'name');
  res.status(200).json({
    success: true,
    complaints,
  });
});

// Update Complaint Status (Admin)
export const updateComplaint = catchAsyncErrors(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new ErrorHandler('Unauthorized access', 401));
  }
  const { status: newStatus, description, department, officer, finalComments } = req.body;

  if (!newStatus) {
    return next(new ErrorHandler('Please provide a new status for the complaint.', 400));
  }

  // CRITICAL: Prevent closing complaint directly via this endpoint. Must use OTP flow.
  if (newStatus === 'Closed') {
    return next(new ErrorHandler('Complaints cannot be closed directly. Please use the OTP verification process.', 400));
  }

  let complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new ErrorHandler('Complaint not found', 404));
  }

  // If user is officer, ensure they are assigned to this complaint
  if (req.user.role === 'officer' && complaint.officer?.toString() !== req.user.id) {
    return next(new ErrorHandler('You are not authorized to update this complaint.', 403));
  }

  // Handle resolution images upload if any
  let resolutionImageLinks = [];
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      try {
        const uploadedImage = await uploadToCloudinary(
          req.files[i].buffer,
          req.files[i].mimetype,
          CLOUDINARY_FOLDERS.COMPLAINTS.RESOLUTION
        );
        resolutionImageLinks.push(uploadedImage);
      } catch (cloudinaryError) {
        console.error(`Cloudinary upload error:`, cloudinaryError);
      }
    }
  }

  // Update current status
  complaint.status = newStatus;

  const historyEntry = {
    status: newStatus,
    description: description || '',
    updatedBy: req.user.id,
    timestamp: Date.now(),
  };

  // Conditional updates based on newStatus
  if (newStatus === 'Accepted') {
    // No specific fields to update on main complaint for 'Accepted'
  } else if (newStatus === 'Allocated to Department') {
    if (!department) {
      return next(new ErrorHandler('Please provide a department to allocate the complaint to.', 400));
    }
    complaint.department = department;
    historyEntry.assignedDepartment = department;
  } else if (newStatus === 'Allocated to Officer') {
    // If officer is provided, assign; otherwise, treat as "Municipal Officer" (no error)
    if (officer) {
      complaint.officer = officer;
      historyEntry.assignedOfficer = officer;
    } else {
      complaint.officer = undefined;
      historyEntry.description = description || 'Allocated to Municipal Officer';
    }
  } else if (newStatus === 'In Progress') {
    if (resolutionImageLinks.length > 0) {
      if (!complaint.resolutionImages) complaint.resolutionImages = [];
      complaint.resolutionImages.push(...resolutionImageLinks);
    }
  } else if (newStatus === 'Resolved') {
    if (resolutionImageLinks.length > 0) {
      if (!complaint.resolutionImages) complaint.resolutionImages = [];
      complaint.resolutionImages.push(...resolutionImageLinks);
    }
    complaint.finalComments = description || finalComments || '';
  }

  // Add to status history
  complaint.statusHistory.push(historyEntry);

  await complaint.save({ validateModifiedOnly: true });

  // Notify User about status update
  await Notification.create({
    user: complaint.user,
    title: `Complaint Update: ${newStatus}`,
    message: `Your complaint "${complaint.title}" status has been updated to ${newStatus}.${description ? ` Remarks: ${description}` : ''}`,
    link: '/my-complaints',
  });

  // Notify Officer if allocated
  if (newStatus === 'Allocated to Officer' && officer) {
    await Notification.create({
      user: officer,
      title: 'New Complaint Assigned',
      message: `You have been assigned to complaint "${complaint.title}".`,
      link: '/admin/dashboard',
    });
  }

  // Notify Admins if updated by Officer
  if (req.user.role === 'officer') {
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'Officer Update',
        message: `Officer ${req.user.name} updated complaint "${complaint.title}" to ${newStatus}.`,
        link: '/admin/dashboard',
      });
    }
  }

  res.status(200).json({
    success: true,
    complaint,
  });
});

// Send OTP for Complaint Closure (Admin triggers this)
export const sendComplaintClosureOtp = catchAsyncErrors(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new ErrorHandler('Complaint not found', 404));
  }

  const user = await User.findById(complaint.user);
  if (!user) {
    return next(new ErrorHandler('User associated with this complaint not found', 404));
  }

  // Generate OTP
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  
  // Save OTP to user document (reusing existing OTP fields for simplicity)
  user.otp = otp;
  user.otpExpire = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save({ validateBeforeSave: false });

  try {
    const message = `Your complaint "${complaint.title}" is being closed by the administrator. \n\nPlease provide the following OTP to the administrator to verify and close the complaint: \n\n${otp}\n\nThis OTP is valid for 15 minutes.`;

    await sendEmail({
      email: user.email,
      subject: 'CivicConnect Complaint Closure OTP',
      message,
    });

    // Notify User about OTP
    await Notification.create({
      user: user._id,
      title: 'OTP Sent for Closure',
      message: `An OTP has been sent to your email for closing complaint "${complaint.title}". Please share it with the officer.`,
      link: '/my-complaints',
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to user's email (${user.email})`,
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler('Failed to send OTP email.', 500));
  }
});

// Close Complaint with OTP
export const closeComplaintWithOtp = catchAsyncErrors(async (req, res, next) => {
  const { otp, finalComments, description } = req.body;
  const complaintId = req.params.id;
  const resolutionImages = req.files; // Multer will populate req.files for array uploads

  console.log('closeComplaintWithOtp called.');
  console.log('Complaint ID:', complaintId);
  console.log('User ID:', req.user?.id);
  console.log('OTP received:', otp);
  console.log('Resolution Images (req.files):', resolutionImages);

  if (!otp) {
    return next(new ErrorHandler('OTP is required to close the complaint.', 400));
  }

  let complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    return next(new ErrorHandler('Complaint not found', 404));
  }

  // Verify OTP
  const user = await User.findById(complaint.user);
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  if (!user.otp || user.otp !== otp || user.otpExpire < Date.now()) {
    return next(new ErrorHandler('Invalid or expired OTP', 400));
  }

  // Clear OTP after successful verification
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  // Upload resolution images to Cloudinary
  const resolutionImageLinks = [];
  if (resolutionImages && resolutionImages.length > 0) {
    for (let i = 0; i < resolutionImages.length; i++) {
      try {
        const uploadedImage = await uploadToCloudinary(
          resolutionImages[i].buffer,
          resolutionImages[i].mimetype,
          CLOUDINARY_FOLDERS.COMPLAINTS.RESOLUTION
        );
        resolutionImageLinks.push(uploadedImage);
      } catch (cloudinaryError) {
        console.error(`Cloudinary upload error for resolution image ${i + 1}:`, cloudinaryError);
        // Continue processing other images even if one fails, but log the error
      }
    }
  }

  // Update complaint status to Closed
  complaint.status = 'Closed';
  complaint.finalComments = finalComments || '';
  complaint.resolutionImages = resolutionImageLinks;

  // Add to status history
  complaint.statusHistory.push({
    status: 'Closed',
    description: description || 'Complaint closed by user with OTP verification.',
    updatedBy: req.user.id,
    timestamp: Date.now(),
  });

  await complaint.save({ validateModifiedOnly: true });

  // Notify User about closure
  await Notification.create({
    user: complaint.user,
    title: 'Complaint Closed',
    message: `Your complaint "${complaint.title}" has been successfully resolved and closed.`,
    link: '/my-complaints',
  });

  res.status(200).json({
    success: true,
    complaint,
    message: 'Complaint closed successfully with OTP verification.',
  });
});

// Get Complaint Statistics (Admin)
export const getComplaintStats = catchAsyncErrors(async (req, res, next) => {
  const totalComplaints = await Complaint.countDocuments();
  // Count both 'Resolved' and 'Closed' as resolved
  const resolvedComplaints = await Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
  const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });

  // Calculate average resolution time for both 'Resolved' and 'Closed'
  const resolvedComplaintsData = await Complaint.find({ status: { $in: ['Resolved', 'Closed'] } }, 'createdAt updatedAt');
  let totalResolutionTime = 0;
  let resolvedCount = 0;

  resolvedComplaintsData.forEach(complaint => {
    if (complaint.createdAt && complaint.updatedAt) {
      const created = new Date(complaint.createdAt);
      const updated = new Date(complaint.updatedAt);
      totalResolutionTime += (updated.getTime() - created.getTime()); // time in milliseconds
      resolvedCount++;
    }
  });

  const averageResolutionTimeMs = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
  const averageResolutionTimeDays = (averageResolutionTimeMs / (1000 * 60 * 60 * 24)).toFixed(2);

  console.log('Backend Stats:', {
    totalComplaints,
    resolvedComplaints,
    pendingComplaints,
    averageResolutionTime: `${averageResolutionTimeDays} days`,
  });

  res.status(200).json({
    success: true,
    stats: {
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      averageResolutionTime: `${averageResolutionTimeDays} days`,
    },
  });
});

// Get Complaints by Category (Admin)
export const getComplaintsByCategory = catchAsyncErrors(async (req, res, next) => {
  const complaintsByCategory = await Complaint.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { name: '$_id', value: '$count', _id: 0 } },
  ]);

  console.log('Backend Complaints by Category:', complaintsByCategory);

  res.status(200).json({
    success: true,
    complaintsByCategory,
  });
});

// Get Complaint Trends Over Time (Admin)
export const getComplaintTrends = catchAsyncErrors(async (req, res, next) => {
  const complaintTrends = await Complaint.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        complaints: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        name: { $concat: [ { $toString: '$_id.month' }, '/', { $toString: '$_id.year' } ] },
        complaints: 1,
      },
    },
  ]);

  console.log('Backend Complaint Trends:', complaintTrends);

  res.status(200).json({
    success: true,
    complaintTrends,
  });
});