// src/routes/skillMapRoutes.ts
import { Router } from 'express';
import * as skillMapController from '../controllers/skillMapController';
import { validate } from '../middleware/validation';
import { SkillMapRequestSchema } from '../models/dto/SkillMapDto';
import { z } from 'zod';

const router = Router();

// Search query schema
const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform(val => 
    val ? parseInt(val, 10) : undefined
  ),
});

/**
 * @route   POST /api/skill-maps
 * @desc    Generate a new skill map
 * @access  Public
 */
router.post(
  '/',
  validate(SkillMapRequestSchema),
  skillMapController.generateSkillMap
);

/**
 * @route   GET /api/skill-maps/search
 * @desc    Search skill maps
 * @access  Public
 * NOTE: This route must come BEFORE the :id route to prevent conflicts
 */
router.get(
  '/search',
  validate(SearchQuerySchema, 'query'),
  skillMapController.searchSkillMaps
);

/**
 * @route   GET /api/skill-maps/user/:userId
 * @desc    Get skill maps for a user
 * @access  Public
 */
router.get(
  '/user/:userId',
  skillMapController.getSkillMapsByUserId
);

/**
 * @route   GET /api/skill-maps/:id
 * @desc    Get a skill map by ID
 * @access  Public
 */
router.get(
  '/:id',
  skillMapController.getSkillMapById
);

/**
 * @route   DELETE /api/skill-maps/:id
 * @desc    Delete a skill map
 * @access  Public
 */
router.delete(
  '/:id',
  skillMapController.deleteSkillMap
);

export default router;