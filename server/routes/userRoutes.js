import express from 'express';
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.js';
import { connectUser, disconnectUser, sendFeedback } from '../controllers/authController.js';
import { getOfficers, getAllUsers, deleteUser, suspendUser } from '../controllers/userController.js';

const router = express.Router();

router.route('/user/connect').post(isAuthenticatedUser, connectUser);
router.route('/user/disconnect').post(isAuthenticatedUser, disconnectUser);
router.route('/feedback').post(isAuthenticatedUser, sendFeedback);
router.route('/admin/officers').get(isAuthenticatedUser, authorizeRoles('admin'), getOfficers);

router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.route('/admin/user/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser);
router.route('/admin/user/:id/suspend').put(isAuthenticatedUser, authorizeRoles('admin'), suspendUser);

export default router;