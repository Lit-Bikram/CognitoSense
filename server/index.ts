import express from "express";
import cors from "cors";

import questionnaireRoute from "./routes/questionnaire";
import gameRoutes from "./routes/game";
import eyeTrackingRoute from "./routes/eyeTracking";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/api/questionnaire", questionnaireRoute);
app.use("/api/game", gameRoutes);
app.use("/api/eye-tracking", eyeTrackingRoute);

// ✅ Health check (optional but useful)
app.get("/", (req, res) => {
  res.send("✅ CognitoSense Backend is Running");
});

const PORT = 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Backend running on:");
  console.log(`➡ http://localhost:${PORT}`);
  console.log(`➡ http://192.168.1.4:${PORT}`);
});
