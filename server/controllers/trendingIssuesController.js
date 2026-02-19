import Complaint from '../models/Complaint.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';

// Get Trending Issues (Public)
export const getTrendingIssues = catchAsyncErrors(async (req, res, next) => {
  const trendingIssues = await Complaint.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: 1, // ASCENDING order (least → most)
      },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    trendingIssues,
  });
});
