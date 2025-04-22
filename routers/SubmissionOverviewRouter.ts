import { Router } from "express";
import { authenticate } from "../middleware/authenticateToken";
import { findRanking, saveSubmission } from "../controllers/SubmissionOverviewController";

const router = Router();

router.get("/:id/ranking", authenticate(["user", "admin"]), findRanking);
router.post("/submission", authenticate(["service"]), saveSubmission);

export default router;