import Notification from "../models/Notification.js";

export const createNotification = async ({
  user,
  type,
  title,
  message,
  link,
}) => {
  await Notification.create({
    user,
    type,
    title,
    message,
    link,
  });
};