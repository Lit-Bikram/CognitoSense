import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";

const COLORS = ['RED', 'GREEN', 'BLUE'];

const COLOR_MAP = {
  RED: '#e74c3c',
  GREEN: '#27ae60',
  BLUE: '#2980b9',
};

// Confetti Component
const Confetti = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 3,
    backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: '-10px',
            width: '10px',
            height: '10px',
            backgroundColor: piece.backgroundColor,
            animation: `fall 3s linear ${piece.animationDelay}s infinite`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default function LaundrySorter({ onBack }: { onBack?: () => void }) {
  const [level, setLevel] = useState(1);
  const [rule, setRule] = useState('WORD');
  const [cloth, setCloth] = useState<any>(null);
  const [finished, setFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { username, isAuthenticated } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);

  const logs = useRef<any[]>([]);
  const lastActionTime = useRef(Date.now());
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  const levelConfig: Record<number, any> = {
    1: { rule: 'WORD', congruentProb: 0.8 },
    2: { rule: 'COLOR', congruentProb: 0.8 },
    3: { rule: 'MIX', congruentProb: 0.5 },
    4: { rule: 'MIX', congruentProb: 0.35 },
    5: { rule: 'MIX', congruentProb: 0.2 },
  };

  const createCloth = (lvl: number) => {
    const cfg = levelConfig[lvl];
    const isCongruent = Math.random() < cfg.congruentProb;
    const word = COLORS[Math.floor(Math.random() * 3)];
    let color;
    if (isCongruent) {
      color = word;
    } else {
      const others = COLORS.filter((c) => c !== word);
      color = others[Math.floor(Math.random() * others.length)];
    }
    return { id: Math.random(), word, color, congruent: isCongruent };
  };

  const nextRound = (currentLevel: number) => {
    if (currentLevel > 5) {
      setFinished(true);
      return;
    }
    const cfg = levelConfig[currentLevel];
    const nextRule = cfg.rule === 'MIX' ? (Math.random() > 0.5 ? 'WORD' : 'COLOR') : cfg.rule;
    setRule(nextRule);
    setCloth(createCloth(currentLevel));
    setDragPos({ x: 0, y: 0 });
    dragOffset.current = { x: 0, y: 0 };
    lastActionTime.current = Date.now();
    setDebugInfo(null);
  };

  useEffect(() => {
    if (gameStarted) {
      nextRound(1);
    }
  }, [gameStarted]);

  useEffect(() => {
    if (finished) {
      submitLaundrySorterResult();
    }
  }, [finished]);


  async function submitLaundrySorterResult() {
    if (!isAuthenticated || !username) {
      console.warn("User not authenticated, skipping game logging");
      return;
    }

    const totalAttempts = logs.current.length;
    const accuracy =
      totalAttempts > 0 ? correct / totalAttempts : 0;

    const avgReactionTime =
      totalAttempts > 0
        ? logs.current.reduce((sum, log) => sum + log.reactionTime_s, 0) /
          totalAttempts
        : 0;

    try {
      await fetch("http://192.168.1.4:4000/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: username,
          gameKey: "laundry_sorter",
          gameResult: {
            total_attempts: totalAttempts,
            correct,
            wrong,
            accuracy: Number(accuracy.toFixed(3)),
            avg_reaction_time_sec: Number(avgReactionTime.toFixed(3)),
            completed: true,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to save Laundry Sorter result", err);
    }
  }

  const handleMouseDown = (e: any) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStart.current = { x: clientX, y: clientY };
    dragOffset.current = { x: dragPos.x, y: dragPos.y };
    setIsDragging(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    
    setDragPos({
      x: dragOffset.current.x + deltaX,
      y: dragOffset.current.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    if (!isDragging || !cloth) return;
    setIsDragging(false);

    const cardEl = cardRef.current;
    if (!cardEl) return;
    
    const cardRect = cardEl.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    let droppedOn = 'NONE';
    
    for (const color of COLORS) {
      const zoneEl = zoneRefs.current[color];
      if (zoneEl) {
        const rect = zoneEl.getBoundingClientRect();
        if (
          cardCenterX >= rect.left &&
          cardCenterX <= rect.right &&
          cardCenterY >= rect.top &&
          cardCenterY <= rect.bottom
        ) {
          droppedOn = color;
          break;
        }
      }
    }

    const correctLabel = rule === 'WORD' ? cloth.word : cloth.color;
    const isCorrect = droppedOn !== 'NONE' && droppedOn === correctLabel;
    const rt = (Date.now() - lastActionTime.current) / 1000;

    const debug = {
      rule: rule,
      word: cloth.word,
      inkColor: cloth.color,
      droppedOn: droppedOn,
      correctAnswer: correctLabel,
      yourAnswer: droppedOn,
      result: isCorrect ? 'CORRECT ✓' : 'WRONG ✗'
    };
    setDebugInfo(debug);

    logs.current.push({
      level,
      rule,
      word: cloth.word,
      inkColor: cloth.color,
      droppedOn,
      correct: isCorrect,
      reactionTime_s: +rt.toFixed(2),
      congruent: cloth.congruent,
    });

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setShowFeedback('correct');
    } else {
      setWrong((w) => w + 1);
      setShowFeedback('wrong');
    }

    setTimeout(() => {
      setShowFeedback(null);
      const nextLevel = level + 1;
      setLevel(nextLevel <= 5 ? nextLevel : 6);
      nextRound(nextLevel);
    }, 2000);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, cloth, rule, level, dragPos]);

  // const csvHeader = 'level,rule,word,inkColor,droppedOn,correct,reactionTime_s,congruent';
  // const csvRows = logs.current
  //   .map((r) => `${r.level},${r.rule},${r.word},${r.inkColor},${r.droppedOn},${r.correct},${r.reactionTime_s},${r.congruent}`)
  //   .join('\n');
  // const csvString = `${csvHeader}\n${csvRows}`;

  // const downloadCSV = () => {
  //   const blob = new Blob([csvString], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `laundry-sorter-results-${new Date().toISOString().slice(0,10)}.csv`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   window.URL.revokeObjectURL(url);
  // };

  const totalAttempts = logs.current.length;
  const accuracy = totalAttempts > 0 ? ((correct / totalAttempts) * 100).toFixed(1) : '0';
  const avgReactionTime = totalAttempts > 0 
    ? (logs.current.reduce((sum, log) => sum + log.reactionTime_s, 0) / totalAttempts).toFixed(2)
    : '0';

  if (finished) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}>
        <Confetti />
        
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '15px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s',
              zIndex: 1000,
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            ← Main Menu
          </button>
        )}
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '35px',
          padding: '60px',
          maxWidth: '700px',
          width: '100%',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          border: '5px solid rgba(138, 101, 185, 0.5)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '100px', marginBottom: '15px' }}>🎉</div>
            <h2 style={{ fontSize: '48px', margin: '0', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900' }}>
              Game Complete!
            </h2>
            <p style={{ fontSize: '18px', color: '#666', marginTop: '10px', fontWeight: '600' }}>
              Well done! Here are your results
            </p>
          </div>
          
          {/* Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '25px',
            marginBottom: '40px'
          }}>
            {/* Correct */}
            <div style={{
              background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
              padding: '30px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(46,204,113,0.4)',
              transform: 'translateY(0)',
              transition: 'transform 0.3s',
            }}>
              <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '5px' }}>{correct}</div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.95)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Correct</div>
            </div>
            
            {/* Wrong */}
            <div style={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              padding: '30px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(231,76,60,0.4)',
            }}>
              <div style={{ fontSize: '50px', marginBottom: '10px' }}>❌</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '5px' }}>{wrong}</div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.95)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Wrong</div>
            </div>

            {/* Accuracy */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '30px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(102,126,234,0.4)',
            }}>
              <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎯</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '5px' }}>{accuracy}%</div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.95)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Accuracy</div>
            </div>

            {/* Avg Reaction Time */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: '30px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(240,147,251,0.4)',
            }}>
              <div style={{ fontSize: '50px', marginBottom: '10px' }}>⚡</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '5px' }}>{avgReactionTime}s</div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.95)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Time</div>
            </div>
          </div>

          {/* Total Attempts */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
            padding: '25px',
            borderRadius: '20px',
            textAlign: 'center',
            marginBottom: '35px',
            border: '3px solid rgba(102,126,234,0.3)',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#667eea', marginBottom: '8px' }}>
              {totalAttempts}
            </div>
            <div style={{ fontSize: '16px', color: '#764ba2', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Total Attempts
            </div>
          </div>
          
          {/* Download Button
          <button
            onClick={downloadCSV}
            style={{
              width: '100%',
              padding: '22px 24px',
              fontSize: '20px',
              fontWeight: '900',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '18px',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.5)',
              transition: 'all 0.3s',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.5)';
            }}
          >
            📥 Download CSV Results
          </button> */}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        backgroundImage:
          'url("https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1600")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "multiply",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        userSelect: "none",
        touchAction: "none",
        position: "relative",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            padding: "12px 24px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "white",
            background: "rgba(0, 0, 0, 0.4)",
            border: "3px solid rgba(255, 255, 255, 0.6)",
            borderRadius: "15px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s",
            zIndex: 1000,
            boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          }}
        >
          ← Main Menu
        </button>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* TITLE */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "48px",
              color: "white",
              margin: "0 0 10px 0",
              textShadow: "3px 3px 6px rgba(0,0,0,0.4)",
              fontWeight: "900",
            }}
          >
            🧺 Laundry Sorter
          </h1>

          {/* START BUTTON */}
          {!gameStarted && (
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => setGameStarted(true)}
                style={{
                  padding: "14px 32px",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "white",
                  background:
                    "linear-gradient(135deg, #ff9f43 0%, #ff6b6b 100%)",
                  border: "none",
                  borderRadius: "14px",
                  cursor: "pointer",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                }}
              >
                ▶ Start Game
              </button>
            </div>
          )}
        </div>

        {/* GAME UI */}
        {gameStarted && (
          <>
            {/* INFO BOX */}
            <div
              style={{
                background: "rgba(255,255,255,0.25)",
                borderRadius: "20px",
                padding: "20px",
                marginBottom: "25px",
                backdropFilter: "blur(10px)",
                border: "3px solid rgba(255,255,255,0.4)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              }}
            >
              <p
                style={{
                  color: "white",
                  fontSize: "22px",
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                Level {level} / 5 • Match by {rule === "WORD" ? "📝 WORD" : "🎨 COLOR"}
              </p>

              <p
                style={{
                  color: "white",
                  textAlign: "center",
                  lineHeight: "1.8",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                {rule === "WORD" ? (
                  <>
                    📝 The word says "<strong>{cloth?.word}</strong>" - Drag to the{" "}
                    <strong>{cloth?.word}</strong> zone!
                  </>
                ) : (
                  <>
                    🎨 The ink color is{" "}
                    <strong style={{ color: COLOR_MAP[cloth?.color] }}>
                      {cloth?.color}
                    </strong>{" "}
                    - Drag to the <strong>{cloth?.color}</strong> zone!
                  </>
                )}
              </p>
            </div>

            {/* SCORE */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "40px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  background: "rgba(46, 213, 115, 0.3)",
                  padding: "12px 28px",
                  borderRadius: "15px",
                  border: "3px solid rgba(46, 213, 115, 0.6)",
                }}
              >
                <span style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
                  ✅ {correct}
                </span>
              </div>

              <div
                style={{
                  background: "rgba(231, 76, 60, 0.3)",
                  padding: "12px 28px",
                  borderRadius: "15px",
                  border: "3px solid rgba(231, 76, 60, 0.6)",
                }}
              >
                <span style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
                  ❌ {wrong}
                </span>
              </div>
            </div>

            {/* DROP ZONES */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                marginBottom: "80px",
                gap: "20px",
              }}
            >
              {COLORS.map((color) => (
                <div
                  key={color}
                  ref={(el) => {
                    zoneRefs.current[color] = el;
                  }}
                  style={{
                    width: "200px",
                    height: "180px",
                    backgroundColor: COLOR_MAP[color],
                    borderRadius: "25px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                    border: "5px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontSize: "36px",
                      fontWeight: "900",
                      textShadow: "3px 3px 6px rgba(0,0,0,0.6)",
                      letterSpacing: "2px",
                    }}
                  >
                    {color}
                  </span>
                </div>
              ))}
            </div>

            {/* DRAGGABLE CARD */}
            {cloth && (
              <div
                ref={cardRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                style={{
                  width: "140px",
                  height: "140px",
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: "25px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  cursor: isDragging ? "grabbing" : "grab",
                  boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
                  position: "relative",
                  transform: `translate(${dragPos.x}px, ${dragPos.y}px)`,
                  transition: isDragging ? "none" : "transform 0.2s",
                  border: "5px solid rgba(255,255,255,0.5)",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: "900",
                    color: COLOR_MAP[cloth.color],
                    textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
                    letterSpacing: "2px",
                  }}
                >
                  {cloth.word}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

}