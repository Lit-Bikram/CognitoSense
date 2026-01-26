import express from "express";
import { updateEyeTrackingCSV } from "../datastore/csvStore";

const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { userId, eyeTrackingResult } = req.body;

    if (!userId || !eyeTrackingResult) {
      return res.status(400).json({ error: "Missing data" });
    }

    updateEyeTrackingCSV(userId, eyeTrackingResult);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Eye tracking save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
