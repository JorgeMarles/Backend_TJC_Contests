import { Router } from "express";
import { authenticate } from "../middleware/authenticateToken";
import { createProblem } from "../services/ProblemService";


const router = Router();+

router.post("/problem", authenticate(["service"]), createProblem);

export default router;