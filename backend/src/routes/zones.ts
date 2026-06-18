import { Router, Request, Response, NextFunction } from 'express';
import { getById, getTopZones, filterZones } from '../services/zoneService';
import { AppError, sendSuccess } from '../middleware/errorHandler';
import { validateInteger, validateEnum } from '../middleware/validation';
import type { PriorityLevel } from '../types/index';

const router = Router();

const VALID_LEVELS: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { min_risk, level } = req.query;

    const hasMinRisk = min_risk !== undefined && min_risk !== '';
    const hasLevel = level !== undefined && level !== '';

    if (!hasMinRisk && !hasLevel) {
      const zones = getTopZones(200);
      return sendSuccess(res, zones);
    }

    let minRisk: number | undefined;
    if (hasMinRisk) {
      minRisk = validateInteger(min_risk, 0, 100, 'min_risk');
    }

    let levels: PriorityLevel[] | undefined;
    if (hasLevel) {
      const levelStr = level as string;
      const parts = levelStr.split(',').map((s) => s.trim());
      for (const part of parts) {
        validateEnum(part, VALID_LEVELS, 'level');
      }
      levels = parts as PriorityLevel[];
    }

    const zones = filterZones(minRisk, levels);
    sendSuccess(res, zones);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const zone = getById(id);

    if (!zone) {
      throw new AppError(404, 'ZONE_NOT_FOUND', `Zone with id '${id}' not found`);
    }

    sendSuccess(res, zone);
  } catch (err) {
    next(err);
  }
});

export default router;
