// src/api/routes/index.ts
import express from 'express';
import skillRoutes from './skillRoutes';
import progressRoutes from './progressRoutes';

const router = express.Router();

// Mount skill-related routes
router.use('/skills', skillRoutes);

// Mount progress-related routes
router.use('/progress', progressRoutes);

export default router;