import { fetchPriceList } from "../controllers/digiflazzController";
import { authenticate } from "../middleware/authMiddleware";
import { Router } from "express";


const router = Router();

router.get("/digiflazz/pricelist", authenticate, fetchPriceList);

export default router;
