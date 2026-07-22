import express from "express";
import { getHealth, getHome } from "../controllers/healthController.js";

const router = express.Router();

router.get("/", getHome);
router.get("/health", getHealth);

export default router;
