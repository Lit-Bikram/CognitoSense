import { Router } from "express";
import { saveGameResult } from "../datastore/csvStore";

const router = Router();

router.post("/", (req, res) => {
  try {
    const { userId, gameKey, gameResult } = req.body;

    console.log("🎮 Game API hit:", userId, gameKey);

    if (!userId || !gameKey || !gameResult) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    saveGameResult({
      userId,
      gameKey,
      gameResult,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Game save failed", err);
    res.status(500).json({ error: "Failed to save game result" });
  }
});

export default router;
