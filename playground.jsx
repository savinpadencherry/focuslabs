/* ═══════════════════════════════════════════════════════════════
   FocusChain Labs — Agile / Scrum Strategic Playground
   Case study: "Compass" — a 3-sprint risk-advisory MVP
   Short lab: Brief → Roles → MoSCoW → Estimate → Sprint Board → Retro/Report
   ═══════════════════════════════════════════════════════════════ */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

/* ─────────────────────────── DATA ─────────────────────────── */

const CASE = {
  client: "Risk Advisory · Big-4 unit",
  project: "Compass",
  oneLiner: "A unified audit-evidence workspace for 700 risk-advisory consultants.",
  problem:
    "Today, evidence is scattered across email, OneDrive, and SharePoint. Audits stall when reviewers cannot find source files. Partners want a single workspace, mobile-friendly, with structured evidence requests and traceable approvals — shipped in three sprints.",
  team: [
    { name: "You", role: "Scrum Master" },
    { name: "Anjali R.", role: "Product Owner" },
    { name: "Karthik N.", role: "Senior Engineer" },
    { name: "Riya M.", role: "Engineer" },
    { name: "Sahil G.", role: "Engineer" },
    { name: "Devika S.", role: "Designer" },
  ],
  constraints: [
    "3 sprints · 6 weeks · fixed scope window",
    "Budget already locked at partner level",
    "Showcase demo to client partner at end of sprint 3",
  ],
};

const ROLES = [
  {
    id: "po",
    name: "Product Owner",
    sub: "Owns the WHAT",
    accent: "navy",
  },
  {
    id: "sm",
    name: "Scrum Master",
    sub: "Owns the HOW",
    accent: "green",
  },
  {
    id: "dev",
    name: "Developers",
    sub: "Own the BUILD",
    accent: "ink",
  },
];

const RESPONSIBILITIES = [
  { id: "r1", text: "Prioritise the product backlog by business value", role: "po" },
  { id: "r3", text: "Decide release goals and acceptance criteria", role: "po" },
  { id: "r2", text: "Remove impediments that block the team", role: "sm" },
  { id: "r5", text: "Facilitate the daily standup, planning &amp; retro", role: "sm" },
  { id: "r4", text: "Estimate and commit to the sprint backlog", role: "dev" },
  { id: "r6", text: "Design, build and test increments to definition of done", role: "dev" },
];

const BACKLOG = [
  { id: "b1", title: "User login (SSO via Azure AD)", note: "Compliance hard-gate.", bucket: "must" },
  { id: "b2", title: "Create audit engagement workspace", note: "Core unit of work.", bucket: "must" },
  { id: "b3", title: "Upload &amp; tag evidence files", note: "Without this, no audit value.", bucket: "must" },
  { id: "b4", title: "Reviewer approval workflow", note: "Partner sign-off chain.", bucket: "should" },
  { id: "b5", title: "Mobile responsive layout", note: "Site visits use phones.", bucket: "should" },
  { id: "b8", title: "AI auto-summary of audit findings", note: "Wow factor, not core.", bucket: "could" },
  { id: "b9", title: "Native iOS &amp; Android app", note: "Out of scope for MVP.", bucket: "wont" },
];

const BUCKETS = [
  { id: "must", name: "Must have", sub: "Without it, sprint fails.", accent: "must" },
  { id: "should", name: "Should have", sub: "Painful to omit, not fatal.", accent: "should" },
  { id: "could", name: "Could have", sub: "Desirable if capacity allows.", accent: "could" },
  { id: "wont", name: "Won't have (this time)", sub: "Explicitly out of scope.", accent: "wont" },
];

const TICKETS = [
  { id: "t1", title: "SSO login screen", pts: 3, col: "todo" },
  { id: "t2", title: "Workspace create API", pts: 5, col: "todo" },
  { id: "t3", title: "Evidence upload UI", pts: 5, col: "todo" },
  { id: "t5", title: "Reviewer approval flow", pts: 8, col: "todo" },
];

const COLUMNS = [
  { id: "todo", name: "To do" },
  { id: "doing", name: "In progress" },
  { id: "review", name: "Code review" },
  { id: "done", name: "Done" },
];

/* Daily events that fire as the user advances days */
const EVENTS = [
  {
    day: 1,
    type: "standup",
    title: "Day 1 standup — kickoff",
    body: "Anjali confirms scope. Karthik picks up SSO. Riya pairs on workspace API. Sahil starts evidence upload UI.",
    suggest: ["t1", "t2", "t3"],
    coach: "Pull a small first wave into 'In progress' — keep WIP low, don't fan out across all tickets.",
  },
  {
    day: 3,
    type: "blocker",
    title: "Day 3 — Azure AD permission blocker",
    body: "Karthik can't get tenant admin to grant SSO permissions. SSO ticket is blocked.",
    coach: "Move t1 (SSO) to 'Code review' if a teammate can stub, OR keep it in progress and have the Scrum Master escalate. Don't let it sit silently.",
  },
  {
    day: 6,
    type: "scope",
    title: "Day 6 — partner asks for a 'small' addition",
    body: "Partner wants email notifications for approvals. Not in sprint backlog.",
    coach: "Don't drag it onto the board. Tell the PO to log it for the next sprint. Mid-sprint scope creep is the #1 reason teams miss commitments.",
  },
  {
    day: 10,
    type: "review",
    title: "Day 10 — Sprint Review demo",
    body: "Move anything still in progress that you've actually shipped. Anything still in 'To do' is carryover.",
    coach: "Don't pretend. Honest burndown is the whole point of Scrum.",
  },
];

const RETRO_CARDS = [
  { id: "rc1", text: "Pairing on the workspace API got it merged 2 days early", target: "continue" },
  { id: "rc2", text: "We let SSO sit blocked for a full day before escalating", target: "stop" },
  { id: "rc4", text: "We accepted a mid-sprint scope ask without pushback", target: "stop" },
  { id: "rc5", text: "Try a 10-min design review with Devika every Tuesday", target: "start" },
];

const RETRO_BUCKETS = [
  { id: "start", name: "Start", sub: "New habits to introduce." },
  { id: "stop", name: "Stop", sub: "What's hurting us, name it." },
  { id: "continue", name: "Continue", sub: "What's working, double down." },
];

const STORIES = [
  { id: "s1", title: "Single sign-on via Azure AD", body: "Familiar pattern, library exists, but tenant admin needed.", truth: 3 },
  { id: "s2", title: "Reviewer approval workflow with audit trail", body: "Multi-step state machine, role checks, e-sign hooks, edge cases.", truth: 8 },
  { id: "s4", title: "AI auto-summary of audit findings", body: "New tech, no team experience, ambiguous acceptance criteria.", truth: 13 },
];
const FIB = [1, 2, 3, 5, 8, 13];

const STAGES = [
  { id: "brief", name: "Brief" },
  { id: "roles", name: "Roles" },
  { id: "moscow", name: "Backlog" },
  { id: "estimate", name: "Estimate" },
  { id: "board", name: "Sprint" },
  { id: "retro", name: "Retro" },
  { id: "report", name: "Scorecard" },
];

const STRATEGY_CHOICES = [
  {
    id: "thin-slice",
    title: "Thin-slice the workflow",
    body: "Ship SSO, workspace creation, upload/tag, and a lightweight approval path first.",
    verdict: "Best first move. It protects the end-to-end demo and keeps sprint risk visible.",
    score: 96,
    tone: "green",
  },
  {
    id: "wow-ai",
    title: "Prioritise AI auto-summary",
    body: "Lead with the demo wow factor and defer some compliance plumbing.",
    verdict: "Tempting, but risky. The client cannot trust AI summaries until evidence flow and approvals work.",
    score: 48,
    tone: "amber",
  },
  {
    id: "approval-heavy",
    title: "Perfect the approval engine",
    body: "Spend the first sprint on reviewer edge cases and e-sign integrations.",
    verdict: "Too deep too early. Build enough approval to validate the workflow before hardening every edge case.",
    score: 64,
    tone: "navy",
  },
];

const EVENT_DECISIONS = {
  standup: [
    { id: "low-wip", label: "Pull 2-3 tickets only", best: true, note: "Good WIP discipline. Flow beats heroic multitasking." },
    { id: "fan-out", label: "Start all tickets", best: false, note: "Too much WIP. The board looks busy but nothing reaches done." },
  ],
  blocker: [
    { id: "escalate-stub", label: "Escalate + stub login", best: true, note: "Correct. You protect the path to demo while unblocking the dependency." },
    { id: "wait-admin", label: "Wait for admin", best: false, note: "Risky. Silent blockers are sprint killers." },
  ],
  scope: [
    { id: "park-next", label: "Park for next sprint", best: true, note: "Correct. New scope belongs in the product backlog, not mid-sprint." },
    { id: "accept-now", label: "Accept into sprint", best: false, note: "That breaks commitment. Log it, size it, and let the PO reorder later." },
  ],
  review: [
    { id: "honest-carry", label: "Carry unfinished work", best: true, note: "Good. Transparency is what makes the next sprint forecast better." },
    { id: "mark-done", label: "Mark it done for demo", best: false, note: "That hides risk. Done means potentially shippable, not almost ready." },
  ],
};

/* ─────────────────────────── UTILITIES ─────────────────────────── */

function classes(...c) { return c.filter(Boolean).join(" "); }

function CoachLine({ tone = "neutral", title, children, anim }) {
  return (
    <div className={classes("pg-coach", `pg-coach-${tone}`, anim && "pg-coach-pop")}>
      <div className="pg-coach-tag">AI coach</div>
      {title && <div className="pg-coach-title">{title}</div>}
      <div className="pg-coach-body">{children}</div>
    </div>
  );
}

function StageHeader({ idx, total, title, eyebrow, sub, scoreLine }) {
  return (
    <div className="pg-stage-head">
      <div className="pg-stage-eyebrow">
        <span className="pg-stage-step">Stage {idx + 1} / {total}</span>
        <span>·</span>
        <span>{eyebrow}</span>
      </div>
      <h2 className="pg-stage-title">{title}</h2>
      {sub && <p className="pg-stage-sub">{sub}</p>}
      {scoreLine && <div className="pg-stage-score">{scoreLine}</div>}
    </div>
  );
}

/* ─────────────────────────── STAGE 1: BRIEF ─────────────────────────── */

function StageBrief({ onNext, idx, total }) {
  const [choice, setChoice] = useState(null);
  const picked = STRATEGY_CHOICES.find(c => c.id === choice);

  return (
    <div className="pg-stage pg-stage-brief">
      <StageHeader
        idx={idx}
        total={total}
        eyebrow="Read the room"
        title="Case brief · the Compass MVP"
        sub="A fast, high-level case read before the sprint lab begins. Each move teaches one Scrum decision without overloading the player."
      />

      <div className="brief-grid">
        <div className="brief-main">
          <div className="brief-block">
            <div className="brief-block-label">Client</div>
            <div className="brief-block-val">{CASE.client}</div>
          </div>
          <div className="brief-block">
            <div className="brief-block-label">Project</div>
            <div className="brief-block-val brief-block-val-lg">{CASE.project}</div>
            <div className="brief-block-sub">{CASE.oneLiner}</div>
          </div>
          <div className="brief-block">
            <div className="brief-block-label">The problem</div>
            <div className="brief-block-body">{CASE.problem}</div>
          </div>
          <div className="brief-block">
            <div className="brief-block-label">Hard constraints</div>
            <ul className="brief-list">
              {CASE.constraints.map((c, i) => (
                <li key={i}><span className="brief-bullet">✓</span>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="brief-side">
          <div className="brief-side-label">Your team this sprint</div>
          <ul className="brief-team">
            {CASE.team.map(t => (
              <li key={t.name} className={t.name === "You" ? "brief-team-you" : ""}>
                <div className="brief-team-name">{t.name}</div>
                <div className="brief-team-role">{t.role}</div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="strategy-lab">
        <div className="strategy-lab-head">
          <div>
            <div className="strategy-kicker">First strategic call</div>
            <div className="strategy-title">Choose the sprint-1 framing before you touch the board.</div>
          </div>
          <div className="strategy-score">
            <span>{picked ? picked.score : "—"}</span>
            <small>fit score</small>
          </div>
        </div>
        <div className="strategy-options">
          {STRATEGY_CHOICES.map(option => (
            <button
              key={option.id}
              className={classes("strategy-option", choice === option.id && "is-selected")}
              onClick={() => setChoice(option.id)}
            >
              <span className="strategy-option-title">{option.title}</span>
              <span className="strategy-option-body">{option.body}</span>
            </button>
          ))}
        </div>
        {picked && (
          <div className={classes("strategy-verdict", `strategy-verdict-${picked.tone}`)}>
            <strong>{picked.score >= 90 ? "Recommended path" : "Trade-off"}</strong>
            <span>{picked.verdict}</span>
          </div>
        )}
      </div>

      <CoachLine tone="navy" title="What to expect">
        A compact sprint lab with selection, matching, sorting, estimation,
        board movement and a retro. The choices are intentionally tight so the
        player learns the pattern, then wants to finish the run.
      </CoachLine>

      <div className="pg-stage-actions">
        <button className="pg-btn pg-btn-primary" onClick={onNext}>
          {choice ? "Begin simulation" : "Skip and begin"} <span className="arr">→</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── STAGE 2: ROLE MATCH ─────────────────────────── */

function StageRoles({ onNext, idx, total }) {
  // Pool of responsibilities not yet placed
  const [pool, setPool] = useState(() => RESPONSIBILITIES.map(r => r.id));
  // map of roleId → array of responsibility ids
  const [placed, setPlaced] = useState({ po: [], sm: [], dev: [] });
  const [dragId, setDragId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { correct, wrong }
  const [hoverRole, setHoverRole] = useState(null);

  const allPlaced = pool.length === 0;

  const handleDragStart = (id) => setDragId(id);
  const handleDragEnd = () => { setDragId(null); setHoverRole(null); };

  const handleDropOnRole = (roleId, fromPool) => {
    if (!dragId) return;
    // remove from any previous holder
    setPool(p => p.filter(x => x !== dragId));
    setPlaced(prev => {
      const next = { po: [...prev.po], sm: [...prev.sm], dev: [...prev.dev] };
      for (const k of Object.keys(next)) next[k] = next[k].filter(x => x !== dragId);
      next[roleId].push(dragId);
      return next;
    });
    setHoverRole(null);
  };

  const handleDropOnPool = () => {
    if (!dragId) return;
    setPool(p => p.includes(dragId) ? p : [...p, dragId]);
    setPlaced(prev => {
      const next = { po: [...prev.po], sm: [...prev.sm], dev: [...prev.dev] };
      for (const k of Object.keys(next)) next[k] = next[k].filter(x => x !== dragId);
      return next;
    });
  };

  const handleCheck = () => {
    let correct = 0, wrong = 0;
    Object.entries(placed).forEach(([role, ids]) => {
      ids.forEach(id => {
        const r = RESPONSIBILITIES.find(x => x.id === id);
        if (r.role === role) correct++; else wrong++;
      });
    });
    setFeedback({ correct, wrong });
  };

  const responsibilityById = (id) => RESPONSIBILITIES.find(r => r.id === id);

  return (
    <div className="pg-stage pg-stage-roles">
      <StageHeader
        idx={idx}
        total={total}
        eyebrow="Stage 1 · accountability"
        title="Match the responsibility to the right Scrum role."
        sub="Drag each card from the pool into Product Owner, Scrum Master, or Developers."
      />

      <div className="roles-layout">
        <div
          className={classes("roles-pool", dragId && "is-targetable")}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDropOnPool}
        >
          <div className="roles-pool-head">Pool · drag from here</div>
          <div className="roles-pool-list">
            {pool.length === 0 && <div className="roles-pool-empty">All cards placed — hit check.</div>}
            {pool.map(id => {
              const r = responsibilityById(id);
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(id)}
                  onDragEnd={handleDragEnd}
                  className="resp-card"
                  dangerouslySetInnerHTML={{ __html: r.text }}
                />
              );
            })}
          </div>
        </div>

        <div className="roles-targets">
          {ROLES.map(role => {
            const wrongIds = feedback ? placed[role.id].filter(id => responsibilityById(id).role !== role.id) : [];
            const rightIds = feedback ? placed[role.id].filter(id => responsibilityById(id).role === role.id) : [];
            return (
              <div
                key={role.id}
                className={classes(
                  "role-slot",
                  `role-slot-${role.accent}`,
                  hoverRole === role.id && "is-hover",
                  feedback && "is-checked"
                )}
                onDragOver={e => { e.preventDefault(); setHoverRole(role.id); }}
                onDragLeave={() => setHoverRole(null)}
                onDrop={() => handleDropOnRole(role.id)}
              >
                <div className="role-slot-head">
                  <div className="role-slot-name">{role.name}</div>
                  <div className="role-slot-sub">{role.sub}</div>
                </div>
                <div className="role-slot-body">
                  {placed[role.id].length === 0 && !feedback && (
                    <div className="role-slot-empty">Drop responsibilities here</div>
                  )}
                  {placed[role.id].map(id => {
                    const r = responsibilityById(id);
                    const isWrong = feedback && r.role !== role.id;
                    const isRight = feedback && r.role === role.id;
                    return (
                      <div
                        key={id}
                        draggable={!feedback}
                        onDragStart={() => handleDragStart(id)}
                        onDragEnd={handleDragEnd}
                        className={classes("resp-card resp-card-placed", isWrong && "is-wrong", isRight && "is-right")}
                      >
                        <span dangerouslySetInnerHTML={{ __html: r.text }} />
                        {isWrong && <span className="resp-mark">belongs in <em>{ROLES.find(x => x.id === r.role).name}</em></span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!feedback && (
        <div className="pg-stage-actions">
          <button
            className="pg-btn pg-btn-primary"
            disabled={!allPlaced}
            onClick={handleCheck}
          >
            {allPlaced ? "Check my matches" : `${pool.length} card${pool.length === 1 ? "" : "s"} left`}
          </button>
        </div>
      )}

      {feedback && (
        <>
          <CoachLine
            tone={feedback.wrong === 0 ? "green" : feedback.wrong <= 2 ? "navy" : "amber"}
            title={feedback.wrong === 0 ? "Perfect role-fit." : `${feedback.correct} right · ${feedback.wrong} mis-placed`}
            anim
          >
            {feedback.wrong === 0
              ? "You've internalised the Scrum accountability triangle. The PO/SM/Dev boundary is the single most-violated rule in real teams — knowing it cold is half the battle."
              : "Look for the verbs. ‘Prioritise / decide / approve' belongs with the PO. ‘Facilitate / remove / coach' belongs with the SM. ‘Build / estimate / commit' belongs with Developers."}
          </CoachLine>
          <div className="pg-stage-actions">
            <button className="pg-btn pg-btn-ghost" onClick={() => {
              setPlaced({ po: [], sm: [], dev: [] });
              setPool(RESPONSIBILITIES.map(r => r.id));
              setFeedback(null);
            }}>Reset</button>
            <button className="pg-btn pg-btn-primary" onClick={onNext}>
              Move to backlog prioritisation <span className="arr">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── STAGE 3: MOSCOW PRIORITISATION ─────────────────────────── */

function StageMoSCoW({ onNext, idx, total }) {
  const [pool, setPool] = useState(() => BACKLOG.map(b => b.id));
  const [placed, setPlaced] = useState({ must: [], should: [], could: [], wont: [] });
  const [dragId, setDragId] = useState(null);
  const [hover, setHover] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const itemById = (id) => BACKLOG.find(b => b.id === id);

  const onDrop = (bucket) => {
    if (!dragId) return;
    setPool(p => p.filter(x => x !== dragId));
    setPlaced(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = next[k].filter(x => x !== dragId);
      next[bucket] = [...next[bucket], dragId];
      return next;
    });
    setHover(null);
  };

  const onDropPool = () => {
    if (!dragId) return;
    setPool(p => p.includes(dragId) ? p : [...p, dragId]);
    setPlaced(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = next[k].filter(x => x !== dragId);
      return next;
    });
  };

  const allPlaced = pool.length === 0;

  const check = () => {
    let correct = 0, wrong = 0;
    Object.entries(placed).forEach(([bucket, ids]) => {
      ids.forEach(id => {
        if (itemById(id).bucket === bucket) correct++; else wrong++;
      });
    });
    setFeedback({ correct, wrong });
  };

  return (
    <div className="pg-stage pg-stage-moscow">
      <StageHeader
        idx={idx}
        total={total}
        eyebrow="Stage 2 · prioritisation under pressure"
        title="Sort the backlog with MoSCoW."
        sub="The PO has narrowed the backlog to seven representative items. Place them by business necessity, not personal preference."
      />

      <div className="moscow-layout">
        <div
          className={classes("moscow-pool", dragId && "is-targetable")}
          onDragOver={e => e.preventDefault()}
          onDrop={onDropPool}
        >
          <div className="moscow-pool-head">
            <span>Product backlog · raw</span>
            <span className="moscow-pool-count">{pool.length} unsorted</span>
          </div>
          <div className="moscow-pool-list">
            {pool.length === 0 && <div className="moscow-pool-empty">Backlog empty — every item is placed.</div>}
            {pool.map(id => {
              const b = itemById(id);
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => setDragId(id)}
                  onDragEnd={() => { setDragId(null); setHover(null); }}
                  className="backlog-card"
                >
                  <div className="backlog-card-title" dangerouslySetInnerHTML={{ __html: b.title }} />
                  <div className="backlog-card-note" dangerouslySetInnerHTML={{ __html: b.note }} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="moscow-grid">
          {BUCKETS.map(bk => (
            <div
              key={bk.id}
              className={classes("moscow-bucket", `moscow-bucket-${bk.accent}`, hover === bk.id && "is-hover", feedback && "is-checked")}
              onDragOver={e => { e.preventDefault(); setHover(bk.id); }}
              onDragLeave={() => setHover(null)}
              onDrop={() => onDrop(bk.id)}
            >
              <div className="moscow-bucket-head">
                <div className="moscow-bucket-name">{bk.name}</div>
                <div className="moscow-bucket-sub">{bk.sub}</div>
              </div>
              <div className="moscow-bucket-body">
                {placed[bk.id].length === 0 && <div className="moscow-bucket-empty">Drop here</div>}
                {placed[bk.id].map(id => {
                  const b = itemById(id);
                  const isWrong = feedback && b.bucket !== bk.id;
                  const isRight = feedback && b.bucket === bk.id;
                  return (
                    <div
                      key={id}
                      draggable={!feedback}
                      onDragStart={() => setDragId(id)}
                      onDragEnd={() => { setDragId(null); setHover(null); }}
                      className={classes("backlog-card backlog-card-placed", isWrong && "is-wrong", isRight && "is-right")}
                    >
                      <div className="backlog-card-title" dangerouslySetInnerHTML={{ __html: b.title }} />
                      {isWrong && (
                        <div className="backlog-card-correction">
                          PO would call this a <em>{BUCKETS.find(x => x.id === b.bucket).name}</em>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!feedback && (
        <div className="pg-stage-actions">
          <button
            className="pg-btn pg-btn-primary"
            disabled={!allPlaced}
            onClick={check}
          >
            {allPlaced ? "Check prioritisation" : `${pool.length} item${pool.length === 1 ? "" : "s"} left`}
          </button>
        </div>
      )}

      {feedback && (
        <>
          <CoachLine
            tone={feedback.wrong === 0 ? "green" : feedback.wrong <= 2 ? "navy" : "amber"}
            title={feedback.wrong === 0 ? "Sharp prioritisation." : `${feedback.correct} aligned · ${feedback.wrong} re-thought`}
            anim
          >
            {feedback.wrong === 0
              ? "Your Musts are the ones that, if cut, sink the sprint. Your Won'ts are honest — not hopeful. That's the discipline MoSCoW exists to enforce."
              : "Ask: ‘if I remove this, does the audit workflow still work end-to-end?' If yes → Should/Could. If no → Must. Mobile-responsive is a Should, not a Must, when desktop is the default user surface."}
          </CoachLine>
          <div className="pg-stage-actions">
            <button className="pg-btn pg-btn-primary" onClick={onNext}>
              Run the sprint board <span className="arr">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── STAGE: ESTIMATE (Story Point Poker) ─────────────────────────── */

function StageEstimate({ onNext, idx, total }) {
  const [active, setActive] = useState(0);
  const [picks, setPicks] = useState({}); // storyId -> chosen points
  const [done, setDone] = useState(false);

  const story = STORIES[active];
  const myPick = picks[story.id];

  const handlePick = (val) => {
    if (myPick !== undefined) return;
    setPicks(p => ({ ...p, [story.id]: val }));
    setTimeout(() => {
      if (active + 1 < STORIES.length) setActive(a => a + 1);
      else setDone(true);
    }, 1400);
  };

  // accuracy = how close picks are to truth on a Fibonacci-step ladder
  const stepIdx = (v) => FIB.indexOf(v);
  const totalDelta = STORIES.reduce((acc, s) => {
    const p = picks[s.id];
    if (p === undefined) return acc;
    return acc + Math.abs(stepIdx(p) - stepIdx(s.truth));
  }, 0);
  const maxDelta = Object.keys(picks).length * (FIB.length - 1);
  const accuracy = maxDelta === 0 ? 0 : Math.round(100 * (1 - totalDelta / maxDelta));
  const velocity = Object.values(picks).reduce((a, b) => a + b, 0);
  const truthVel = STORIES.reduce((a, s) => a + s.truth, 0);

  const stepLabel = (delta) => delta === 0 ? "Spot on" : delta === 1 ? "1 step off" : `${delta} steps off`;

  return (
    <div className="pg-stage pg-stage-estimate">
      <StageHeader
        idx={idx}
        total={total}
        eyebrow="Stage 3 · planning poker"
        title="Estimate each story in Fibonacci points."
        sub="Click the chip you'd hold up in planning. Your accuracy meter and a velocity bar chart update live."
      />

      <div className="est-layout">
        <div className="est-main">
          {!done ? (
            <>
              <div className="est-progress">
                {STORIES.map((s, i) => (
                  <div key={s.id} className={classes("est-dot", i === active && "is-now", picks[s.id] !== undefined && "is-done")} />
                ))}
              </div>

              <div className="est-card">
                <div className="est-card-tag">Story {active + 1} of {STORIES.length}</div>
                <div className="est-card-title">{story.title}</div>
                <div className="est-card-body">{story.body}</div>

                <div className="est-chips">
                  {FIB.map(v => {
                    const isMine = myPick === v;
                    const isTruth = myPick !== undefined && v === story.truth;
                    return (
                      <button
                        key={v}
                        className={classes("est-chip", isMine && "is-mine", isTruth && "is-truth")}
                        onClick={() => handlePick(v)}
                        disabled={myPick !== undefined}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>

                {myPick !== undefined && (
                  <div className={classes("est-feedback", myPick === story.truth ? "is-spot" : "")}>
                    {myPick === story.truth
                      ? <>Spot on — team consensus was <strong>{story.truth}</strong>.</>
                      : <>You picked <strong>{myPick}</strong>; team consensus was <strong>{story.truth}</strong> ({stepLabel(Math.abs(stepIdx(myPick) - stepIdx(story.truth)))}).</>
                    }
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="est-card est-card-done">
              <div className="est-card-tag">Round complete</div>
              <div className="est-card-title">Your sprint forecast</div>
              <div className="est-summary">
                <div className="est-summary-row"><span>Your committed velocity</span><strong>{velocity} pts</strong></div>
                <div className="est-summary-row"><span>Team consensus velocity</span><strong>{truthVel} pts</strong></div>
                <div className="est-summary-row"><span>Estimation accuracy</span><strong className="est-acc">{accuracy}%</strong></div>
              </div>
              <CoachLine tone={accuracy >= 80 ? "green" : accuracy >= 60 ? "navy" : "amber"} title="What the gap means" anim>
                {accuracy >= 80
                  ? "You're calibrated. Your forecast would land — team commits what it can ship."
                  : accuracy >= 60
                  ? "Mostly aligned. The misses are usually on stories with hidden complexity — ask 'what could go wrong?' before sizing."
                  : "Over- or under-estimating both hurt — under-committing wastes capacity, over-committing burns morale. Use the Fibonacci jumps deliberately: 3 means small, 8 means big, 13 means 'too big, split it.'"}
              </CoachLine>
            </div>
          )}
        </div>

        <aside className="est-side">
          <div className="est-gauge">
            <div className="est-gauge-head">Live accuracy</div>
            <div className="est-gauge-ring">
              <svg viewBox="0 0 120 120" className="gauge-svg">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(20,60,92,0.08)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#gaugeGrad)"
                        strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${(accuracy / 100) * 314} 314`}
                        transform="rotate(-90 60 60)"
                        style={{ transition: "stroke-dasharray 0.6s ease" }} />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#1FA565" />
                    <stop offset="1" stopColor="#0F7A47" />
                  </linearGradient>
                </defs>
                <text x="60" y="58" textAnchor="middle" className="gauge-val">{accuracy}</text>
                <text x="60" y="76" textAnchor="middle" className="gauge-lbl">% calibrated</text>
              </svg>
            </div>

            <div className="est-bars-head">Your estimate vs team</div>
            <div className="est-bars">
              {STORIES.map((s, i) => {
                const p = picks[s.id];
                const mineW = p !== undefined ? (p / 13) * 100 : 0;
                const truthW = (s.truth / 13) * 100;
                return (
                  <div key={s.id} className="est-bar-row">
                    <div className="est-bar-lbl">S{i + 1}</div>
                    <div className="est-bar-track">
                      <div className="est-bar-truth" style={{ width: `${truthW}%` }} title={`Team: ${s.truth}`} />
                      <div className="est-bar-mine" style={{ width: `${mineW}%` }} title={`You: ${p ?? "—"}`} />
                    </div>
                    <div className="est-bar-num">{p ?? "—"}<span>/{s.truth}</span></div>
                  </div>
                );
              })}
            </div>
            <div className="est-bars-legend">
              <span><i className="lg-mine" /> your pick</span>
              <span><i className="lg-truth" /> team consensus</span>
            </div>
          </div>
        </aside>
      </div>

      {done && (
        <div className="pg-stage-actions">
          <button className="pg-btn pg-btn-ghost" onClick={() => { setPicks({}); setActive(0); setDone(false); }}>Re-estimate</button>
          <button className="pg-btn pg-btn-primary" onClick={onNext}>Onto the sprint board <span className="arr">→</span></button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── STAGE 4: SPRINT BOARD ─────────────────────────── */

function StageBoard({ onNext, idx, total }) {
  const [tickets, setTickets] = useState(() => TICKETS.map(t => ({ ...t })));
  const [day, setDay] = useState(0); // 0 = sprint not started yet
  const [eventIdx, setEventIdx] = useState(-1);
  const [seenEvents, setSeenEvents] = useState([]); // ids of events advanced past
  const [dragId, setDragId] = useState(null);
  const [hoverCol, setHoverCol] = useState(null);
  const [eventDecision, setEventDecision] = useState(null);

  const totalPts = useMemo(() => tickets.reduce((s, t) => s + t.pts, 0), [tickets]);
  const remainingPts = useMemo(
    () => tickets.filter(t => t.col !== "done").reduce((s, t) => s + t.pts, 0),
    [tickets]
  );
  const donePts = totalPts - remainingPts;

  const activeEvent = eventIdx >= 0 ? EVENTS[eventIdx] : null;
  const isLastDay = day >= 10;

  // burndown trajectory — recorded each day
  const [burndown, setBurndown] = useState([{ day: 0, remaining: TICKETS.reduce((s, t) => s + t.pts, 0) }]);

  const advanceToNextEvent = () => {
    if (eventIdx + 1 >= EVENTS.length) return;
    const next = eventIdx + 1;
    setEventIdx(next);
    setEventDecision(null);
    const ev = EVENTS[next];
    setDay(ev.day);
    setBurndown(b => {
      const last = b[b.length - 1];
      // fill days between
      const fills = [];
      for (let d = last.day + 1; d <= ev.day; d++) {
        fills.push({ day: d, remaining: remainingPts });
      }
      return [...b, ...fills];
    });
  };

  const handleDropCol = (colId) => {
    if (!dragId) return;
    setTickets(ts => ts.map(t => t.id === dragId ? { ...t, col: colId } : t));
    setHoverCol(null);
  };

  // recompute burndown when remaining changes
  useEffect(() => {
    setBurndown(b => {
      if (b.length === 0) return b;
      const last = b[b.length - 1];
      if (last.day === day) {
        return [...b.slice(0, -1), { day, remaining: remainingPts }];
      }
      return [...b, { day, remaining: remainingPts }];
    });
    // eslint-disable-next-line
  }, [remainingPts]);

  const finishSprint = () => {
    setSeenEvents(s => [...s, eventIdx]);
    onNext();
  };

  const ticketsByCol = (col) => tickets.filter(t => t.col === col);

  return (
    <div className="pg-stage pg-stage-board">
      <StageHeader
        idx={idx}
        total={total}
        eyebrow="Stage 5 · sprint mechanics"
        title="Run the sprint — day by day."
        sub={`${TICKETS.length} essential tickets, ten days. Make four sprint calls, move work across the board, and watch the burndown react.`}
      />

      <div className="board-meta">
        <div className="board-meta-l">
          <div className="board-day">
            <div className="board-day-lbl">Sprint day</div>
            <div className="board-day-num">{day} <span>/ 10</span></div>
          </div>
          <div className="board-pts">
            <div className="board-pts-lbl">Done</div>
            <div className="board-pts-num">{donePts} <span>/ {totalPts} pts</span></div>
            <div className="board-pts-bar">
              <div className="board-pts-fill" style={{ width: `${(donePts / totalPts) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="board-meta-r">
          {!isLastDay && (
            <button className="pg-btn pg-btn-primary pg-btn-sm" onClick={advanceToNextEvent}>
              {eventIdx < 0 ? "Start day 1 →" : `Advance to day ${EVENTS[Math.min(eventIdx + 1, EVENTS.length - 1)].day} →`}
            </button>
          )}
          {isLastDay && (
            <button className="pg-btn pg-btn-primary pg-btn-sm" onClick={finishSprint}>
              End sprint &amp; go to retro <span className="arr">→</span>
            </button>
          )}
        </div>
      </div>

      <div className="board-row">
        <div className="board-cols">
          {COLUMNS.map(col => (
            <div
              key={col.id}
              className={classes("board-col", `board-col-${col.id}`, hoverCol === col.id && "is-hover")}
              onDragOver={e => { e.preventDefault(); setHoverCol(col.id); }}
              onDragLeave={() => setHoverCol(null)}
              onDrop={() => handleDropCol(col.id)}
            >
              <div className="board-col-head">
                <span>{col.name}</span>
                <span className="board-col-count">{ticketsByCol(col.id).length}</span>
              </div>
              <div className="board-col-body">
                {ticketsByCol(col.id).length === 0 && (
                  <div className="board-col-empty">—</div>
                )}
                {ticketsByCol(col.id).map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setHoverCol(null); }}
                    className="board-ticket"
                  >
                    <div className="board-ticket-id">{t.id.toUpperCase()}</div>
                    <div className="board-ticket-title" dangerouslySetInnerHTML={{ __html: t.title }} />
                    <div className="board-ticket-foot">
                      <span className="board-ticket-pts">{t.pts} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="board-side">
          <Burndown points={burndown} total={totalPts} />

          {activeEvent ? (
            <div className={classes("board-event", `board-event-${activeEvent.type}`)}>
              <div className="board-event-day">Day {activeEvent.day}</div>
              <div className="board-event-title">{activeEvent.title}</div>
              <div className="board-event-body">{activeEvent.body}</div>
              {EVENT_DECISIONS[activeEvent.type] && (
                <div className="board-decision">
                  <div className="board-decision-label">Your call</div>
                  <div className="board-decision-options">
                    {EVENT_DECISIONS[activeEvent.type].map(option => (
                      <button
                        key={option.id}
                        className={classes(
                          "board-decision-btn",
                          eventDecision === option.id && "is-selected",
                          eventDecision === option.id && option.best && "is-best",
                          eventDecision === option.id && !option.best && "is-risk"
                        )}
                        onClick={() => setEventDecision(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {eventDecision && (
                    <div className={classes(
                      "board-decision-note",
                      EVENT_DECISIONS[activeEvent.type].find(o => o.id === eventDecision).best ? "is-best" : "is-risk"
                    )}>
                      {EVENT_DECISIONS[activeEvent.type].find(o => o.id === eventDecision).note}
                    </div>
                  )}
                </div>
              )}
              <CoachLine tone="navy" title="Scrum Master scaffold">
                {activeEvent.coach}
              </CoachLine>
            </div>
          ) : (
            <div className="board-event board-event-intro">
              <div className="board-event-title">Sprint ready to start</div>
            <div className="board-event-body">
                You have {TICKETS.length} tickets totalling {totalPts} story points and 10 working days.
                Hit <em>Start day 1</em> when ready.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── BURNDOWN CHART ─────────────────────────── */

function Burndown({ points, total }) {
  const W = 320, H = 160, PAD = 28;
  const days = 10;
  const xs = (d) => PAD + (d / days) * (W - PAD * 2);
  const ys = (p) => PAD + (1 - p / total) * (H - PAD * 2);

  const ideal = `M ${xs(0)} ${ys(total)} L ${xs(days)} ${ys(0)}`;
  const actual = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs(p.day)} ${ys(p.remaining)}`).join(" ");

  return (
    <div className="burn">
      <div className="burn-head">
        <div className="burn-title">Sprint burndown</div>
        <div className="burn-sub">remaining story points · days 0 → 10</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="burn-svg">
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1={PAD} y1={PAD + t * (H - PAD * 2)} x2={W - PAD} y2={PAD + t * (H - PAD * 2)}
                stroke="rgba(20,60,92,0.07)" strokeWidth="1" />
        ))}
        {/* ideal */}
        <path className="burn-ideal" d={ideal} fill="none" stroke="rgba(20,60,92,0.3)" strokeWidth="1.6" strokeDasharray="4 4" />
        {/* actual */}
        <path className="burn-actual" d={actual} fill="none" stroke="#1FA565" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle className="burn-dot" key={i} cx={xs(p.day)} cy={ys(p.remaining)} r="3" fill="#1FA565" />
        ))}
        {/* axis labels */}
        <text x={PAD} y={H - 8} className="burn-lbl">day 0</text>
        <text x={W - PAD - 24} y={H - 8} className="burn-lbl">day 10</text>
        <text x={4} y={ys(0) + 4} className="burn-lbl">0</text>
        <text x={4} y={ys(total) + 4} className="burn-lbl">{total}</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────── STAGE 5: RETRO + REPORT ─────────────────────────── */

function StageRetro({ onNext, idx, total }) {
  const [pool, setPool] = useState(() => RETRO_CARDS.map(c => c.id));
  const [placed, setPlaced] = useState({ start: [], stop: [], continue: [] });
  const [dragId, setDragId] = useState(null);
  const [hover, setHover] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const cardById = (id) => RETRO_CARDS.find(c => c.id === id);

  const onDrop = (bucket) => {
    if (!dragId) return;
    setPool(p => p.filter(x => x !== dragId));
    setPlaced(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = next[k].filter(x => x !== dragId);
      next[bucket] = [...next[bucket], dragId];
      return next;
    });
    setHover(null);
  };

  const allPlaced = pool.length === 0;

  const check = () => {
    let correct = 0;
    Object.entries(placed).forEach(([bucket, ids]) => {
      ids.forEach(id => {
        if (cardById(id).target === bucket) correct++;
      });
    });
    setFeedback({ correct, total: RETRO_CARDS.length });
  };

  return (
    <div className="pg-stage pg-stage-retro">
      <StageHeader
        idx={idx}
        total={total}
        eyebrow="Stage 6 · close the loop"
        title="Run the retrospective."
        sub="Four sprint observations are enough to teach the retro muscle: Start, Stop, Continue."
      />

      <div className="retro-layout">
        <div
          className="retro-pool"
          onDragOver={e => e.preventDefault()}
          onDrop={() => {}}
        >
          <div className="retro-pool-head">Sprint observations</div>
          <div className="retro-pool-list">
            {pool.length === 0 && <div className="retro-pool-empty">All observations sorted.</div>}
            {pool.map(id => (
              <div
                key={id}
                draggable
                onDragStart={() => setDragId(id)}
                onDragEnd={() => { setDragId(null); setHover(null); }}
                className="retro-card"
              >
                {cardById(id).text}
              </div>
            ))}
          </div>
        </div>
        <div className="retro-buckets">
          {RETRO_BUCKETS.map(bk => (
            <div
              key={bk.id}
              className={classes("retro-bucket", `retro-bucket-${bk.id}`, hover === bk.id && "is-hover")}
              onDragOver={e => { e.preventDefault(); setHover(bk.id); }}
              onDragLeave={() => setHover(null)}
              onDrop={() => onDrop(bk.id)}
            >
              <div className="retro-bucket-head">
                <div className="retro-bucket-name">{bk.name}</div>
                <div className="retro-bucket-sub">{bk.sub}</div>
              </div>
              <div className="retro-bucket-body">
                {placed[bk.id].length === 0 && <div className="retro-bucket-empty">Drop here</div>}
                {placed[bk.id].map(id => {
                  const c = cardById(id);
                  const isRight = feedback && c.target === bk.id;
                  const isWrong = feedback && c.target !== bk.id;
                  return (
                    <div key={id}
                         draggable={!feedback}
                         onDragStart={() => setDragId(id)}
                         onDragEnd={() => { setDragId(null); setHover(null); }}
                         className={classes("retro-card retro-card-placed", isRight && "is-right", isWrong && "is-wrong")}>
                      {c.text}
                      {isWrong && <div className="retro-card-correction">Belongs in <em>{RETRO_BUCKETS.find(x => x.id === c.target).name}</em></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!feedback && (
        <div className="pg-stage-actions">
          <button className="pg-btn pg-btn-primary" disabled={!allPlaced} onClick={check}>
            {allPlaced ? "Run the retrospective" : `${pool.length} card${pool.length === 1 ? "" : "s"} left`}
          </button>
        </div>
      )}

      {feedback && (
        <>
          <CoachLine
            tone={feedback.correct === feedback.total ? "green" : "navy"}
            title={`${feedback.correct} of ${feedback.total} in the right column`}
            anim
          >
            {feedback.correct === feedback.total
              ? "You separated process from outcome — the hardest retro skill. Blameless reflection is what compounds team performance sprint over sprint."
              : "Habits to build go in Start. Patterns hurting you go in Stop. Wins to protect go in Continue. The trap is putting outcomes in Continue when the behaviour that caused them belongs there instead."}
          </CoachLine>
          <div className="pg-stage-actions">
            <button className="pg-btn pg-btn-primary" onClick={onNext}>
              See your scorecard <span className="arr">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── FINAL REPORT ─────────────────────────── */

function StageReport({ onRestart, idx, total }) {
  // We'd ideally pull real per-stage scores; for the demo we synthesise from
  // a reasonable baseline that feels earned after the run.
  const scores = [
    { name: "Role clarity", val: 86, body: "Strong grasp of the PO/SM/Dev boundary." },
    { name: "Prioritisation", val: 78, body: "Clean MoSCoW sort with healthy ruthlessness on Won'ts." },
    { name: "Sprint mechanics", val: 82, body: "WIP discipline held; you moved tickets the day they shipped." },
    { name: "Retrospective discipline", val: 88, body: "Behaviour-level reflection, not outcome blaming." },
    { name: "Overall Scrum readiness", val: 84, body: "Ready to coach a new team through a first sprint." },
  ];
  return (
    <div className="pg-stage pg-stage-report">
      <StageHeader
        idx={idx}
        total={total}
        eyebrow="Stage 7 · scorecard"
        title="Your Scrum readiness — first run."
        sub="Every stage feeds a different dimension. In a real cohort, your CHRO sees these scores aggregated across the team."
      />

      <div className="report-grid">
        {scores.map((s, i) => (
          <div className="report-card" key={s.name} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="report-card-bar">
              <div className="report-card-bar-fill" style={{ "--w": `${s.val}%` }} />
            </div>
            <div className="report-card-val">{s.val}<span>/100</span></div>
            <div className="report-card-name">{s.name}</div>
            <div className="report-card-body">{s.body}</div>
          </div>
        ))}
      </div>

      <CoachLine tone="navy" title="What this means for a real pilot" anim>
        In the FocusChain platform, this scorecard becomes your skill profile.
        The dimensions you scored lowest on auto-prescribe modules in your
        personalised learning path — and reassess every quarter to prove lift.
      </CoachLine>

      <div className="pg-stage-actions">
        <button className="pg-btn pg-btn-ghost" onClick={onRestart}>Play again</button>
        <a className="pg-btn pg-btn-primary" href="mailto:queries@focuschainlabs.com">
          Bring this to my team <span className="arr">→</span>
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────────── APP ─────────────────────────── */

function PlaygroundApp() {
  const [stage, setStage] = useState(0);

  const goNext = () => setStage(s => Math.min(s + 1, STAGES.length - 1));
  const goTo = (i) => setStage(i);
  const restart = () => setStage(0);

  // Notify host for reveal rescans on stage change
  useEffect(() => {
    if (window.__scanReveals) window.__scanReveals();
    // smooth scroll to top of playground shell
    const el = document.querySelector(".playground-shell");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [stage]);

  return (
    <div className="pg-shell">
      <div className="pg-status">
        <div className="pg-status-main">
          <span>Project management playground</span>
          <strong>Compass sprint simulation</strong>
        </div>
        <div className="pg-status-meter" aria-hidden="true">
          <i style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} />
        </div>
        <div className="pg-status-kpis">
          <span>Selection</span>
          <span>Match</span>
          <span>Drag</span>
          <span>Charts</span>
        </div>
      </div>
      <div className="pg-rail">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            className={classes("pg-rail-item", i === stage && "is-active", i < stage && "is-done")}
            onClick={() => goTo(i)}
          >
            <span className="pg-rail-num">{i + 1}</span>
            <span className="pg-rail-name" dangerouslySetInnerHTML={{ __html: s.name }} />
          </button>
        ))}
      </div>

      <div className="pg-canvas">
        {stage === 0 && <StageBrief onNext={goNext} idx={0} total={STAGES.length} />}
        {stage === 1 && <StageRoles onNext={goNext} idx={1} total={STAGES.length} />}
        {stage === 2 && <StageMoSCoW onNext={goNext} idx={2} total={STAGES.length} />}
        {stage === 3 && <StageEstimate onNext={goNext} idx={3} total={STAGES.length} />}
        {stage === 4 && <StageBoard onNext={goNext} idx={4} total={STAGES.length} />}
        {stage === 5 && <StageRetro onNext={goNext} idx={5} total={STAGES.length} />}
        {stage === 6 && <StageReport onRestart={restart} idx={6} total={STAGES.length} />}
      </div>
    </div>
  );
}

/* ─────────────────────────── MOUNT ─────────────────────────── */

const _pgRoot = document.getElementById("playground-root");
if (_pgRoot) {
  ReactDOM.createRoot(_pgRoot).render(<PlaygroundApp />);
}
