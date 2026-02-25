import express from 'express';
const router = express.Router();

import { registerUser, sendOtp, verifyOtp, loginUser, logout, getMe, forgotPassword, resetPassword, updatePassword, updateProfile } from '../controllers/authController.js'; // Modified import
import { upload } from '../utils/multer.js'; // Import the configured multer instance
import { isAuthenticatedUser, blockDemoWriteAccess } from '../middlewares/auth.js';

router.route('/register').post(upload.single('avatar'), registerUser);
router.route('/send-otp').post(sendOtp);
router.route('/verify-otp').post(verifyOtp);
router.route('/login').post(loginUser);
router.route('/logout').get(logout); // New logout route
router.route('/me').get(isAuthenticatedUser, getMe);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset').put(resetPassword);
router.route('/password/update').put(isAuthenticatedUser, blockDemoWriteAccess, updatePassword);
router.route('/me/update').put(isAuthenticatedUser, blockDemoWriteAccess, upload.single('avatar'), updateProfile);

export default router;