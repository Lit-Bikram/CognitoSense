import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const CSV_PATH = path.join(__dirname, "../../data/cognito_sense_master.csv");

export const HEADERS = [
  "user_id",
  "email",
  "name",
  "questionnaire_response",
  "games_response",
  "eye_tracking_response", // ✅ NEW
  "q_total_score",
  "target_risk_class",
  "q_completed_at",
  "created_at",
  "last_updated",
];


function ensureCSV() {
  if (!fs.existsSync(CSV_PATH)) {
    fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
    fs.writeFileSync(CSV_PATH, stringify([], { header: true, columns: HEADERS }));
  }
}

function readRows(): any[] {
  ensureCSV();
  const content = fs.readFileSync(CSV_PATH, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
  });
}

function writeRows(rows: any[]) {
  const output = stringify(rows, {
    header: true,
    columns: HEADERS,
  });
  fs.writeFileSync(CSV_PATH, output);
}

/* ================= QUESTIONNAIRE ================= */

export function saveQuestionnaire(data: {
  userId: string;
  email: string;
  name: string;
  questionnaireResponse: any;
  totalScore: number;
  targetClass: number;
}) {
  const rows = readRows();
  const now = new Date().toISOString();

  let row = rows.find((r) => r.user_id === data.userId);

  if (!row) {
    row = {
      user_id: data.userId,
      email: data.email,
      name: data.name,
      questionnaire_response: JSON.stringify(data.questionnaireResponse),
      games_response: "",
      q_total_score: data.totalScore,
      target_risk_class: data.targetClass,
      q_completed_at: now,
      created_at: now,
      last_updated: now,
    };
    rows.push(row);
  } else {
    row.questionnaire_response = JSON.stringify(data.questionnaireResponse);
    row.q_total_score = data.totalScore;
    row.target_risk_class = data.targetClass;
    row.q_completed_at = now;
    row.last_updated = now;
  }

  writeRows(rows);
}

/* ================= GAMES ================= */

export function saveGameResult(params: {
  userId: string;
  gameKey: "laundry_sorter" | "memory_dialer" | "money_manager" | "shopping_list_recall";
  gameResult: any;
}) {
  const rows = readRows();
  const now = new Date().toISOString();

  const row = rows.find((r) => r.user_id === params.userId);
  if (!row) throw new Error("User not found");

  let games = {
    laundry_sorter: null,
    memory_dialer: null,
    money_manager: null,
    shopping_list_recall: null,
  };

  if (row.games_response) {
    games = JSON.parse(row.games_response);
  }

  games[params.gameKey] = params.gameResult;

  row.games_response = JSON.stringify(games);
  row.last_updated = now;

  writeRows(rows);
}

/* ================= EYE-TRACKING ================= */

export function updateEyeTrackingCSV(userId: string, eyeTrackingResult: any) {
  const rows = readRows(); // ✅ use your existing parser
  const now = new Date().toISOString();

  const row = rows.find((r) => r.user_id === userId);

  if (!row) {
    console.log("❌ User not found in CSV:", userId);
    return;
  }

  row.eye_tracking_response = JSON.stringify(eyeTrackingResult);
  row.last_updated = now;

  writeRows(rows); // ✅ safe stringify

  console.log("✅ Eye tracking data written to CSV");
}
