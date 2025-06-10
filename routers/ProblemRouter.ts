import { Router } from "express";
import { authenticate } from "../middleware/authenticateToken";
import { create } from "../controllers/ProblemController";


const router = Router();+

router.post("/aaaaaskjdbnhebraodcni", authenticate(["service"]), create);

export default router;