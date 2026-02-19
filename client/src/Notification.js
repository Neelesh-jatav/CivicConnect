import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: [
      "COMPLAINT_CREATED",
      "COMPLAINT_UPDATED",
      "MEDIA_LIKED",
      "MEDIA_COMMENTED",
      "MEDIA_SHARED",
    ],
    required: true,
  },

  title: String,
  message: String,

  link: String, // where to redirect on click
  isRead: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Notification", notificationSchema);