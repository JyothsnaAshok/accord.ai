import express from "express";
import ESignController from "../controllers/esign.js";

const router = express.Router();

router.post("/triggerFlow", ESignController.createAndSendEnvelope);

export { router as eSignRouter };
