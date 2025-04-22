import { Router } from "express";
import { authenticate } from "../middleware/authenticateToken";
import { createUser } from "../services/UserService";


const router = Router();

router.post("/user", authenticate(["service"]), createUser);

export default router;