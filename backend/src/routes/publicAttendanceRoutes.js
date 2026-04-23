import { Router } from "express";
import { getPublicAttendanceSessionController } from "../controllers/publicAttendanceController.js";

const router = Router();

router.get("/:sessionId", getPublicAttendanceSessionController);

export default router;
