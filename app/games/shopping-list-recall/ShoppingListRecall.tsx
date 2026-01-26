import { useAuth } from "../../../context/AuthContext";
import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import {
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/* ---------------- TYPES ---------------- */

type LevelMetrics = {
  level: number;
  itemsShown: string[];
  itemsSelected: string[];
  correctCount: number;
  distractorErrors: number;
  recallTimeMs: number;
  hintUses: number;
  selectionOrder: string[];
  reactionTimes: number[];
};

/* ---------------- DATA ---------------- */

const ITEM_POOL = [
  { name: 'Milk', img: 'https://cdn-icons-png.flaticon.com/512/684/684631.png' },
  { name: 'Bread', img: require('../../../assets/images/white-bread.png') },
  { name: 'Eggs', img: 'https://cdn-icons-png.flaticon.com/512/2713/2713474.png' },
  { name: 'Apple', img: 'https://cdn-icons-png.flaticon.com/512/415/415682.png' },
  { name: 'Banana', img: require('../../../assets/images/banana.png') },
  { name: 'Rice', img: require('../../../assets/images/rice.png') },
  { name: 'Cheese', img: require('../../../assets/images/cheese.png') },
  { name: 'Fish', img: require('../../../assets/images/fish.png') },
  { name: 'Chicken', img: require('../../../assets/images/chicken-leg.png') },
  { name: 'Potato', img: require('../../../assets/images/fried-potatoes.png') },
  { name: 'Onion', img: require('../../../assets/images/onion.png') },
  { name: 'Tomato', img: require('../../../assets/images/tomato.png') },
];

/* ---------------- HELPERS ---------------- */

const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

const getImageSource = (img: any) => (typeof img === 'string' ? { uri: img } : img);

// const downloadCSV = (rows: LevelMetrics[]) => {
//   if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
//     console.warn('CSV download not supported on this platform.');
//     return;
//   }

//   const header = Object.keys(rows[0]).join(',');
//   const body = rows
//     .map(r =>
//       Object.values(r)
//         .map(v => `"${Array.isArray(v) ? v.join(' | ') : v}"`)
//         .join(',')
//     )
//     .join('\n');

//   const csv = header + '\n' + body;
//   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//   const url = URL.createObjectURL(blob);

//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'shopping_list_recall_report.csv';
//   a.click();
// };

/* ---------------- COMPONENT ---------------- */

export default function ShoppingListRecall({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] =
    useState<'memorize' | 'recall' | 'result' | 'final'>('memorize');

  const [targets, setTargets] = useState<any[]>([]);
  const [pool, setPool] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [lastCorrect, setLastCorrect] = useState(0);
  const [lastWrong, setLastWrong] = useState(0);
  const [hintItem, setHintItem] = useState<any | null>(null);
  const [hintUses, setHintUses] = useState(0);
  const { username, isAuthenticated } = useAuth();


  const startTime = useRef(0);
  const lastClick = useRef(0);
  const reactionTimes = useRef<number[]>([]);
  const order = useRef<string[]>([]);
  const allMetrics = useRef<LevelMetrics[]>([]);

  /* --------- LEVEL CONFIG --------- */
  const ITEMS_PER_LEVEL = 3 + level;
  const POOL_SIZE = 6 + level * 2;

  /* --------- INIT LEVEL --------- */
  useEffect(() => {
    const t = shuffle(ITEM_POOL).slice(0, ITEMS_PER_LEVEL);
    const rest = ITEM_POOL.filter(i => !t.includes(i));
    const p = shuffle([...t, ...shuffle(rest).slice(0, POOL_SIZE - t.length)]);

    setTargets(t);
    setPool(p);
    setSelected([]);
    setHintItem(null);
    setHintUses(0);
    reactionTimes.current = [];
    order.current = [];
    setPhase('memorize');
  }, [level]);

  /* --------- GAME LOGIC --------- */

  const startRecall = () => {
    startTime.current = Date.now();
    lastClick.current = startTime.current;
    setPhase('recall');
  };

  const selectItem = (name: string) => {
    if (selected.includes(name)) return;
    const now = Date.now();
    reactionTimes.current.push(now - lastClick.current);
    lastClick.current = now;
    order.current.push(name);
    setSelected(prev => [...prev, name]);
  };

  const useHint = () => {
    if (hintUses > 0) return;
    const unselectedCorrect = targets.filter(
      t => !selected.includes(t.name)
    );
    if (unselectedCorrect.length === 0) return;

    setHintItem(unselectedCorrect[0]);
    setHintUses(1);

    setTimeout(() => setHintItem(null), 2000);
  };

  const finishLevel = () => {
    const recallTime = Date.now() - startTime.current;
    const correctItems = targets.map(t => t.name);

    const correctCount = selected.filter(s =>
      correctItems.includes(s)
    ).length;
    const wrongCount = selected.filter(
      s => !correctItems.includes(s)
    ).length;

    setLastCorrect(correctCount);
    setLastWrong(wrongCount);

    allMetrics.current.push({
      level,
      itemsShown: correctItems,
      itemsSelected: selected,
      correctCount,
      distractorErrors: wrongCount,
      recallTimeMs: recallTime,
      hintUses,
      selectionOrder: order.current,
      reactionTimes: reactionTimes.current,
    });

    setPhase('result');
  };

  const nextLevel = () => {
    if (level === 5) setPhase('final');
    else setLevel(l => l + 1);
  };

  async function submitShoppingListResult() {
    if (!isAuthenticated || !username || allMetrics.current.length === 0) {
      console.warn("Skipping Shopping List Recall logging");
      return;
    }

    const levels = allMetrics.current.length;

    const avgAccuracy =
      allMetrics.current.reduce((s, l) => s + l.correctCount / l.itemsShown.length, 0) /
      levels;

    const avgRecallTime =
      allMetrics.current.reduce((s, l) => s + l.recallTimeMs, 0) / levels;

    const avgReactionTime =
      allMetrics.current.reduce((s, l) => {
        if (l.reactionTimes.length === 0) return s;
        const avg = l.reactionTimes.reduce((a, b) => a + b, 0) / l.reactionTimes.length;
        return s + avg;
      }, 0) / levels;

    const totalErrors = allMetrics.current.reduce(
      (s, l) => s + l.distractorErrors,
      0,
    );

    const hintUsageRate =
      allMetrics.current.filter(l => l.hintUses > 0).length / levels;

    try {
      await fetch("http://192.168.1.4:4000/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: username,
          gameKey: "shopping_list_recall",
          gameResult: {
            total_levels: levels,
            avg_accuracy: Number((avgAccuracy * 100).toFixed(3)),
            avg_recall_time_ms: Number(avgRecallTime.toFixed(2)),
            avg_reaction_time_ms: Number(avgReactionTime.toFixed(2)),
            total_errors: totalErrors,
            hint_usage_rate: Number(hintUsageRate.toFixed(3)),
            completed: true,
          },
        }),
      });

      console.log("✅ Shopping List Recall result saved");
    } catch (err) {
      console.error("❌ Failed to save Shopping List Recall result", err);
    }
  }
  useEffect(() => {
    if (phase === "final") {
      submitShoppingListResult();
    }
  }, [phase]);


  /* ---------------- UI ---------------- */

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1587049352851-8d51c4f1f82b',
      }}
      style={styles.bg}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>⬅ Back to Menu</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🛒 Shopping List Recall</Text>
        <Text style={styles.level}>Level {level} / 5</Text>

        {phase === 'memorize' && (
          <>
            <Text style={styles.subtitle}>Memorize these items</Text>
            <View style={styles.grid}>
              {targets.map(i => (
                <View key={i.name} style={styles.card}>
                  <Image source={getImageSource(i.img)} style={styles.img} />
                  <Text style={styles.label}>{i.name}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.btn} onPress={startRecall}>
              <Text style={styles.btnText}>Start Recall</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'recall' && (
          <>
            <Text style={styles.subtitle}>Select remembered items</Text>

            {hintItem && (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>Hint</Text>
                <Image source={getImageSource(hintItem.img)} style={styles.img} />
                <Text style={styles.label}>{hintItem.name}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.hintBtn,
                hintUses > 0 && { opacity: 0.4 },
              ]}
              onPress={useHint}
              disabled={hintUses > 0}
            >
              <Text style={styles.btnText}>Use Hint</Text>
            </TouchableOpacity>

            <FlatList
              data={pool}
              numColumns={2}
              keyExtractor={i => i.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.card,
                    selected.includes(item.name) && styles.selected,
                  ]}
                  onPress={() => selectItem(item.name)}
                >
                  <Image source={getImageSource(item.img)} style={styles.img} />
                  <Text style={styles.label}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.btn} onPress={finishLevel}>
              <Text style={styles.btnText}>Finish Level</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'result' && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={styles.subtitle}>
              {lastWrong === 0 ? '✅ Excellent!' : '⚠️ Review Needed'}
            </Text>
            <Text style={styles.resultText}>✔ Correct: {lastCorrect}</Text>
            <Text style={styles.resultText}>❌ Wrong: {lastWrong}</Text>

            <TouchableOpacity style={styles.btn} onPress={nextLevel}>
              <Text style={styles.btnText}>
                {level === 5 ? 'Finish Game' : 'Next Level'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'final' && (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <Confetti numberOfPieces={350} recycle={false} />

            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
              }}
              style={{ width: 120, height: 120, marginBottom: 20 }}
            />

            <Text style={styles.subtitle}>🏆 Game Completed!</Text>

            {/* <TouchableOpacity
              style={styles.btn}
              onPress={() => downloadCSV(allMetrics.current)}
            >
              <Text style={styles.btnText}>Download CSV Report</Text>
            </TouchableOpacity> */}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: 16 },
  backText: { color: '#fff', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  level: { textAlign: 'center', color: '#f5d7c6', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#fff', marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#5a1e1e',
    borderRadius: 14,
    padding: 10,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  selected: { borderColor: '#f5d7c6', borderWidth: 2 },
  img: { width: 70, height: 70, marginBottom: 6 },
  label: { color: '#fff', fontWeight: '700' },
  btn: {
    backgroundColor: '#7b2c2c',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  hintBtn: {
    backgroundColor: '#8c3b3b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
  hintBox: {
    backgroundColor: '#6b2626',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  hintText: { color: '#ffd7b5', fontWeight: '800', marginBottom: 4 },
  resultText: {
    color: '#f5d7c6',
    fontSize: 16,
    marginVertical: 4,
    fontWeight: '600',
  },
});
