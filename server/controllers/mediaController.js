import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import Media from '../models/Media.js';
import ErrorHandler from '../utils/errorHandler.js';
import { uploadToCloudinary, destroyFromCloudinary } from '../utils/uploadToCloudinary.js';

/* ======================================================
   PUBLIC FEED – RANDOM REELS / SHORTS
====================================================== */
export const getAllMediaFeed = catchAsyncErrors(async (req, res, next) => {
  // Fetch latest 50 items and shuffle them for randomness
  let media = await Media.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name avatar")
    .populate({
      path: "comments.user",
      select: "name avatar",
    });

  // Shuffle array
  media = media.sort(() => Math.random() - 0.5).slice(0, 20);

  res.status(200).json({
    success: true,
    count: media.length,
    media,
  });
});

/* ======================================================
   UPLOAD MEDIA
====================================================== */
export const uploadMedia = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("Please upload image or video", 400));
  }

  const { title, description } = req.body;

  const result = await uploadToCloudinary(
    req.file.buffer,
    req.file.mimetype,
    "media"
  );

  const media = await Media.create({
    user: req.user.id,
    url: result.url,
    public_id: result.public_id,
    type: req.file.mimetype.startsWith("video") ? "video" : "image",
    title,
    description,
  });

  res.status(201).json({
    success: true,
    media,
  });
});

/* ======================================================
   GET LOGGED-IN USER MEDIA
====================================================== */
export const getUserMedia = catchAsyncErrors(async (req, res, next) => {
  const media = await Media.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: media.length,
    media,
  });
});

/* ======================================================
   GET MEDIA BY USER ID (PUBLIC)
====================================================== */
export const getMediaByUserId = catchAsyncErrors(async (req, res, next) => {
  const media = await Media.find({ user: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("user", "name avatar")
    .populate({
      path: "comments.user",
      select: "name avatar",
    });

  res.status(200).json({
    success: true,
    count: media.length,
    media,
  });
});

/* ======================================================
   LIKE / UNLIKE MEDIA
====================================================== */
export const likeMedia = catchAsyncErrors(async (req, res, next) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    return next(new ErrorHandler("Media not found", 404));
  }

  // Check if already liked
  if (media.likes.includes(req.user.id)) {
    // Unlike
    media.likes = media.likes.filter((id) => id.toString() !== req.user.id);
  } else {
    // Like
    media.likes.push(req.user.id);
  }

  await media.save();

  res.status(200).json({ success: true, likes: media.likes });
});

/* ======================================================
   ADD COMMENT
====================================================== */
export const commentOnMedia = catchAsyncErrors(async (req, res, next) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    return next(new ErrorHandler("Media not found", 404));
  }

  const comment = {
    user: req.user.id,
    text: req.body.text,
  };

  media.comments.push(comment);
  await media.save();

  await media.populate({
    path: "comments.user",
    select: "name avatar",
  });

  res.status(200).json({ success: true, comments: media.comments });
});

/* ======================================================
   DELETE MEDIA
====================================================== */
export const deleteMedia = catchAsyncErrors(async (req, res, next) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    return next(new ErrorHandler("Media not found", 404));
  }

  if (media.user.toString() !== req.user.id) {
    return next(new ErrorHandler("Not authorized", 403));
  }

  await destroyFromCloudinary(media.public_id);
  await media.deleteOne();

  res.status(200).json({
    success: true,
    message: "Media deleted successfully",
  });
});
