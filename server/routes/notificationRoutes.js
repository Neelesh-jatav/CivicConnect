import express from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notificationController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.route('/notifications').get(isAuthenticatedUser, getNotifications);
router.route('/notifications/read').put(isAuthenticatedUser, markAllAsRead);

export default router;
