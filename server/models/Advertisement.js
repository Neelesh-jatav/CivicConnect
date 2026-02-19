import mongoose from "mongoose";

const advertisementSchema = new mongoose.Schema({
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sponsor",
    required: true,
  },

  image: {
    public_id: String,
    url: String,
  },

  offerText: String,
  ctaType: { type: String, enum: ["visit", "call"] },

  startDate: Date,
  endDate: Date,

  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },

  priority: { type: Number, default: 1 },
  isSponsored: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Advertisement", advertisementSchema);