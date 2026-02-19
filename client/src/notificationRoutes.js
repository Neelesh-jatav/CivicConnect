import express from "express";
import { isAuthenticatedUser } from "../middlewares/auth.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// Get user notifications
router.get("/", isAuthenticatedUser, async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.json({ success: true, notifications });
});

// Mark all as read
router.put("/read", isAuthenticatedUser, async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true });
});

export default router;