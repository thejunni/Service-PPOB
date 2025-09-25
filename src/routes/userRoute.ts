import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUserStatus,
} from "../controllers/userController";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, authorizeAdmin, getUsers);
router.post("/", createUser);
router.put("/:id/status", authenticate, authorizeAdmin, updateUserStatus);
export default router;
