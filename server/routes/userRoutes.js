import express from 'express';
import { isAuthenticatedUser, authorizeRoles, blockDemoWriteAccess } from '../middlewares/auth.js';
import { connectUser, disconnectUser, sendFeedback } from '../controllers/authController.js';
import { getOfficers, getAllUsers, deleteUser, suspendUser } from '../controllers/userController.js';

const router = express.Router();

router.route('/user/connect').post(isAuthenticatedUser, blockDemoWriteAccess, connectUser);
router.route('/user/disconnect').post(isAuthenticatedUser, blockDemoWriteAccess, disconnectUser);
router.route('/feedback').post(isAuthenticatedUser, blockDemoWriteAccess, sendFeedback);
router.route('/admin/officers').get(isAuthenticatedUser, authorizeRoles('admin'), getOfficers);

router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.route('/admin/user/:id').delete(isAuthenticatedUser, blockDemoWriteAccess, authorizeRoles('admin'), deleteUser);
router.route('/admin/user/:id/suspend').put(isAuthenticatedUser, blockDemoWriteAccess, authorizeRoles('admin'), suspendUser);

export default router;