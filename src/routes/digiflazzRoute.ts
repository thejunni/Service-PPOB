import {
  digiflazzCallback,
  fetchPriceList,
  getDigiflazzBalance,
} from "../controllers/digiflazzController";
import { authenticate } from "../middleware/authMiddleware";
import { Router } from "express";

const router = Router();

router.get("/digiflazz/pricelist", authenticate, fetchPriceList);
router.get("/balance", getDigiflazzBalance);
export default router;
