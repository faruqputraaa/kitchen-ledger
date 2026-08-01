import { Router } from 'express';
import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';
import { createAdjustment, getAdjustments } from './stock-adjustment.controller.js';
import { createStockAdjustmentSchema, stockAdjustmentQuerySchema } from './stock-adjustment.validation.js';

const router = Router();
router.use(authMiddleware);

router.post('/', validate(createStockAdjustmentSchema), createAdjustment);
router.get('/', validate(stockAdjustmentQuerySchema), getAdjustments);

export default router;