import { Router } from "express";
import { saveQuestionnaire } from "../datastore/csvStore";

const router = Router();

router.post("/", (req, res) => {
  try {
    console.log("✅ Questionnaire API hit");
    console.log("📦 Body received:", req.body);

    saveQuestionnaire(req.body);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving questionnaire:", error);
    res.status(500).json({ error: "Failed to save questionnaire" });
  }
});

export default router;
