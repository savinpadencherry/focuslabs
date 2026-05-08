/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════
   FocusChain Labs — Cadence Learning Playground
   Live demo: 7-item batch · +4% flow step · ZPD scaffolding
   ═══════════════════════════════════════════════════════════════ */

const { useState, useEffect, useMemo, useRef } = React;

// ─── Color helpers ──────────────────────────────────────────────────────
function hsl(h, s, l)  { return `hsl(${h} ${s}% ${l}%)`; }
function mod(n, m)     { return ((n % m) + m) % m; }
function angDist(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

/**
 * Build a color-theory item at a given difficulty (0–100).
 * The harder it gets:
 *   - More options
 *   - Tighter distractor angles
 *   - More exotic relationships (complementary → analogous → triadic → split-comp)
 */
function buildItem(level, diff) {
  // Pick a base hue
  const baseHue = Math.floor(Math.random() * 360);
  const sat = 68 + Math.floor(Math.random() * 14);
  const lit = 50 + Math.floor(Math.random() * 6);

  let relationship, targetAngle;
  if (diff < 35)        { relationship = 'complementary'; targetAngle = 180; }
  else if (diff < 55)   { relationship = 'complementary'; targetAngle = 180; }
  else if (diff < 72)   { relationship = 'analogous';     targetAngle = 30; }
  else if (diff < 86)   { relationship = 'triadic';       targetAngle = 120; }
  else                  { relationship = 'split-complementary'; targetAngle = 150; }

  const correctHue = mod(baseHue + targetAngle, 360);

  // Distractor "spread" — wider when easy, narrower when hard
  const spread = Math.max(28, 110 - diff * 0.8);
  const optionCount = diff < 40 ? 3 : diff < 65 ? 4 : diff < 85 ? 5 : 6;

  const options = [{ hue: correctHue, correct: true }];
  while (options.length < optionCount) {
    // Random offset that's at least 18° from the correct, and at least 18° from existing
    const offset = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * spread);
    const cand = mod(correctHue + offset, 360);
    if (options.every(o => angDist(o.hue, cand) > 18)) {
      options.push({ hue: cand, correct: false });
    }
  }
  // shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    id: `i-${level}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    level,
    diff,
    relationship,
    targetAngle,
    base: { hue: baseHue, sat, lit },
    options: options.map(o => ({ ...o, sat, lit })),
  };
}

// ─── Minto-style AI tutor messages, keyed by relationship ──────────────
const TUTOR = {
  'complementary': {
    answer: 'The complementary color sits directly opposite on the wheel — exactly 180° away.',
    why:    'Complementary pairs create maximum contrast. The eye reads them as a closed system, which is why warning signs and sports rivalries lean on them.',
    hint:   'Look for the option that feels most opposite — if the base is warm orange, the answer will be cool blue.',
  },
  'analogous': {
    answer: 'Analogous colors sit ~30° from the base on the wheel — neighbours, not opposites.',
    why:    'Analogous palettes feel calm and unified because the eye perceives a continuous family. Used heavily in editorial and product design.',
    hint:   'The right answer is close in feel — same temperature, same vibe, just a small step around the wheel.',
  },
  'triadic': {
    answer: 'Triadic colors sit at 120° intervals — three points evenly spaced around the wheel.',
    why:    'Triadic palettes balance contrast and harmony. Each color reinforces the others without overpowering — the structure designers reach for when they want energy without chaos.',
    hint:   'Mentally walk a third of the way around the wheel from the base. That is the answer.',
  },
  'split-complementary': {
    answer: 'A split-complementary color sits 150° from the base — adjacent to the true complement.',
    why:    'Split-complementary keeps the punch of contrast but softens it by stepping just off-axis. The trick brand systems use when pure complementary feels too aggressive.',
    hint:   'Find the complement first (180° away), then step 30° to either side. That neighbour is the answer.',
  },
};

// ─── Track definitions ──────────────────────────────────────────────────
const TRACKS = [
  { id: 'color',   name: 'Color theory',          subject: 'Visual design fundamentals',  desc: 'Pick the right color relationship from the wheel.', startDiff: 28 },
  { id: 'gtm',     name: 'GTM prompt craft',      subject: 'AI for go-to-market',         desc: 'Diagnose and rewrite weak prompts to ship better outputs.', startDiff: 40, locked: true },
  { id: 'medical', name: 'Adverse event writing', subject: 'Regulated medical writing',   desc: 'Source-grounded drafting for CSR sections, ICH E3.', startDiff: 50, locked: true },
];

// ─── Flow state classifier ─────────────────────────────────────────────
function flowState(skill, challenge) {
  const gap = challenge - skill;
  if (gap > 14)  return { label: 'Anxiety',  desc: 'Challenge above skill — slow down', color: '#C2473C', t: 0.95 };
  if (gap < -14) return { label: 'Boredom',  desc: 'Skill above challenge — step it up', color: '#7A8493', t: 0.05 };
  return            { label: 'Flow',         desc: 'Engaged · in the zone',              color: '#1FA565', t: 0.5 };
}

// ─── Main app ──────────────────────────────────────────────────────────
function PlaygroundApp() {
  const BATCH = 7;

  const [track, setTrack] = useState(null);
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [diff, setDiff] = useState(28);
  const [mastery, setMastery] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [pickedHue, setPickedHue] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [showHint, setShowHint] = useState(false);
  const [tutorPhase, setTutorPhase] = useState(0); // 0 thinking, 1 answer, 2 why
  const [batchDone, setBatchDone] = useState(false);

  const skill = useMemo(() => {
    // skill estimate: 30 + 0.7 * mastery + 0.3 * (correct / max(1,attempts) * 100)
    return Math.round(20 + mastery * 0.7 + (correct + missed > 0 ? (correct / (correct + missed)) * 100 * 0.3 : 0));
  }, [mastery, correct, missed]);

  const flow = flowState(skill, diff);
  const current = items[idx];

  // start a new batch
  function startTrack(t) {
    setTrack(t);
    setDiff(t.startDiff);
    const startDiff = t.startDiff;
    const seed = Array.from({ length: BATCH }, (_, i) =>
      buildItem(i + 1, Math.min(95, startDiff + i * 2))
    );
    setItems(seed);
    setIdx(0);
    setMastery(0);
    setCorrect(0);
    setMissed(0);
    setPickedHue(null);
    setFeedback(null);
    setShowHint(false);
    setTutorPhase(0);
    setBatchDone(false);
    // animate the AI "thinking → answer → why"
    setTimeout(() => setTutorPhase(1), 700);
    setTimeout(() => setTutorPhase(2), 1700);
  }

  // when item changes, animate tutor
  useEffect(() => {
    if (!current) return;
    setTutorPhase(0);
    setShowHint(false);
    setPickedHue(null);
    setFeedback(null);
    const t1 = setTimeout(() => setTutorPhase(1), 600);
    const t2 = setTimeout(() => setTutorPhase(2), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [idx, track && track.id]);

  function handlePick(opt) {
    if (feedback) return;
    setPickedHue(opt.hue);
    if (opt.correct) {
      setFeedback('correct');
      setCorrect(c => c + 1);
      // +4% challenge step
      setDiff(d => Math.min(98, +(d + 4).toFixed(1)));
      setMastery(m => Math.min(100, m + Math.round(100 / BATCH)));
      // advance after a beat
      setTimeout(() => advance(), 1200);
    } else {
      setFeedback('wrong');
      setMissed(m => m + 1);
      // small step down
      setDiff(d => Math.max(15, +(d - 4).toFixed(1)));
      // after a beat, allow re-try (same item, but reveal hint)
      setTimeout(() => {
        setFeedback(null);
        setPickedHue(null);
        setShowHint(true);
      }, 1300);
    }
  }

  function advance() {
    if (idx + 1 >= items.length) {
      setBatchDone(true);
      return;
    }
    setIdx(i => i + 1);
  }

  function nextBatch() {
    if (!track) return;
    const seed = Array.from({ length: BATCH }, (_, i) =>
      buildItem(i + 1, Math.min(95, diff + i * 2))
    );
    setItems(seed);
    setIdx(0);
    setMastery(0);
    setBatchDone(false);
  }

  // ─── Render ──────────────────────────────────────────────────────────
  if (!track) return <TrackPicker onPick={startTrack} />;

  if (batchDone) return (
    <BatchComplete
      track={track} correct={correct} missed={missed}
      diff={diff} skill={skill}
      onNext={nextBatch}
      onSwitch={() => setTrack(null)}
    />
  );

  return (
    <div className="pg-app">
      {/* TOP STATUS BAR */}
      <div className="pg-status">
        <div className="pg-status-l">
          <div className="pg-track">
            <span className="pg-track-tag">{track.subject}</span>
            <span className="pg-track-name">{track.name}</span>
          </div>
        </div>
        <div className="pg-status-c">
          <BatchProgress total={BATCH} idx={idx} correct={correct} missed={missed} />
        </div>
        <div className="pg-status-r">
          <button className="pg-link" onClick={() => setTrack(null)}>Switch track ↗</button>
        </div>
      </div>

      <div className="pg-main">
        {/* ─── TUTOR PANE ─── */}
        <aside className="pg-tutor">
          <div className="pg-tutor-head">
            <div className="pg-avatar">
              <span className="pg-avatar-dot" />
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div className="pg-avatar-name">Cadence tutor</div>
              <div className="pg-avatar-role">AI · curating from your gaps</div>
            </div>
          </div>

          <div className="pg-tutor-body">
            <div className="pg-tutor-eyebrow">Lesson · Minto pyramid</div>

            {tutorPhase === 0 && (
              <div className="pg-thinking">
                <span className="dot"/><span className="dot"/><span className="dot"/>
              </div>
            )}

            {tutorPhase >= 1 && current && (
              <div className="pg-msg pg-msg-answer">
                <div className="pg-msg-tag">Answer first</div>
                <div className="pg-msg-text">{TUTOR[current.relationship].answer}</div>
              </div>
            )}

            {tutorPhase >= 2 && current && (
              <div className="pg-msg pg-msg-why">
                <div className="pg-msg-tag">Why it matters</div>
                <div className="pg-msg-text">{TUTOR[current.relationship].why}</div>
              </div>
            )}

            {showHint && current && (
              <div className="pg-msg pg-msg-hint">
                <div className="pg-msg-tag">Scaffolding · ZPD</div>
                <div className="pg-msg-text">{TUTOR[current.relationship].hint}</div>
              </div>
            )}

            {tutorPhase >= 2 && current && !showHint && (
              <button className="pg-hint-btn" onClick={() => setShowHint(true)}>
                Need a scaffold? <span>+</span>
              </button>
            )}
          </div>
        </aside>

        {/* ─── CHALLENGE PANE ─── */}
        <section className="pg-challenge">
          <div className="pg-task">
            <div className="pg-task-eyebrow">Item {idx + 1} of {BATCH} · difficulty {Math.round(diff)}%</div>
            <h3 className="pg-task-q">
              Pick the <em>{current.relationship}</em> of this base color.
            </h3>
            <div className="pg-base-row">
              <div className="pg-base-swatch" style={{ background: hsl(current.base.hue, current.base.sat, current.base.lit) }}>
                <div className="pg-base-tick" style={{ background: hsl(current.base.hue, current.base.sat, current.base.lit + 14) }}/>
              </div>
              <div className="pg-base-meta">
                <div className="pg-base-name">Base · {Math.round(current.base.hue)}°</div>
                <div className="pg-base-sub">Target offset · {current.targetAngle}°</div>
              </div>
            </div>

            <div className="pg-options" data-count={current.options.length}>
              {current.options.map((opt, i) => {
                const picked = pickedHue === opt.hue;
                const reveal = feedback && (picked || (feedback === 'correct' && opt.correct));
                let cls = 'pg-opt';
                if (picked && feedback === 'correct') cls += ' is-correct';
                if (picked && feedback === 'wrong')   cls += ' is-wrong';
                if (feedback === 'correct' && opt.correct && !picked) cls += ' is-revealed';
                return (
                  <button
                    key={i}
                    className={cls}
                    style={{ '--c': hsl(opt.hue, opt.sat, opt.lit) }}
                    disabled={!!feedback}
                    onClick={() => handlePick(opt)}
                    aria-label={`Color option ${i + 1}, hue ${Math.round(opt.hue)} degrees`}
                  >
                    <span className="pg-opt-fill" />
                    <span className="pg-opt-mark">
                      {picked && feedback === 'correct' && <Check />}
                      {picked && feedback === 'wrong' && <Cross />}
                      {feedback === 'correct' && opt.correct && !picked && <Check />}
                    </span>
                    <span className="pg-opt-deg">{Math.round(opt.hue)}°</span>
                  </button>
                );
              })}
            </div>

            <div className="pg-feedback">
              {feedback === 'correct' && <span className="pg-fb pg-fb-c"><Check /> Correct · +4% challenge step applied</span>}
              {feedback === 'wrong'   && <span className="pg-fb pg-fb-w"><Cross /> Not quite — scaffolding incoming…</span>}
            </div>
          </div>
        </section>

        {/* ─── LIVE STATE PANE ─── */}
        <aside className="pg-state">
          {/* Mastery */}
          <div className="pg-card">
            <div className="pg-card-head">
              <span className="pg-card-tag">Mastery · this batch</span>
              <span className="pg-card-num">{mastery}%</span>
            </div>
            <div className="pg-bar">
              <div className="pg-bar-fill" style={{ width: mastery + '%' }} />
            </div>
            <div className="pg-card-foot">
              {correct} correct · {missed} miss · {idx + 1}/{BATCH} items
            </div>
          </div>

          {/* Difficulty */}
          <div className="pg-card">
            <div className="pg-card-head">
              <span className="pg-card-tag">Challenge level</span>
              <span className="pg-card-num">{Math.round(diff)}%</span>
            </div>
            <div className="pg-meter">
              <div className="pg-meter-track">
                <div className="pg-meter-zone" />
                <div className="pg-meter-skill" style={{ left: skill + '%' }} title="Your skill">
                  <span/>
                </div>
                <div className="pg-meter-chal" style={{ left: diff + '%' }} title="Challenge level">
                  <span/>
                </div>
              </div>
              <div className="pg-meter-legend">
                <span className="lg lg-skill">● Skill {skill}%</span>
                <span className="lg lg-chal">▲ Challenge {Math.round(diff)}%</span>
              </div>
            </div>
          </div>

          {/* Flow state */}
          <div className="pg-card pg-card-flow" style={{ '--flow': flow.color }}>
            <div className="pg-card-head">
              <span className="pg-card-tag">Flow state</span>
              <span className="pg-flow-pill">{flow.label}</span>
            </div>
            <FlowChannel flow={flow} skill={skill} diff={diff} />
            <div className="pg-card-foot">{flow.desc}</div>
          </div>

          {/* Cognitive load */}
          <div className="pg-card pg-card-cl">
            <div className="pg-card-head">
              <span className="pg-card-tag">Working memory · CLT</span>
              <span className="pg-card-num">{idx + 1} / {BATCH}</span>
            </div>
            <div className="pg-cl-row">
              {Array.from({ length: BATCH }).map((_, i) => (
                <div key={i}
                  className={'pg-cl-cell' + (i < idx ? ' is-done' : i === idx ? ' is-now' : '')}
                />
              ))}
            </div>
            <div className="pg-card-foot">7±2 items per batch — Miller's rule</div>
          </div>
        </aside>
      </div>

      {/* footer */}
      <div className="pg-foot">
        <div className="pg-foot-l">
          <span className="pg-tag">Live demo</span> — your real Cadence pilot would draw items from <em>your</em> domain · co-authored rubric · 24-week reinforcement
        </div>
      </div>
    </div>
  );
}

// ─── Track picker ──────────────────────────────────────────────────────
function TrackPicker({ onPick }) {
  return (
    <div className="pg-app pg-app-picker">
      <div className="pg-picker-head">
        <span className="pg-picker-eyebrow">Live demo · Cadence playground</span>
        <h3 className="pg-picker-title">Pick a learning track to begin.</h3>
        <p className="pg-picker-sub">
          The system will run a <strong>7-item batch</strong> from the track you choose.
          Watch the difficulty step <strong>+4% on each correct answer</strong>,
          and step back when you slip — keeping you in the flow zone.
        </p>
      </div>
      <div className="pg-picker-grid">
        {TRACKS.map(t => (
          <button
            key={t.id}
            className={'pg-track-card' + (t.locked ? ' is-locked' : '')}
            disabled={!!t.locked}
            onClick={() => !t.locked && onPick(t)}
          >
            <div className="pg-track-card-tag">{t.subject}</div>
            <div className="pg-track-card-name">{t.name}</div>
            <div className="pg-track-card-desc">{t.desc}</div>
            <div className="pg-track-card-foot">
              {t.locked ? 'Available in pilot' : 'Start a batch →'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Batch complete ────────────────────────────────────────────────────
function BatchComplete({ track, correct, missed, diff, skill, onNext, onSwitch }) {
  const total = correct + missed;
  const acc = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="pg-app pg-app-done">
      <div className="pg-done-card">
        <div className="pg-done-mark"><Check large /></div>
        <div className="pg-picker-eyebrow">Batch complete · {track.name}</div>
        <h3 className="pg-picker-title">Nice work. The next batch will start at <em>{Math.round(diff)}%</em> challenge.</h3>
        <p className="pg-picker-sub">Cadence updated your skill estimate to {skill}% and queued spaced reinforcement on the items you missed — they'll come back in 2–4 days, varied so you can't just memorise.</p>

        <div className="pg-done-stats">
          <div className="pg-done-stat"><div className="num">{correct}</div><div className="lbl">Correct</div></div>
          <div className="pg-done-stat"><div className="num">{missed}</div><div className="lbl">Misses</div></div>
          <div className="pg-done-stat"><div className="num">{acc}%</div><div className="lbl">Accuracy</div></div>
          <div className="pg-done-stat"><div className="num">+{Math.round(diff - track.startDiff)}%</div><div className="lbl">Challenge gain</div></div>
        </div>

        <div className="pg-done-actions">
          <button className="btn btn-primary" onClick={onNext}>Run next batch <span className="btn-arrow">→</span></button>
          <button className="btn btn-ghost" onClick={onSwitch}>Switch track</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub components ────────────────────────────────────────────────────
function BatchProgress({ total, idx, correct, missed }) {
  return (
    <div className="pg-progress">
      {Array.from({ length: total }).map((_, i) => {
        let cls = 'pg-prog-cell';
        if (i < idx) cls += ' is-done';
        if (i === idx) cls += ' is-now';
        return <div key={i} className={cls}/>;
      })}
    </div>
  );
}

function FlowChannel({ flow, skill, diff }) {
  // Visual flow channel: x-axis skill, y-axis challenge — diagonal flow band
  return (
    <div className="pg-flow-chart">
      <svg viewBox="0 0 200 100" preserveAspectRatio="none">
        {/* Anxiety zone */}
        <polygon points="0,0 200,0 200,80" fill="rgba(194, 71, 60, 0.10)" />
        {/* Boredom zone */}
        <polygon points="0,20 0,100 200,100" fill="rgba(122, 132, 147, 0.10)" />
        {/* Flow channel */}
        <polygon points="0,0 200,80 200,100 0,20" fill="rgba(31, 165, 101, 0.18)" />
        <line x1="0" y1="20" x2="200" y2="100" stroke="rgba(31, 165, 101, 0.55)" strokeWidth="0.5" strokeDasharray="2 2"/>
        <line x1="0" y1="0" x2="200" y2="80" stroke="rgba(31, 165, 101, 0.55)" strokeWidth="0.5" strokeDasharray="2 2"/>
      </svg>
      <div className="pg-flow-axis pg-flow-axis-x">Skill →</div>
      <div className="pg-flow-axis pg-flow-axis-y">Challenge →</div>
      <div
        className="pg-flow-pin"
        style={{
          left: `${Math.min(98, Math.max(2, skill))}%`,
          bottom: `${Math.min(98, Math.max(2, diff))}%`,
          background: flow.color,
        }}
      />
    </div>
  );
}

function Check({ large }) {
  const s = large ? 22 : 12;
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" aria-hidden="true">
      <path d="M5 12 L10 17 L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function Cross() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
      <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Mount ─────────────────────────────────────────────────────────────
let mounted = false;
function mountPlayground() {
  if (mounted) return;
  const el = document.getElementById('playground-root');
  if (!el) return;
  mounted = true;
  ReactDOM.createRoot(el).render(<PlaygroundApp />);
}

// Mount immediately if the playground panel is already active or just lazily
window.__mountPlayground = mountPlayground;

// Try to mount on idle so the demo is ready by the time the user clicks the tab
if (window.requestIdleCallback) {
  requestIdleCallback(mountPlayground, { timeout: 1500 });
} else {
  setTimeout(mountPlayground, 600);
}
