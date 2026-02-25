import express from 'express';
import {
  createComplaint,
  uploadTestImage,
  getAllComplaints,
  getMyComplaints,
  getOfficerComplaints,
  updateComplaint,
  sendComplaintClosureOtp,
  closeComplaintWithOtp,
  getComplaintStats,
  getComplaintsByCategory,
  getComplaintTrends,
} from '../controllers/complaintController.js';
import { getTrendingIssues } from '../controllers/trendingIssuesController.js';
import { isAuthenticatedUser, authorizeRoles, blockDemoWriteAccess } from '../middlewares/auth.js';
import { upload } from '../utils/multer.js'; // Import multer

const router = express.Router();

router.route('/complaints').get(isAuthenticatedUser, authorizeRoles('admin'), getAllComplaints);
router.route('/my-complaints').get(isAuthenticatedUser, getMyComplaints);
router.route('/officer/complaints').get(isAuthenticatedUser, authorizeRoles('officer'), getOfficerComplaints);
router.route('/complaints/trending').get(getTrendingIssues);
router.route('/complaint').post(isAuthenticatedUser, blockDemoWriteAccess, upload.array('images', 5), createComplaint); // Re-added upload.array
router.route('/upload/test').post(isAuthenticatedUser, blockDemoWriteAccess, upload.single('image'), uploadTestImage); // Re-added route for testing image upload

// New route for updating complaint status (Admin only)
router.put(
  '/complaint/:id',
  isAuthenticatedUser,
  blockDemoWriteAccess,
  authorizeRoles('admin', 'officer'),
  upload.array('resolutionImages', 5),
  updateComplaint
);
router.route('/complaint/:id/send-close-otp').post(isAuthenticatedUser, blockDemoWriteAccess, authorizeRoles('admin'), sendComplaintClosureOtp);
router.route('/complaint/:id/close').put(isAuthenticatedUser, blockDemoWriteAccess, authorizeRoles('admin'), upload.array('resolutionImages', 5), closeComplaintWithOtp);

router.route('/complaints/category-distribution').get(isAuthenticatedUser, getComplaintsByCategory);

// Admin Analytics Routes
router.route('/admin/complaints/stats').get(isAuthenticatedUser, authorizeRoles('admin'), getComplaintStats);
router.route('/admin/complaints/category-distribution').get(isAuthenticatedUser, authorizeRoles('admin'), getComplaintsByCategory);
router.route('/admin/complaints/trends').get(isAuthenticatedUser, authorizeRoles('admin'), getComplaintTrends);

export default router;
