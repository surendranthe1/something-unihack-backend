// src/api/routes/progressRoutes.ts
import express from 'express';
import progressController from '../controllers/progressController';
import { validationMiddleware } from '../../middlewares/validationMiddleware';
import { ProgressUpdateRequestSchema } from '../models/progress';

const router = express.Router();

/**
 * Record progress for a skill map
 */
router.post(
  '/record', 
  validationMiddleware(ProgressUpdateRequestSchema),
  progressController.recordProgress
);

/**
 * Retrieve progress history for a skill map
 */
router.get(
  '/:skillMapId/history', 
  progressController.getProgressHistory
);

/**
 * Retrieve context change history for a skill map
 */
router.get(
  '/:skillMapId/context-changes', 
  progressController.getContextChangeHistory
);

export default router;