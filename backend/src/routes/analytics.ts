import { Router, Request, Response, NextFunction } from 'express';
import { computeRiskHistogram, computePriorityDistribution } from '../services/analyticsService';
import { getTopSHAPFeatures } from '../services/shapService';
import { sendSuccess } from '../middleware/errorHandler';
import type { AnalyticsData } from '../types/index';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const riskHistogram = computeRiskHistogram();
    const priorityDistribution = computePriorityDistribution();
    const shapFeatureImportance = getTopSHAPFeatures();

    const data: AnalyticsData = {
      riskHistogram,
      priorityDistribution,
      shapFeatureImportance,
    };

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

export default router;
