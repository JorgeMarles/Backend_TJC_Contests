import { Router } from "express";
import { authenticate } from "../middleware/authenticateToken";
import { enrollContest, unenrollContest } from "../controllers/ParticipationController";


const router = Router();

router.post("/:id/enroll", authenticate(["user", "admin"]), enrollContest);
router.delete("/:id/enroll", authenticate(["user", "admin"]), unenrollContest);

export default router;