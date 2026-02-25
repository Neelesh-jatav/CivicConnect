import express from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notificationController.js';
import { isAuthenticatedUser, blockDemoWriteAccess } from '../middlewares/auth.js';

const router = express.Router();

router.route('/notifications').get(isAuthenticatedUser, getNotifications);
router.route('/notifications/read').put(isAuthenticatedUser, blockDemoWriteAccess, markAllAsRead);

export default router;
