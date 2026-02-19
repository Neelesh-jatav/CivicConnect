import express from 'express';
import {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  sendOtp,
  verifyOtp,
} from '../controllers/authController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logout);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset').put(resetPassword);
router.route('/me').get(isAuthenticatedUser, getMe);
router.route('/send-otp').post(sendOtp);
router.route('/verify-otp').post(verifyOtp);

export default router;