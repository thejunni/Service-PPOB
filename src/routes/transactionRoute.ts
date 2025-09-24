import { Router } from "express";
import {
  getTransactions,
  createTransaction,
  updateTransactionStatus,
  orderProduct,
} from "../controllers/transactionController";
import { authenticate } from "../middleware/authMiddleware";
import { digiflazzCallback } from "../controllers/digiflazzController";

const router = Router();

router.get("/", getTransactions);
router.post("/", createTransaction);
router.put("/:id/status", updateTransactionStatus);
router.post("/order", authenticate, orderProduct);
router.post("/callback/digiflazz", digiflazzCallback);

export default router;
