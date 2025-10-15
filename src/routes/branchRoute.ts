import express from "express";
import {
  getAllBranch,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getNasabahByBranch,
} from "../controllers/branchController";

const router = express.Router();

router.get("/", getAllBranch);
router.get("/:id", getBranchById);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);
router.get("/:id/nasabah", getNasabahByBranch);

export default router;
