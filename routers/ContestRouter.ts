import { Router } from 'express';
import { create, find, findOne, update } from '../controllers/ContestController';
import { authenticate } from '../middleware/authenticateToken';

const router = Router();

router.get('/', authenticate(['user', 'admin']), find);
router.get('/:id', authenticate(['user', 'admin']), findOne);
router.post('/', authenticate(['user', 'admin']), create);
router.put('/', authenticate(['user', 'admin']), update);
export default router;


