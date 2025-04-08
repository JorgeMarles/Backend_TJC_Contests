import { Router } from 'express';
import { ContestController } from '../controllers/ContestController';
import { ContestService } from '../services/contest.service';

const router = Router();
const contestService = new ContestService();
const contestController = new ContestController(contestService);


router.get('/', (req, res) => {
    if (req.query.q) {
        return contestController.searchContests(req, res);
    }
    return contestController.getAllContests(req, res);
});

router.get('/:id', (req, res) => contestController.getContestById(req, res));
router.post('/', (req, res) => contestController.createContest(req, res));
router.put('/', (req, res) => contestController.updateContest(req, res));
export default router;


