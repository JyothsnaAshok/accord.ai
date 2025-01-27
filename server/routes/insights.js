import express from "express";
import * as insightController from "../controllers/insights.js";

const router = express.Router();

router.post("/ongoing", insightController.getDraftAgreementInsights);
router.post("/active", insightController.getOnGoingAgreementInsights);
router.post("/expired", insightController.getExpiredAgreementInsights);
router.post("/upload", insightController.uploadFileToGemini);

export { router as insightsRouter };
