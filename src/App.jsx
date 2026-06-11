import { useState, useRef } from "react";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

async function callClaude(messages, systemPrompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── Shared UI ──────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 32 }}>
      <div className="spinner" />
      <span style={{ color: "#a78bfa", fontSize: 14, letterSpacing: 2 }}>ANALYZING…</span>
    </div>
  );
}

function UploadBox({ label, onFile, preview, accept = "image/*" }) {
  const ref = useRef();
  return (
    <div
      onClick={() => ref.current.click()}
      style={{
        border: "2px dashed #7c3aed",
        borderRadius: 16,
        padding: 28,
        textAlign: "center",
        cursor: "pointer",
        background: preview ? "transparent" : "#13111a",
        transition: "border-color .2s",
        position: "relative",
        overflow: "hidden",
        minHeight: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      {preview
        ? <img src={preview} alt="preview" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 10, objectFit: "cover" }} />
        : <>
          <div style={{ fontSize: 36 }}>📸</div>
          <div style={{ color: "#a78bfa", fontSize: 14 }}>{label}</div>
          <div style={{ color: "#555", fontSize: 12 }}>Click to upload</div>
        </>}
    </div>
  );
}

function ResultCard({ text }) {
  return (
    <div style={{
      background: "linear-gradient(135deg,#1a1025 60%,#200d3a)",
      border: "1px solid #7c3aed55",
      borderRadius: 16,
      padding: 24,
      marginTop: 20,
      whiteSpace: "pre-wrap",
      lineHeight: 1.7,
      color: "#e2d9f3",
      fontSize: 15,
    }}>
      {text}
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home", label: "🏠 Home" },
  { id: "psl", label: "📊 PSL Rater" },
  { id: "rizz", label: "💬 Rizz Coach" },
  { id: "guide", label: "📖 Guide" },
  { id: "battle", label: "⚔️ Rizz Battle" },
  { id: "tier", label: "🏆 Tier List" },
  { id: "leaderboard", label: "👑 Leaderboard" },
];

// ── PSL RATER ─────────────────────────────────────────────────────────────
function PSLRater({ onScore }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [name, setName] = useState("");

  const handleFile = f => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const b64 = await fileToBase64(file);
      const mediaType = file.type || "image/jpeg";
      const text = await callClaude([{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
          { type: "text", text: "Rate this person's looks on the PSL (Pretty Scale Looksmaxing) scale from 1-10. Give a detailed breakdown with: Overall PSL Score (X/10), Facial Harmony score, Jawline score, Eye area score, Skin quality score, Overall Appeal score. Then give 3 specific looksmaxing tips to improve. Be honest but constructive. Use numbers and emojis. Format it clearly." }
        ]
      }],
        "You are a brutally honest but constructive PSL (looksmaxing community) rating expert. You analyze facial features scientifically using golden ratio principles, facial harmony, and attractiveness research. Give specific numeric scores and actionable advice. Be edgy but never cruel."
      );
      setResult(text);
      if (name && onScore) {
        const match = text.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
        const score = match ? parseFloat(match[1]) : null;
        if (score) onScore({ name, score, date: new Date().toLocaleDateString() });
      }
    } catch (e) {
      setResult("Error analyzing image. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={styles.sectionTitle}>📊 PSL & Appeal Rater</h2>
      <p style={styles.sub}>Upload your photo for an AI-powered looksmaxing analysis</p>
      <input
        placeholder="Your name (for leaderboard)"
        value={name}
        onChange={e => setName(e.target.value)}
        style={styles.input}
      />
      <UploadBox label="Drop your photo here" onFile={handleFile} preview={preview} />
      <button onClick={analyze} disabled={!file || loading} style={styles.btn}>
        {loading ? "Analyzing..." : "🔍 Rate Me"}
      </button>
      {loading && <Loader />}
      {result && <ResultCard text={result} />}
    </div>
  );
}

// ── RIZZ COACH ────────────────────────────────────────────────────────────
function RizzCoach() {
  const [scenario, setScenario] = useState("");
  const [mode, setMode] = useState("opener");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const MODES = [
    { id: "opener", label: "Opening Line" },
    { id: "reply", label: "How to Reply" },
    { id: "date", label: "Ask on Date" },
    { id: "recover", label: "Recover from L" },
  ];

  const ask = async () => {
    setLoading(true);
    try {
      const modeDesc = {
        opener: "Give 5 killer opening lines/conversation starters",
        reply: "Tell me exactly what to reply to keep the conversation going and increase attraction",
        date: "Give me a smooth way to ask her on a date",
        recover: "Help me recover from this situation and regain my rizz",
      }[mode];
      const text = await callClaude([{
        role: "user",
        content: `Situation: ${scenario || "General rizz advice"}\n\nTask: ${modeDesc}`
      }],
        "You are a legendary rizz coach and dating expert. You give real, practical, confident advice for modern dating. Mix charisma psychology with street-smart game. Be direct, edgy, and actually helpful. No cringe pickup lines — give genuine connection-building advice that works."
      );
      setResult(text);
    } catch (e) {
      setResult("Error. Try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={styles.sectionTitle}>💬 Rizz Coach</h2>
      <p style={styles.sub}>Describe your situation and get elite dating advice</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{ ...styles.chip, ...(mode === m.id ? styles.chipActive : {}) }}>
            {m.label}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Describe your situation... (e.g. 'She left me on read for 2 days', 'Met her at the gym', 'She has a boyfriend but flirts with me')"
        value={scenario}
        onChange={e => setScenario(e.target.value)}
        style={{ ...styles.input, height: 100, resize: "vertical" }}
      />
      <button onClick={ask} disabled={loading} style={styles.btn}>
        {loading ? "Coaching..." : "🎯 Get Rizz Advice"}
      </button>
      {loading && <Loader />}
      {result && <ResultCard text={result} />}
    </div>
  );
}

// ── GUIDE ─────────────────────────────────────────────────────────────────
function Guide() {
  const [topic, setTopic] = useState("looksmaxxing");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const TOPICS = [
    { id: "looksmaxxing", label: "💪 Looksmaxxing" },
    { id: "fashion", label: "👔 Style & Fashion" },
    { id: "confidence", label: "🧠 Confidence" },
    { id: "gym", label: "🏋️ Gym Maxxing" },
    { id: "skincare", label: "✨ Skincare" },
    { id: "social", label: "🗣️ Social Skills" },
  ];

  const load = async (t) => {
    setTopic(t);
    setLoading(true);
    try {
      const text = await callClaude([{
        role: "user",
        content: `Give me a comprehensive beginner-to-advanced guide on ${t} for men who want to maximize their attractiveness and confidence. Include specific actionable steps, timelines, and insider tips. Make it structured with clear sections.`
      }],
        "You are an elite men's self-improvement coach. You give no-BS, science-backed, actionable advice on looksmaxing, fitness, fashion, and confidence building. Be specific, direct, and motivating."
      );
      setResult(text);
    } catch (e) {
      setResult("Error loading guide.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={styles.sectionTitle}>📖 Glow-Up Guide</h2>
      <p style={styles.sub}>AI-powered self-improvement guides for every aspect of your game</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {TOPICS.map(t => (
          <button key={t.id} onClick={() => load(t.id)}
            style={{ ...styles.chip, ...(topic === t.id ? styles.chipActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>
      <button onClick={() => load(topic)} disabled={loading} style={styles.btn}>
        {loading ? "Loading..." : "📚 Load Guide"}
      </button>
      {loading && <Loader />}
      {result && <ResultCard text={result} />}
    </div>
  );
}

// ── RIZZ BATTLE ───────────────────────────────────────────────────────────
function RizzBattle() {
  const [p1File, setP1File] = useState(null);
  const [p2File, setP2File] = useState(null);
  const [p1Preview, setP1Preview] = useState(null);
  const [p2Preview, setP2Preview] = useState(null);
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleP1 = f => { setP1File(f); setP1Preview(URL.createObjectURL(f)); setResult(null); };
  const handleP2 = f => { setP2File(f); setP2Preview(URL.createObjectURL(f)); setResult(null); };

  const battle = async () => {
    if (!p1File || !p2File) return;
    setLoading(true);
    try {
      const [b1, b2] = await Promise.all([fileToBase64(p1File), fileToBase64(p2File)]);
      const text = await callClaude([{
        role: "user",
        content: [
          { type: "text", text: `Compare these two people in a Rizz Battle. Person 1 is "${p1Name}" (first image) and Person 2 is "${p2Name}" (second image).` },
          { type: "image", source: { type: "base64", media_type: p1File.type || "image/jpeg", data: b1 } },
          { type: "image", source: { type: "base64", media_type: p2File.type || "image/jpeg", data: b2 } },
          { type: "text", text: "Rate both on: Face Card (looks), Rizz Aura (vibe/energy from photo), Drip (style), Overall Charisma. Give each a score /10. Crown a winner and explain why. Be entertaining and bold." }
        ]
      }],
        "You are an entertaining, bold rizz battle judge. You rate people on their looks, style, and charismatic energy in photos. Be fair, entertaining, and specific. Crown a winner dramatically."
      );
      setResult(text);
    } catch (e) {
      setResult("Error running battle. Try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={styles.sectionTitle}>⚔️ Rizz Battle</h2>
      <p style={styles.sub}>Two photos enter. One winner leaves. AI judges the ultimate rizz showdown.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <input placeholder="Name P1" value={p1Name} onChange={e => setP1Name(e.target.value)} style={{ ...styles.input, marginBottom: 8 }} />
          <UploadBox label="Upload Player 1" onFile={handleP1} preview={p1Preview} />
        </div>
        <div>
          <input placeholder="Name P2" value={p2Name} onChange={e => setP2Name(e.target.value)} style={{ ...styles.input, marginBottom: 8 }} />
          <UploadBox label="Upload Player 2" onFile={handleP2} preview={p2Preview} />
        </div>
      </div>
      <button onClick={battle} disabled={!p1File || !p2File || loading} style={styles.btn}>
        {loading ? "Judging..." : "⚔️ START BATTLE"}
      </button>
      {loading && <Loader />}
      {result && <ResultCard text={result} />}
    </div>
  );
}

// ── RIZZ TIER LIST ────────────────────────────────────────────────────────
function TierList() {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const QUESTIONS = [
    { id: "q1", text: "How do you approach someone you like?", opts: ["Direct and confident", "Indirect / through friends", "Wait for them to approach", "I freeze up"] },
    { id: "q2", text: "What's your texting style?", opts: ["Witty and playful", "Straight to the point", "Overthink every message", "Dry one-word replies"] },
    { id: "q3", text: "How do you handle rejection?", opts: ["Brush it off and move on", "Take it personally but recover", "Dwell on it for days", "Never recovered from it tbh"] },
    { id: "q4", text: "Your social energy?", opts: ["Life of the party", "Smooth in small groups", "Better 1-on-1", "Mostly online"] },
    { id: "q5", text: "How's your fashion sense?", opts: ["Always clean and dripped out", "Decent, could be better", "Functional not fashionable", "What's fashion"] },
    { id: "q6", text: "Eye contact game?", opts: ["Intense and magnetic", "Comfortable and natural", "Shy but improving", "I look at the floor"] },
  ];

  const set = (id, val) => setAnswers(a => ({ ...a, [id]: val }));
  const done = Object.keys(answers).length === QUESTIONS.length;

  const judge = async () => {
    setLoading(true);
    try {
      const summary = QUESTIONS.map(q => `${q.text}: ${answers[q.id]}`).join("\n");
      const text = await callClaude([{
        role: "user",
        content: `Based on these answers, rate this person's overall rizz and assign them a tier:\n\n${summary}\n\nGive: Tier (S/A/B/C/D), Rizz Score /100, Rizz Archetype (e.g. "Silent Menace", "Smooth Operator", "Awkward Charmer"), 3 strengths, 3 things to work on, and a savage one-liner summary.`
      }],
        "You are a rizz tier list judge. You're entertaining, a bit savage, but genuinely helpful. Rate people's social and dating skills honestly and give them a tier with personality."
      );
      setResult(text);
    } catch (e) {
      setResult("Error. Try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={styles.sectionTitle}>🏆 Rizz Tier List</h2>
      <p style={styles.sub}>Answer honestly. The AI will place you in your rightful tier.</p>
      {QUESTIONS.map(q => (
        <div key={q.id} style={{ marginBottom: 20 }}>
          <div style={{ color: "#e2d9f3", marginBottom: 8, fontWeight: 600 }}>{q.text}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {q.opts.map(o => (
              <button key={o} onClick={() => set(q.id, o)}
                style={{ ...styles.chip, ...(answers[q.id] === o ? styles.chipActive : {}) }}>
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={judge} disabled={!done || loading} style={styles.btn}>
        {loading ? "Judging..." : "⚡ Get My Tier"}
      </button>
      {loading && <Loader />}
      {result && <ResultCard text={result} />}
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────
function Leaderboard({ scores }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const tiers = s => s >= 9 ? "🔱 God Tier" : s >= 7.5 ? "⚡ High Tier" : s >= 6 ? "✅ Mid Tier" : "💀 Low Tier";
  const tierColor = s => s >= 9 ? "#f59e0b" : s >= 7.5 ? "#a78bfa" : s >= 6 ? "#34d399" : "#ef4444";

  return (
    <div>
      <h2 style={styles.sectionTitle}>👑 PSL Leaderboard</h2>
      <p style={styles.sub}>Top rated faces. Rate yourself in the PSL tab to join.</p>
      {sorted.length === 0 && (
        <div style={{ textAlign: "center", color: "#555", padding: 48 }}>
          No entries yet — be the first to get rated 👀
        </div>
      )}
      {sorted.map((entry, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: i === 0 ? "linear-gradient(90deg,#2d1b4e,#1a1025)" : "#13111a",
          border: `1px solid ${i === 0 ? "#f59e0b55" : "#7c3aed22"}`,
          borderRadius: 12, padding: "14px 18px", marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 22, minWidth: 32, textAlign: "center" }}>
              {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </div>
            <div>
              <div style={{ color: "#e2d9f3", fontWeight: 700 }}>{entry.name}</div>
              <div style={{ color: "#666", fontSize: 12 }}>{entry.date}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: tierColor(entry.score), fontWeight: 800, fontSize: 22 }}>{entry.score}/10</div>
            <div style={{ color: tierColor(entry.score), fontSize: 11 }}>{tiers(entry.score)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────
function Home({ setTab }) {
  const features = [
    { id: "psl", icon: "📊", title: "PSL Rater", desc: "AI rates your looks on the 1–10 scale with full breakdown" },
    { id: "rizz", icon: "💬", title: "Rizz Coach", desc: "Get real advice for any dating situation you're in" },
    { id: "guide", icon: "📖", title: "Glow-Up Guide", desc: "Full guides on looksmaxxing, style, gym, and confidence" },
    { id: "battle", icon: "⚔️", title: "Rizz Battle", desc: "Upload two photos — AI judges who wins the rizz war" },
    { id: "tier", icon: "🏆", title: "Tier List", desc: "Find out your rizz tier: S, A, B, C, or D" },
    { id: "leaderboard", icon: "👑", title: "Leaderboard", desc: "See where you rank against others globally" },
  ];

  return (
    <div>
      <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
        <div style={{ fontSize: 13, letterSpacing: 6, color: "#7c3aed", marginBottom: 12, textTransform: "uppercase" }}>The #1 Platform for</div>
        <h1 style={{ fontSize: "clamp(36px,8vw,72px)", fontWeight: 900, lineHeight: 1.05, margin: 0, background: "linear-gradient(135deg,#fff 30%,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          RIZZ &<br />LOOKSMAXING
        </h1>
        <p style={{ color: "#6b6080", marginTop: 16, fontSize: 16, maxWidth: 400, margin: "16px auto 0" }}>
          AI-powered tools to rate your looks, level up your game, and dominate the dating scene.
        </p>
        <button onClick={() => setTab("psl")} style={{ ...styles.btn, marginTop: 28, fontSize: 16, padding: "14px 36px" }}>
          🔥 Get Rated Now
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginTop: 12 }}>
        {features.map(f => (
          <div key={f.id} onClick={() => setTab(f.id)}
            style={{
              background: "#13111a", border: "1px solid #7c3aed22",
              borderRadius: 16, padding: 22, cursor: "pointer",
              transition: "border-color .2s, transform .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#7c3aed22"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ color: "#e2d9f3", fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
            <div style={{ color: "#6b6080", fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────
const styles = {
  sectionTitle: { fontSize: 26, fontWeight: 800, color: "#e2d9f3", marginBottom: 6, marginTop: 0 },
  sub: { color: "#6b6080", marginBottom: 20, fontSize: 14 },
  input: {
    width: "100%", boxSizing: "border-box",
    background: "#13111a", border: "1px solid #7c3aed44",
    borderRadius: 10, padding: "12px 14px",
    color: "#e2d9f3", fontSize: 14, outline: "none",
    marginBottom: 14,
  },
  btn: {
    background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "12px 28px", fontWeight: 700, fontSize: 15,
    cursor: "pointer", width: "100%", marginTop: 4,
    letterSpacing: 0.5, transition: "opacity .2s",
  },
  chip: {
    background: "#1a1025", border: "1px solid #7c3aed44",
    color: "#a78bfa", borderRadius: 20, padding: "7px 16px",
    fontSize: 13, cursor: "pointer", fontWeight: 500,
  },
  chipActive: {
    background: "#7c3aed", color: "#fff", borderColor: "#7c3aed",
  },
};

export default function App() {
  const [tab, setTab] = useState("home");
  const [scores, setScores] = useState([
    { name: "Chad_IRL", score: 9.2, date: "6/1/2026" },
    { name: "GlowedUp99", score: 8.7, date: "6/3/2026" },
    { name: "SilentMenace", score: 7.4, date: "6/7/2026" },
  ]);
  const [menuOpen, setMenuOpen] = useState(false);

  const addScore = entry => setScores(s => [...s, entry]);
  

  return (
    <div style={{ minHeight: "100vh", background: "#0c0a14", color: "#e2d9f3", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid #7c3aed33;
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
        textarea, input { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0c0a14; }
        ::-webkit-scrollbar-thumb { background: #7c3aed44; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #7c3aed22",
        padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, position: "sticky", top: 0, zIndex: 100,
        background: "#0c0a14cc", backdropFilter: "blur(12px)",
      }}>
        <div onClick={() => setTab("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>RizzMaxx</span>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 4, flexWrap: "nowrap" }} className="desk-nav">
          {TABS.filter(t => t.id !== "home").map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? "#7c3aed22" : "transparent",
                border: "none", color: tab === t.id ? "#a78bfa" : "#6b6080",
                padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                display: "none",
              }}
              className="nav-btn">
              {t.label}
            </button>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "transparent", border: "none", color: "#a78bfa", fontSize: 22, cursor: "pointer" }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 60, left: 0, right: 0, zIndex: 99,
          background: "#0c0a14", borderBottom: "1px solid #7c3aed22",
          padding: 16, display: "flex", flexDirection: "column", gap: 4,
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
              style={{
                background: tab === t.id ? "#7c3aed22" : "transparent",
                border: "none", color: tab === t.id ? "#a78bfa" : "#9ca3af",
                padding: "12px 16px", borderRadius: 8, cursor: "pointer",
                fontSize: 15, fontWeight: tab === t.id ? 700 : 400, textAlign: "left",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 60px" }}>
        {tab === "home" && <Home setTab={setTab} />}
        {tab === "psl" && <PSLRater onScore={addScore} />}
        {tab === "rizz" && <RizzCoach />}
        {tab === "guide" && <Guide />}
        {tab === "battle" && <RizzBattle />}
        {tab === "tier" && <TierList />}
        {tab === "leaderboard" && <Leaderboard scores={scores} />}
      </main>

      {/* Bottom tab bar (mobile) */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#0c0a14ee", borderTop: "1px solid #7c3aed22",
        display: "flex", backdropFilter: "blur(12px)",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: tab === t.id ? "#a78bfa" : "#444",
              padding: "10px 0", fontSize: 18, cursor: "pointer",
              transition: "color .15s",
            }}>
            {t.label.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  );
}