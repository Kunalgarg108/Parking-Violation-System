import { Router, Request, Response, NextFunction } from 'express';
import { getRepeatOffenders } from '../services/repeatOffenderService';
import { sendSuccess } from '../middleware/errorHandler';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page, pageSize, sortOrder } = req.query;
    const result = getRepeatOffenders({
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
