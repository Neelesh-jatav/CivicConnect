import express from 'express';
import {
  getOfficers,
  getAllUsers,
  deleteUser,
  suspendUser,
  connectUser,
  disconnectUser,
} from '../controllers/userController.js'; // Added new controller functions
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

router.route('/admin/officers').get(isAuthenticatedUser, authorizeRoles('admin'), getOfficers);

// User connection routes
router.route('/user/connect').post(isAuthenticatedUser, connectUser);
router.route('/user/disconnect').post(isAuthenticatedUser, disconnectUser);

// Admin User Management Routes
router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.route('/admin/user/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser);
router.route('/admin/user/:id/suspend').put(isAuthenticatedUser, authorizeRoles('admin'), suspendUser);

export default router;