import express from 'express';
import { getActiveAds, createAd, trackImpression, trackClick, getAllAds, updateAdImage } from '../controllers/adController.js';
import { isAuthenticatedUser, authorizeRoles, blockDemoWriteAccess } from '../middlewares/auth.js';
import { upload } from '../utils/multer.js';

const router = express.Router();
const isAdmin = [isAuthenticatedUser, blockDemoWriteAccess, authorizeRoles('admin')];

router.get("/ads", getActiveAds);
router.post("/admin/ads", isAdmin, upload.single("image"), createAd);
router.get("/admin/ads", isAdmin, getAllAds);
router.put("/admin/ads/:id", isAdmin, upload.single("image"), updateAdImage);
router.post("/ads/:id/impression", trackImpression);
router.post("/ads/:id/click", trackClick);

export default router;