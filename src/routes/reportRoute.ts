import { Router } from "express";
import {
  getTopSellingProducts,
  getRevenueReport,
  getDashboardReport,
} from "../controllers/reportController";

const router = Router();

router.get("/top-products", getTopSellingProducts);
router.get("/revenue", getRevenueReport);
router.get("/dashboard", getDashboardReport);

export default router;
