import express from "express";
import {
  uploadMedia,
  getUserMedia,
  deleteMedia,
  getAllMediaFeed,
  getMediaByUserId,
  likeMedia,
  commentOnMedia,
} from "../controllers/mediaController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// Public feed (reels)
router.get("/media/feed", getAllMediaFeed);
router.get("/media/user/:userId", getMediaByUserId);

// User media
router.post("/media/upload", isAuthenticatedUser, upload.single("file"), uploadMedia);
router.get("/media/me", isAuthenticatedUser, getUserMedia);
router.put("/media/:id/like", isAuthenticatedUser, likeMedia);
router.put("/media/:id/comment", isAuthenticatedUser, commentOnMedia);
router.delete("/media/:id", isAuthenticatedUser, deleteMedia);

export default router;
