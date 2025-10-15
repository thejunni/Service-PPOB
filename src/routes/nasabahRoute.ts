import { Router } from "express";
import {
  getAllNasabah,
  getNasabahById,
  createNasabah,
  updateNasabah,
  deleteNasabah,
} from "../controllers/nasabahController";

const router = Router();

router.get("/", getAllNasabah);
router.get("/:id", getNasabahById);
router.post("/", createNasabah);
router.put("/:id", updateNasabah);
router.delete("/:id", deleteNasabah);

export default router;
