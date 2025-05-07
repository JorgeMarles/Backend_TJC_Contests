import { Router } from "express";
import { authenticate } from "../middleware/authenticateToken";
import { createUser,stats } from "../services/UserService";


const router = Router();

router.post("/", authenticate(["service"]), createUser);
router.get('/stats', authenticate(['user', 'admin']), stats);//cambiar

export default router;