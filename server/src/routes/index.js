import { Router } from 'express';

import healthRoute from '#modules/health/health.routes';
import authRoutes from '#modules/auth/auth.routes';
import categoryRoutes from '#modules/category/category.routes';

const router = Router();

router.use('/health', healthRoute);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);

export default router;