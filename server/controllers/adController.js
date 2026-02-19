import Advertisement from "../models/Advertisement.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";

export const createAd = catchAsyncErrors(async (req, res) => {
  const imageUpload = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "ads");

  const ad = await Advertisement.create({
    sponsor: req.body.sponsor,
    offerText: req.body.offerText,
    ctaType: req.body.ctaType,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    priority: req.body.priority,
    image: imageUpload,
  });

  res.status(201).json({ success: true, ad });
});

export const getActiveAds = catchAsyncErrors(async (req, res) => {
  const today = new Date();

  const ads = await Advertisement.find({
    isActive: true,
    startDate: { $lte: today },
    endDate: { $gte: today },
  })
    .populate("sponsor")
    .sort({ priority: 1 });

  res.json({ success: true, ads });
});

export const getAllAds = catchAsyncErrors(async (req, res) => {
  const ads = await Advertisement.find({})
    .populate("sponsor")
    .sort({ createdAt: -1 });

  res.json({ success: true, ads });
});

export const trackImpression = catchAsyncErrors(async (req, res) => {
  await Advertisement.findByIdAndUpdate(req.params.id, {
    $inc: { impressions: 1 },
  });
  res.json({ success: true });
});

export const trackClick = catchAsyncErrors(async (req, res) => {
  await Advertisement.findByIdAndUpdate(req.params.id, {
    $inc: { clicks: 1 },
  });
  res.json({ success: true });
});