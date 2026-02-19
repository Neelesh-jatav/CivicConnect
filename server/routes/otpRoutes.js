import express from 'express';
import { generateOtp, verifyOtp } from '../controllers/otpController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.route('/otp/generate').post(isAuthenticatedUser, generateOtp);
router.route('/otp/verify').post(isAuthenticatedUser, verifyOtp);

export default router;
