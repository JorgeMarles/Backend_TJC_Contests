import { Router } from 'express';
import { create, find, findOne, update } from '../controllers/ContestController';

const router = Router();

router.get('/', find);
router.get('/:id', findOne);
router.post('/', create);
router.put('/', update);
export default router;


