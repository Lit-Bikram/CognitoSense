import React, { CSSProperties, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
const ITEMS = [
  { title: "Rent", cost: 12000, must: true },
  { title: "Electricity Bill", cost: 3500, must: true },
  { title: "Groceries", cost: 4500, must: true },
  { title: "Medicine", cost: 2500, must: true },
  { title: "Internet Bill", cost: 1500, must: true },
  { title: "Movie Tickets", cost: 800, must: false },
  { title: "New Shoes", cost: 3500, must: false },
  { title: "Restaurant Dinner", cost: 2000, must: false },
  { title: "Gaming Subscription", cost: 500, must: false },
  { title: "Gym Membership", cost: 1200, must: false },
];

type MoneyLog = {
  item: string;
  cost: number;
  must: boolean;
  choice: "pay" | "skip";
  reactionTime: number;
  overBudget: boolean;
};

export default function MoneyManager({ onBack }: { onBack?: () => void } = {}) {
  const [budget] = useState(25000);
  const [spent, setSpent] = useState(0);
  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState<MoneyLog[]>([]);
  const [lastTime, setLastTime] = useState(Date.now());
  const [gameStarted, setGameStarted] = useState(false);
  const { username, isAuthenticated } = useAuth();
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  const item = ITEMS[index];

  const handleDecision = (pay: boolean) => {
    if (!item) return;
    const now = Date.now();
    const rt = (now - lastTime) / 1000;

    let newSpent = spent;
    let error = false;

    if (pay && spent + item.cost <= budget) {
      newSpent += item.cost;
    } else if (pay) {
      error = true;
    }

    const isCorrectDecision =
      (item.must && pay && !error) || (!item.must && !pay);

    if (isCorrectDecision) {
      setCorrect((c) => c + 1);
    } else {
      setWrong((w) => w + 1);
    }

    setLogs((prev) => [
      ...prev,
      {
        item: item.title,
        cost: item.cost,
        must: item.must,
        choice: pay ? "pay" : "skip",
        reactionTime: +rt.toFixed(2),
        overBudget: error,
      },
    ]);

    setSpent(newSpent);
    setLastTime(now);
    setIndex((prev) => prev + 1);
  };


  const resetGame = () => {
    setSpent(0);
    setIndex(0);
    setLogs([]);
    setLastTime(Date.now());
    setGameStarted(true);
  };

  const backToMenu = () => {
    setSpent(0);
    setIndex(0);
    setLogs([]);
    setLastTime(Date.now());
    setGameStarted(false);
  };

  const handleBack = () => {
    try {
      if (typeof onBack === "function") {
        onBack();
        return;
      }
    } catch (err) {
      // ignore and fallback
    }
    backToMenu();
  };
  const gameOver = index >= ITEMS.length;

  async function submitMoneyManagerResult(
    username: string,
    logs: MoneyLog[],
    correct: number,
    wrong: number,
    isAuthenticated: boolean
  ) {
    if (!isAuthenticated || !username) {
      console.warn("User not authenticated, skipping money manager logging");
      return;
    }

    const totalAttempts = logs.length;

    const avgReactionTime =
      totalAttempts > 0
        ? logs.reduce((s, l) => s + l.reactionTime, 0) / totalAttempts
        : 0;

    const overBudgetCount = logs.filter((l) => l.overBudget).length;

    try {
      await fetch("http://192.168.1.4:4000/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: username,
          gameKey: "money_manager",
          gameResult: {
            total_attempts: totalAttempts,
            correct,
            wrong,
            accuracy:
              totalAttempts > 0
                ? Number((correct / totalAttempts).toFixed(3))
                : 0,
            avg_reaction_time_sec: Number(avgReactionTime.toFixed(3)),
            over_budget_count: overBudgetCount,
            completed: true,
          },
        }),
      });

      console.log("✅ Money Manager result saved");
    } catch (err) {
      console.error("❌ Failed to save Money Manager result", err);
    }
  }

  useEffect(() => {
    if (gameOver && logs.length > 0) {
      submitMoneyManagerResult(username!, logs, correct, wrong, isAuthenticated);
    }
  }, [gameOver]);
  
  // Main Menu
  if (!gameStarted) {
    return (
      <div style={styles.container}>
        <div style={styles.overlay} />
        <div style={styles.menuContent}>
          <button style={styles.backButtonTop} onClick={handleBack}>
            ← Back to Main Menu
          </button>
          <h1 style={styles.mainTitle}>₹ Money Manager</h1>
          <p style={styles.subtitle}>Test Your Budgeting Skills</p>

          <div style={styles.infoCard}>
            <h2 style={styles.infoTitle}>Game Rules</h2>
            <ul style={styles.rulesList}>
              <li>You have a budget of ₹25,000</li>
              <li>
                Pay all{" "}
                <span style={{ color: "#d32f2f", fontWeight: "bold" }}>
                  Important
                </span>{" "}
                bills to win
              </li>
              <li>
                Choose wisely with{" "}
                <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                  Optional
                </span>{" "}
                expenses
              </li>
              <li>Don't go over budget!</li>
            </ul>
          </div>

          <button style={styles.startButton} onClick={resetGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }
  
  // Results Screen
  if (!item) {
    const mustTotal = logs.filter((l) => l.must).length;
    const optionalTotal = logs.filter((l) => !l.must).length;
    const mustPaid = logs.filter(
      (l) => l.must && l.choice === "pay" && !l.overBudget,
    ).length;
    const mustSkipped = logs.filter(
      (l) => l.must && l.choice === "skip",
    ).length;
    const optionalPaid = logs.filter(
      (l) => !l.must && l.choice === "pay" && !l.overBudget,
    ).length;
    const optionalSkipped = logs.filter(
      (l) => !l.must && l.choice === "skip",
    ).length;
    const overBudgetCount = logs.filter((l) => l.overBudget).length;
    const avgRt = logs.length
      ? +(
          logs.reduce((sum, l) => sum + l.reactionTime, 0) / logs.length
        ).toFixed(2)
      : 0;

    const perfectMust = mustPaid === mustTotal && mustSkipped === 0;
    const noBudgetErrors = overBudgetCount === 0;
    let performanceMessage = "";

    if (perfectMust && noBudgetErrors && budget - spent <= 1000) {
      performanceMessage =
        "🏆 Perfect! You paid all important bills and managed your budget wisely!";
    } else if (perfectMust && noBudgetErrors) {
      performanceMessage =
        "✅ Great job! All important bills paid and no overspending!";
    } else if (mustSkipped > 0) {
      performanceMessage =
        "⚠️ Warning: You skipped " + mustSkipped + " important bill(s)!";
    } else if (overBudgetCount > 0) {
      performanceMessage =
        "❌ You went over budget " + overBudgetCount + " time(s)!";
    }

    return (
      <div style={styles.container}>
        <div style={styles.overlay} />
        <div style={styles.resultsContent}>
          <button style={styles.backButtonTop} onClick={handleBack}>
            ← Back to Main Menu
          </button>

          <h1 style={styles.header}>Game Results</h1>

          {performanceMessage && (
            <div style={styles.performanceCard}>
              <p style={styles.performanceText}>{performanceMessage}</p>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.resultRow}>
              <span>Budget:</span>
              <span style={styles.bold}>₹{budget}</span>
            </div>
            <div style={styles.resultRow}>
              <span>Total Spent:</span>
              <span style={styles.bold}>₹{spent}</span>
            </div>
            <div style={styles.resultRow}>
              <span>Budget Left:</span>
              <span
                style={{
                  ...styles.bold,
                  color: budget - spent < 0 ? "#d32f2f" : "#2e7d32",
                }}
              >
                ₹{budget - spent}
              </span>
            </div>
            <div style={styles.resultRow}>
              <span>Avg Reaction Time:</span>
              <span style={styles.bold}>{avgRt}s</span>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Decision Summary</h3>
            <div style={styles.resultRow}>
              <span>Important Items:</span>
              <span>{mustTotal}</span>
            </div>
            <div style={styles.resultRow}>
              <span>✓ Paid Important:</span>
              <span
                style={{
                  color: mustPaid === mustTotal ? "#2e7d32" : "#d32f2f",
                  fontWeight: "bold",
                }}
              >
                {mustPaid}
              </span>
            </div>
            <div style={styles.resultRow}>
              <span>✗ Skipped Important:</span>
              <span
                style={{
                  color: mustSkipped > 0 ? "#d32f2f" : "#666",
                  fontWeight: mustSkipped > 0 ? "bold" : "normal",
                }}
              >
                {mustSkipped}
              </span>
            </div>
            <div style={styles.resultRow}>
              <span>Optional Items:</span>
              <span>{optionalTotal}</span>
            </div>
            <div style={styles.resultRow}>
              <span>Paid Optional:</span>
              <span>{optionalPaid}</span>
            </div>
            <div style={styles.resultRow}>
              <span>Skipped Optional:</span>
              <span>{optionalSkipped}</span>
            </div>
            <div style={styles.resultRow}>
              <span>Over Budget Attempts:</span>
              <span
                style={{
                  color: overBudgetCount > 0 ? "#d32f2f" : "#2e7d32",
                  fontWeight: "bold",
                }}
              >
                {overBudgetCount}
              </span>
            </div>
          </div>

          {logs.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Detailed Log</h3>
              <div style={styles.logContainer}>
                {logs.map((l, i) => (
                  <div key={i} style={styles.logRow}>
                    <span style={styles.logNumber}>{i + 1}.</span>
                    <span style={styles.logItem}>{l.item}</span>
                    <span style={styles.logCost}>₹{l.cost}</span>
                    <span
                      style={{
                        ...styles.logBadge,
                        backgroundColor: l.must ? "#ffebee" : "#e3f2fd",
                        color: l.must ? "#d32f2f" : "#1976d2",
                      }}
                    >
                      {l.must ? "Important" : "Optional"}
                    </span>
                    <span
                      style={{
                        ...styles.logBadge,
                        backgroundColor:
                          l.choice === "pay" ? "#e8f5e9" : "#fafafa",
                        color: l.choice === "pay" ? "#2e7d32" : "#666",
                      }}
                    >
                      {l.choice.toUpperCase()}
                    </span>
                    {l.overBudget && (
                      <span
                        style={{
                          ...styles.logBadge,
                          backgroundColor: "#ffebee",
                          color: "#d32f2f",
                        }}
                      >
                        Over Budget
                      </span>
                    )}
                    <span style={styles.logTime}>{l.reactionTime}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.buttonRow}>
            {/* <button style={styles.downloadButton} onClick={downloadCSV}>
              📥 Download CSV Report
            </button> */}
            <button style={styles.button} onClick={resetGame}>
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  const remaining = budget - spent;
  const canAfford = remaining >= item.cost;

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.gameContent}>
        <button style={styles.backButtonTop} onClick={handleBack}>
          ← Back to Main Menu
        </button>

        <h1 style={styles.header}>Money Manager</h1>

        <div style={styles.statusBar}>
          <div style={styles.budgetDisplay}>
            <span style={styles.budgetLabel}>Budget Left:</span>
            <span style={styles.budgetAmount}>₹{remaining}</span>
          </div>
          <div style={styles.progressDisplay}>
            Item {index + 1} of {ITEMS.length}
          </div>
        </div>

        <div style={styles.itemCard}>
          <h2 style={styles.itemTitle}>{item.title}</h2>
          <p style={styles.itemCost}>Cost: ₹{item.cost}</p>
          <div
            style={{
              ...styles.priorityBadge,
              backgroundColor: item.must ? "#ffebee" : "#e3f2fd",
              color: item.must ? "#d32f2f" : "#1976d2",
            }}
          >
            {item.must ? "⚠️ Important" : "🎯 Optional"}
          </div>
          {!canAfford && (
            <p style={styles.warningText}>⚠️ Not enough budget remaining!</p>
          )}
        </div>

        <p style={styles.hintText}>
          {item.must
            ? "Important bills must be paid to avoid penalties!"
            : "Think carefully - can you afford this optional expense?"}
        </p>

        <div style={styles.buttonRow}>
          <button style={styles.payButton} onClick={() => handleDecision(true)}>
            ✓ Pay
          </button>
          <button
            style={styles.skipButton}
            onClick={() => handleDecision(false)}
          >
            ✗ Skip
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#3d5a1f",
    backgroundImage: `
      url("data:image/svg+xml,%3Csvg width='600' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='noteGrad' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%23e8dcc3;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23d4c5a9;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cg opacity='0.25'%3E%3Crect x='50' y='30' width='500' height='240' rx='15' fill='url(%23noteGrad)' stroke='%23a0826d' stroke-width='3'/%3E%3Crect x='60' y='40' width='480' height='220' rx='10' fill='none' stroke='%23b8956f' stroke-width='2' stroke-dasharray='5,5'/%3E%3Ctext x='300' y='120' font-size='120' fill='%23c9a961' text-anchor='middle' font-weight='bold' font-family='serif' opacity='0.5'%3E₹%3C/text%3E%3Ctext x='300' y='200' font-size='24' fill='%238b7355' text-anchor='middle' font-family='serif' font-weight='600'%3ERESERVE BANK OF INDIA%3C/text%3E%3Ctext x='140' y='80' font-size='36' fill='%23a0826d' font-family='serif' font-weight='bold'%3E500%3C/text%3E%3Ctext x='460' y='80' font-size='36' fill='%23a0826d' font-family='serif' font-weight='bold'%3E500%3C/text%3E%3Ccircle cx='120' cy='150' r='40' fill='none' stroke='%23c9a961' stroke-width='3'/%3E%3Ctext x='120' y='160' font-size='35' fill='%23a0826d' text-anchor='middle' font-weight='bold'%3E₹%3C/text%3E%3Cg transform='translate(480, 150)'%3E%3Ccircle cx='0' cy='0' r='35' fill='none' stroke='%23c9a961' stroke-width='2.5'/%3E%3Cline x1='0' y1='-30' x2='0' y2='30' stroke='%23a0826d' stroke-width='2'/%3E%3Cline x1='-30' y1='0' x2='30' y2='0' stroke='%23a0826d' stroke-width='2'/%3E%3Cline x1='-21' y1='-21' x2='21' y2='21' stroke='%23a0826d' stroke-width='1.5'/%3E%3Cline x1='21' y1='-21' x2='-21' y2='21' stroke='%23a0826d' stroke-width='1.5'/%3E%3Ccircle cx='0' cy='0' r='8' fill='%23a0826d'/%3E%3C/g%3E%3Ctext x='300' y='240' font-size='14' fill='%238b7355' text-anchor='middle' font-family='monospace' opacity='0.7'%3EGOVERNOR • PROMISE TO PAY • BHARATIYA%3C/text%3E%3Ctext x='100' y='260' font-size='16' fill='%23a0826d' font-family='serif' font-style='italic'%3EBharat%3C/text%3E%3Cpath d='M 70 50 Q 75 45 80 50' stroke='%23c9a961' fill='none' stroke-width='2'/%3E%3Cpath d='M 520 50 Q 515 45 510 50' stroke='%23c9a961' fill='none' stroke-width='2'/%3E%3C/g%3E%3Cg opacity='0.15' transform='translate(-100, -50) rotate(15)'%3E%3Crect x='50' y='30' width='300' height='140' rx='10' fill='%23d4c5a9' stroke='%23a0826d' stroke-width='2'/%3E%3Ctext x='200' y='110' font-size='70' fill='%23c9a961' text-anchor='middle' font-weight='bold'%3E₹%3C/text%3E%3C/g%3E%3C/svg%3E"),
      linear-gradient(135deg, rgba(85, 107, 47, 0.75) 0%, rgba(107, 142, 35, 0.7) 50%, rgba(128, 128, 0, 0.75) 100%)
    `,
    backgroundSize: "600px 300px, cover",
    backgroundPosition: "center",
    backgroundRepeat: "repeat",
    padding: "15px",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflowY: "auto",
  } as CSSProperties,
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
    radial-gradient(circle at 15% 25%, rgba(218, 165, 32, 0.2) 0%, transparent 35%),
    radial-gradient(circle at 85% 75%, rgba(255, 215, 0, 0.15) 0%, transparent 35%),
    radial-gradient(circle at 50% 50%, rgba(201, 169, 97, 0.1) 0%, transparent 50%)
    `,
    pointerEvents: "none",
  },
  menuContent: {
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    padding: "20px 15px 80px",
  },
  gameContent: {
    maxWidth: "500px",
    width: "100%",
    position: "relative",
    zIndex: 1,
    padding: "10px 15px 80px",
  },
  resultsContent: {
    maxWidth: "550px",
    width: "100%",
    position: "relative",
    zIndex: 1,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "10px 15px 80px",
  },
  mainTitle: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "8px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.4)",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#f5f5f5",
    marginBottom: "25px",
    textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
    fontWeight: "400",
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "25px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    backdropFilter: "blur(10px)",
  },
  infoTitle: {
    fontSize: "1.2rem",
    color: "#556B2F",
    marginBottom: "15px",
    fontWeight: "600",
  },
  rulesList: {
    textAlign: "left",
    fontSize: "0.95rem",
    color: "#333",
    lineHeight: "1.7",
    marginLeft: "20px",
  },
  startButton: {
    padding: "14px 40px",
    fontSize: "1.05rem",
    fontWeight: "600",
    backgroundColor: "#6B8E23",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
    transition: "all 0.3s ease",
  },
  header: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: "15px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.4)",
    letterSpacing: "-0.3px",
  },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    padding: "12px 18px",
    borderRadius: "10px",
    marginBottom: "15px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
  },
  budgetDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  budgetLabel: {
    fontSize: "0.75rem",
    color: "#666",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  budgetAmount: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#2e7d32",
  },
  progressDisplay: {
    fontSize: "0.85rem",
    color: "#666",
    fontWeight: "500",
  },
  itemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "15px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  itemTitle: {
    fontSize: "1.4rem",
    color: "#556B2F",
    marginBottom: "10px",
    fontWeight: "700",
  },
  itemCost: {
    fontSize: "1.2rem",
    color: "#333",
    marginBottom: "12px",
    fontWeight: "600",
  },
  priorityBadge: {
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "600",
    marginTop: "8px",
  },
  warningText: {
    color: "#d32f2f",
    fontWeight: "600",
    fontSize: "0.9rem",
    marginTop: "12px",
  },
  hintText: {
    fontSize: "0.85rem",
    color: "#f5f5f5",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: "15px",
    textShadow: "1px 1px 2px rgba(0,0,0,0.4)",
  },
  buttonRow: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "60px",
  },
  payButton: {
    padding: "18px 50px",
    fontSize: "1.3rem",
    fontWeight: "bold",
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    transition: "all 0.2s ease",
    minWidth: "150px",
  },
  skipButton: {
    padding: "18px 50px",
    fontSize: "1.3rem",
    fontWeight: "bold",
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    transition: "all 0.2s ease",
    minWidth: "150px",
  },
  button: {
    padding: "15px 35px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    backgroundColor: "#6B8E23",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
  },
  downloadButton: {
    padding: "15px 35px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    backgroundColor: "#FF8C00",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
  },
  menuButton: {
    backgroundColor: "#556B2F",
  },
  backButtonTop: {
    position: "fixed",
    top: 20,
    left: 20,
    zIndex: 1100,
    padding: "10px 20px",
    fontSize: "1rem",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    color: "#556B2F",
    border: "2px solid #6B8E23",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "15px",
    padding: "25px",
    marginBottom: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  performanceCard: {
    backgroundColor: "rgba(255, 243, 205, 0.95)",
    border: "3px solid #FFA000",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "25px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  performanceText: {
    fontSize: "1.3rem",
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    margin: 0,
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#556B2F",
    marginBottom: "15px",
    fontWeight: "bold",
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
    fontSize: "1.1rem",
  },
  bold: {
    fontWeight: "bold",
  },
  logContainer: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  logRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "12px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    marginBottom: "10px",
    alignItems: "center",
    fontSize: "0.95rem",
  },
  logNumber: {
    fontWeight: "bold",
    color: "#666",
    minWidth: "25px",
  },
  logItem: {
    fontWeight: "600",
    color: "#333",
    flex: "1 1 150px",
  },
  logCost: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
  logBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  logTime: {
    color: "#666",
    fontSize: "0.9rem",
  },
};
