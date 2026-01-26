import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";

type Mode = "number" | "word";

const DIGIT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

interface Props {
  onBack: () => void;
}

export default function MemoryDialer({ onBack }: Props) {
  const [level, setLevel] = useState(1);
  const [mode, setMode] = useState<Mode>("number");
  const [target, setTarget] = useState("");
  const [targetWords, setTargetWords] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showTarget, setShowTarget] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [pressTimes, setPressTimes] = useState<number[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelResult, setLevelResult] = useState<
    "correct" | "incorrect" | null
  >(null);
  const { username, isAuthenticated } = useAuth();
  const generateSequence = (lvl: number) =>
    Array.from({ length: lvl + 3 }, () => Math.floor(Math.random() * 10)).join(
      "",
    );

  const buildWords = (digits: string) =>
    digits
      .split("")
      .map((d) => DIGIT_WORDS[+d])
      .join(" ");

  useEffect(() => {
    if (level > 3) setMode("word");
  }, [level]);

  const startLevel = () => {
    const seq = generateSequence(level);
    setTarget(seq);
    setTargetWords(buildWords(seq));
    setUserInput("");
    setPressTimes([]);
    setLevelResult(null);
    setShowTarget(true);

    const displayTime = mode === "word" ? 4000 : 2500;

    setTimeout(() => {
      setShowTarget(false);
      setStartTime(Date.now());
    }, displayTime);
  };

  const pressKey = (digit: string) => {
    if (showTarget || gameComplete) return;

    setPressTimes((prev) => [...prev, Date.now()]);
    const newInput = userInput + digit;
    setUserInput(newInput);

    if (newInput.length === target.length) {
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const correct = target
        .split("")
        .filter((d, i) => d === newInput[i]).length;

      const accuracy = (correct / target.length) * 100;
      const incorrectOrder = newInput !== target;

      const rts = pressTimes.map((t, i) =>
        i === 0 ? t - startTime : t - pressTimes[i - 1],
      );

      setLogs((prev) => [
        ...prev,
        {
          Level: level,
          Mode: mode,
          SequenceLength: target.length,
          Accuracy: accuracy.toFixed(2),
          TotalRecallTimeMs: totalTime,
          ReactionTimes: rts.join("|"),
          ErrorPattern: incorrectOrder ? "Incorrect Order" : "None",
        },
      ]);

      setLevelResult(accuracy === 100 ? "correct" : "incorrect");

      setTimeout(() => {
        if (level === 5) {
          setGameComplete(true);
          setShowConfetti(true);
        } else {
          setLevel(level + 1);
        }
      }, 1200);
    }
  };

  useEffect(() => {
    if (gameComplete) {
      submitMemoryDialerResult();
    }
  }, [gameComplete]);

  async function submitMemoryDialerResult() {
    if (!isAuthenticated || !username || logs.length === 0) {
      console.warn("Skipping Memory Dialer logging");
      return;
    }

    const levelsCompleted = logs.length;

    const avgAccuracy =
      logs.reduce((s, l) => s + Number(l.Accuracy), 0) / levelsCompleted;

    const avgReactionTime =
      logs.reduce((s, l) => {
        const rts = l.ReactionTimes.split("|").map(Number);
        return s + rts.reduce((a: number, b: number) => a + b, 0) / rts.length;
      }, 0) / levelsCompleted;

    const avgRecallTime =
      logs.reduce((s, l) => s + l.TotalRecallTimeMs, 0) / levelsCompleted;

    const errorRate =
      logs.filter((l) => l.ErrorPattern !== "None").length / levelsCompleted;

    try {
      await fetch("http://192.168.1.4:4000/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: username,
          gameKey: "memory_dialer",
          gameResult: {
            levels_completed: levelsCompleted,
            avg_accuracy: Number(avgAccuracy.toFixed(3)),
            avg_reaction_time_ms: Number(avgReactionTime.toFixed(2)),
            avg_total_recall_time_ms: Number(avgRecallTime.toFixed(2)),
            error_rate: Number(errorRate.toFixed(3)),
            completed: true,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to save Memory Dialer result", err);
    }
  }

  // const downloadCSV = () => {
  //   const headers = Object.keys(logs[0]).join(",");
  //   const rows = logs.map((l) => Object.values(l).join(",")).join("\n");
  //   const csv = headers + "\n" + rows;

  //   const blob = new Blob([csv], { type: "text/csv" });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "MemoryDialer_Report.csv";
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // };

  return (
    <ImageBackground
      source={{
        uri: "https://wallpapers.com/images/hd/brown-aesthetic-monstera-leaves-laptop-99yqqgos8tbywqwk.jpg",
      }}
      style={styles.bg}
    >
      {showConfetti && <Confetti />}

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>⬅ Back to Menu</Text>
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${(level / 5) * 100}%` }]}
          />
        </View>

        <Text style={styles.title}>📞 Memory Dialer</Text>
        <Text style={styles.subtitle}>
          Level {level}/5 • {mode.toUpperCase()} MODE
        </Text>

        {showTarget && (
          <View style={styles.targetBox}>
            <Text style={styles.targetText}>
              {mode === "number" ? target : targetWords}
            </Text>
          </View>
        )}

        {levelResult && (
          <Text
            style={[
              styles.resultText,
              { color: levelResult === "correct" ? "#2e7d32" : "#c62828" },
            ]}
          >
            {levelResult === "correct" ? "✅ Correct" : "❌ Incorrect"}
          </Text>
        )}

        {!gameComplete && (
          <TouchableOpacity style={styles.startBtn} onPress={startLevel}>
            <Text style={styles.btnText}>Start Level</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.input}>{userInput}</Text>

        <View
          style={[styles.keypad, showTarget && { opacity: 0.3 }]}
          pointerEvents={showTarget ? "none" : "auto"}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
            <TouchableOpacity
              key={d}
              style={styles.key}
              onPress={() => pressKey(d)}
            >
              <Text style={styles.keyText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {gameComplete && (
          <View style={styles.resultBox}>
            <Text style={styles.finalTitle}>🎉 Game Completed</Text>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { alignItems: "center", paddingBottom: 40 },
  backBtn: { alignSelf: "flex-start", margin: 12 },
  backText: { color: "#efebe9", fontWeight: "600" },

  progressBar: {
    width: "90%",
    height: 8,
    backgroundColor: "#3e2723",
    borderRadius: 6,
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#a1887f",
    borderRadius: 6,
  },

  title: { fontSize: 30, fontWeight: "bold", color: "#efebe9", marginTop: 10 },
  subtitle: { fontSize: 16, color: "#d7ccc8", marginBottom: 10 },

  targetBox: {
    backgroundColor: "#bcaaa4",
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },
  targetText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3e2723",
    textAlign: "center",
  },

  startBtn: {
    backgroundColor: "#4e342e",
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  btnText: { color: "#fff", fontWeight: "700" },

  input: { fontSize: 24, color: "#efebe9", marginVertical: 10 },

  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 260,
    justifyContent: "center",
  },
  key: {
    backgroundColor: "#5d4037",
    width: 60,
    height: 60,
    margin: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: 20, color: "#fff", fontWeight: "bold" },

  resultText: { fontSize: 16, marginVertical: 6 },
  resultBox: {
    backgroundColor: "#efebe9",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    width: "90%",
  },
  finalTitle: { fontSize: 18, fontWeight: "bold", color: "#4e342e" },
});
