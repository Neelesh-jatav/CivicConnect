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
import { isAuthenticatedUser, blockDemoWriteAccess } from "../middlewares/auth.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// Public feed (reels)
router.get("/media/feed", getAllMediaFeed);
router.get("/media/user/:userId", getMediaByUserId);

// User media
router.post("/media/upload", isAuthenticatedUser, blockDemoWriteAccess, upload.single("file"), uploadMedia);
router.get("/media/me", isAuthenticatedUser, getUserMedia);
router.put("/media/:id/like", isAuthenticatedUser, blockDemoWriteAccess, likeMedia);
router.put("/media/:id/comment", isAuthenticatedUser, blockDemoWriteAccess, commentOnMedia);
router.delete("/media/:id", isAuthenticatedUser, blockDemoWriteAccess, deleteMedia);

export default router;
