// src/routes/dashboardRoutes.ts
import { Router } from 'express';
import { getDashboardData, getUserStats } from '../controllers/dashboardController';

const router = Router();

/**
 * @route   GET /api/dashboard/:userId
 * @desc    Get full dashboard data for a user
 * @access  Protected
 */
router.get('/:userId', getDashboardData);

/**
 * @route   GET /api/dashboard/:userId/stats
 * @desc    Get quick stats summary for a user
 * @access  Protected
 */
router.get('/:userId/stats', getUserStats);

export default router;