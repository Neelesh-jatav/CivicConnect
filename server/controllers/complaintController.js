import Complaint from '../models/Complaint.js';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import cloudinary from '../config/cloudinary.js'; // Correct import for cloudinary
import mongoose from 'mongoose';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import { verifyOtp } from './otpController.js'; // Import verifyOtp
import User from '../models/User.js'; // Import User model
import Notification from '../models/Notification.js'; // Import Notification model

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
          'CivicConnect/complaint_uploaded_images'
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
      'CivicConnect/test_uploads'
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

// Update Complaint Status (Admin)
export const updateComplaint = catchAsyncErrors(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new ErrorHandler('Unauthorized access', 401));
  }
  const { status: newStatus, description, department, officer, resolutionImages, finalComments } = req.body;

  if (!newStatus) {
    return next(new ErrorHandler('Please provide a new status for the complaint.', 400));
  }

  let complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new ErrorHandler('Complaint not found', 404));
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
  } else if (newStatus === 'Resolved') {
    complaint.resolutionImages = resolutionImages || [];
    complaint.finalComments = finalComments || '';
  }

  // Add to status history
  complaint.statusHistory.push(historyEntry);

  await complaint.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    complaint,
  });
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

  // OTP is assumed to be verified by a separate frontend step
  // No need to re-verify here, just proceed with closing the complaint.

  // Upload resolution images to Cloudinary
  const resolutionImageLinks = [];
  if (resolutionImages && resolutionImages.length > 0) {
    for (let i = 0; i < resolutionImages.length; i++) {
      try {
        const uploadedImage = await uploadToCloudinary(
          resolutionImages[i].buffer,
          resolutionImages[i].mimetype,
          'CivicConnect/complaint_resolution_images'
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