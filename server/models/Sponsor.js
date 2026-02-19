import mongoose from "mongoose";

const sponsorSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  category: String,
  description: String,

  rating: { type: Number, default: 4.5 },

  location: {
    city: String,
    area: String,
    distanceKm: Number,
  },

  phone: String,
  website: String,

  isFeatured: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Sponsor", sponsorSchema);