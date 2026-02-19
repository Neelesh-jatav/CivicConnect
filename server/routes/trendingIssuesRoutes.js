import express from 'express';
import { getTrendingIssues } from '../controllers/trendingIssuesController.js';

const router = express.Router();

router.route('/trending').get(getTrendingIssues);

export default router;
