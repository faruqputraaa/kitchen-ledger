import { Router } from 'express';

import healthRoute from '#modules/health/health.routes';
import authRoutes from '#modules/auth/auth.routes';
import categoryRoutes from '#modules/category/category.routes';
import unitRoutes from '#modules/unit/unit.routes';
import supplierRoutes from '#modules/supplier/supplier.routes';
import ingredientRoutes from '#modules/ingredient/ingredient.routes';
import purchaseRoutes from '#modules/purchase/purchase.routes';


const router = Router();

router.use('/health', healthRoute);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/units', unitRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/purchases', purchaseRoutes);

export default router;
