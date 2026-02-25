import express from 'express';
import { generateOtp, verifyOtp } from '../controllers/otpController.js';
import { isAuthenticatedUser, blockDemoWriteAccess } from '../middlewares/auth.js';

const router = express.Router();

router.route('/otp/generate').post(isAuthenticatedUser, blockDemoWriteAccess, generateOtp);
router.route('/otp/verify').post(isAuthenticatedUser, blockDemoWriteAccess, verifyOtp);

export default router;
