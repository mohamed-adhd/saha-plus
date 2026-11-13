"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { regionDetails, todaySummary, type LogKind, type RegionDetail, type RegionId } from "../../data/mockHealth";
import AnatomyFigure from "./AnatomyFigure";
import { CHAPTERS, LAYER_LABELS, LAYER_ORDER, type Camera, type Chapter } from "./chapters";
import { BODY_PATH, FIGURE_BOTTOM, FIGURE_TOP, type Layer, type OrganId } from "./geometry";

type Props = { onSignOut: () => void };

/* ------------------------------------------------------------------ scroll timeline */

const TOTAL_LENGTH = CHAPTERS.reduce((sum, chapter) => sum + chapter.length, 0);
const CHAPTER_STARTS = CHAPTERS.map((_, index) => CHAPTERS.slice(0, index).reduce((sum, chapter) => sum + chapter.length, 0));
/** Fraction of each chapter spent holding its framing before travelling to the next one. */
const HOLD = 0.62;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (t: number) => t * t * (3 - 2 * t);

type Sample = { camera: Camera; active: number; chapterProgress: number; calloutAlpha: number };

/** Maps overall scroll progress (0–1) to a camera framing and the chapter in view. */
function sampleTimeline(progress: number): Sample {
  const position = progress * TOTAL_LENGTH;
  let index = CHAPTERS.length - 1;
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (position < CHAPTER_STARTS[i] + CHAPTERS[i].length) { index = i; break; }
  }
  const chapter = CHAPTERS[index];
  const local = clamp((position - CHAPTER_STARTS[index]) / chapter.length);
  const next = CHAPTERS[index + 1];
  const travel = next ? smooth(clamp((local - HOLD) / (1 - HOLD))) : 0;
  const from = chapter.camera;
  const to = next?.camera ?? from;
  const zoom = Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * travel);
  return {
    camera: { x: from.x + (to.x - from.x) * travel, y: from.y + (to.y - from.y) * travel, zoom },
    active: travel < 0.5 ? index : index + 1,
    chapterProgress: travel < 0.5 ? clamp(local / HOLD) : 0,
    calloutAlpha: Math.abs(1 - travel * 2) ** 1.6,
  };
}

/** Scroll offset that lands in the middle of a chapter's hold. */
function scrollTopForChapter(track: HTMLElement, index: number) {
  const top = track.getBoundingClientRect().top + window.scrollY;
  const scrollable = track.offsetHeight - window.innerHeight;
  const position = CHAPTER_STARTS[index] + CHAPTERS[index].length * (index === 0 ? 0 : HOLD * 0.45);
  return top + (position / TOTAL_LENGTH) * scrollable;
}

/* ------------------------------------------------------------------ small pieces */

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min || 1;
  const coords = points.map((point, index) => `${(index / (points.length - 1)) * 100},${26 - ((point - min) / span) * 22}`).join(" ");
  const last = coords.split(" ").at(-1)?.split(",") ?? ["100", "4"];
  return <svg className="atlas-spark" viewBox="-2 0 104 30" preserveAspectRatio="none" aria-hidden="true">
    <polyline points={coords} /><circle cx={last[0]} cy={last[1]} r="2.4" />
  </svg>;
}

function Rings() {
  const rings = [
    { key: "move", r: 34, value: todaySummary.move },
    { key: "exercise", r: 26, value: todaySummary.exercise },
    { key: "stand", r: 18, value: todaySummary.stand },
  ];
  return <svg className="atlas-rings" viewBox="0 0 84 84" role="img" aria-label={`Activity goals: move ${Math.round(todaySummary.move * 100)}%, exercise ${Math.round(todaySummary.exercise * 100)}%, stand ${Math.round(todaySummary.stand * 100)}%`}>
    {rings.map((ring) => <g key={ring.key} className={`ring ring-${ring.key}`}>
      <circle cx="42" cy="42" r={ring.r} pathLength={100} className="ring-track" />
      <circle cx="42" cy="42" r={ring.r} pathLength={100} className="ring-value" style={{ "--ring": ring.value * 100 } as CSSProperties} />
    </g>)}
  </svg>;
}

const LOG_COPY: Record<LogKind, { title: string; overline: string; submit: string }> = {
  water: { title: "Log water", overline: "Hydration", submit: "Save water" },
  workout: { title: "Log activity", overline: "Movement", submit: "Save activity" },
  note: { title: "Add a reflection", overline: "Mind", submit: "Save note" },
};

/* ------------------------------------------------------------------ chapter panel */

function RegionContent({ detail, onLog }: { detail: RegionDetail; onLog: (kind: LogKind) => void }) {
  return <>
    <div className="atlas-status">
      <span className={`atlas-chip ${detail.status === "Good" ? "is-good" : "is-warn"}`}><i aria-hidden="true" />{detail.status}</span>
      <span className="atlas-headline">{detail.headline}</span>
    </div>
    <dl className="atlas-stats">
      {detail.stats.map((stat) => <div className="atlas-stat" key={stat.label}>
        <dt>{stat.label}</dt><dd>{stat.value}</dd><Sparkline points={stat.points} />
      </div>)}
    </dl>
    <button className="atlas-button is-primary" type="button" onClick={() => onLog(detail.action.log)}>
      {detail.action.label}<span aria-hidden="true">+</span>
    </button>
  </>;
}

function ChapterPanel({ chapter, index, details, onLog, onJump }: { chapter: Chapter; index: number; details: Record<RegionId, RegionDetail>; onLog: (kind: LogKind) => void; onJump: (index: number) => void }) {
  const regionDetail = chapter.id in details ? details[chapter.id as RegionId] : null;
  return <div className="atlas-panel-inner" key={chapter.id}>
    <span className="atlas-kicker"><i aria-hidden="true" />{chapter.kicker}</span>
    <h2 className="atlas-title">{chapter.title}<br /><em>{chapter.titleAccent}</em></h2>
    <p className="atlas-body">{chapter.body}</p>
    {regionDetail && <RegionContent detail={regionDetail} onLog={onLog} />}
    {chapter.id === "overview" && <>
      <div className="atlas-today">
        <Rings />
        <div>
          <span className="atlas-overline">Today</span>
          <div className="atlas-today-stats">
            <span><strong>{todaySummary.score}<small>/100</small></strong><small>wellness score</small></span>
            <span><strong>{todaySummary.streak}</strong><small>day streak</small></span>
          </div>
        </div>
      </div>
      <button className="atlas-button is-primary" type="button" onClick={() => onJump(1)}>Start the tour<span aria-hidden="true">↓</span></button>
    </>}
    {chapter.id === "summary" && <>
      <div className="atlas-summary-grid">
        {CHAPTERS.slice(1, 5).map((item, offset) => {
          const detail = details[item.id as RegionId];
          return <button type="button" className="atlas-summary-card" key={item.id} onClick={() => onJump(offset + 1)}>
            <span className={`atlas-dot ${detail.status === "Good" ? "is-good" : "is-warn"}`} aria-hidden="true" />
            <strong>{item.kicker.replace(/^\d+ · /, "")}</strong>
            <small>{detail.headline}</small>
          </button>;
        })}
      </div>
      <button className="atlas-button" type="button" onClick={() => onJump(0)}>Back to top<span aria-hidden="true">↑</span></button>
    </>}
    {index > 0 && index < CHAPTERS.length - 1 && <div className="atlas-chapter-meter" aria-hidden="true"><span>{String(index).padStart(2, "0")}</span><i><b /></i><span>04</span></div>}
  </div>;
}

/* ------------------------------------------------------------------ main */

export default function BodyAtlas({ onSignOut }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const calloutLayerRef = useRef<HTMLDivElement>(null);
  const leaderRefs = useRef<Array<SVGPathElement | null>>([]);
  const dotRefs = useRef<Array<SVGCircleElement | null>>([]);
  const labelRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const minimapRectRef = useRef<SVGRectElement>(null);
  const kickRef = useRef<() => void>(() => undefined);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [active, setActive] = useState(0);
  const [layerOverrides, setLayerOverrides] = useState<Partial<Record<Layer, boolean>>>({});
  const [hoverOrgan, setHoverOrgan] = useState<OrganId | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [logKind, setLogKind] = useState<LogKind>("water");
  const [logs, setLogs] = useState({ glasses: 0, minutes: 0, notes: [] as string[] });
  const [toast, setToast] = useState("");

  const chapter = CHAPTERS[active];
  const activeRef = useRef(active);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  // Each chapter starts from its own recommended layers.
  useEffect(() => { setLayerOverrides({}); setHoverOrgan(null); }, [active]);

  /* The render loop only runs while scroll, resize or camera easing needs it. */
  useEffect(() => {
    const camera: Camera = { ...CHAPTERS[0].camera };
    let frame = 0;
    let last = 0;
    let initialised = false;

    const render = (now: number) => {
      frame = 0;
      const track = trackRef.current, stage = stageRef.current, viewport = viewportRef.current;
      if (!track || !stage || !viewport) return;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;

      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-track.getBoundingClientRect().top / scrollable);
      const sample = sampleTimeline(progress);
      const ease = reducedMotion || !initialised ? 1 : 1 - Math.exp(-dt * 7);
      initialised = true;
      camera.x += (sample.camera.x - camera.x) * ease;
      camera.y += (sample.camera.y - camera.y) * ease;
      camera.zoom = Math.exp(Math.log(camera.zoom) + (Math.log(sample.camera.zoom) - Math.log(camera.zoom)) * ease);

      const stageBox = stage.getBoundingClientRect();
      const box = viewport.getBoundingClientRect();
      const vx = box.left - stageBox.left, vy = box.top - stageBox.top;
      const fitScale = Math.min((box.height * 0.92) / (FIGURE_BOTTOM - FIGURE_TOP), (box.width * 0.9) / 400);
      const scale = fitScale * camera.zoom;
      const tx = vx + box.width / 2 - camera.x * scale;
      const ty = vy + box.height / 2 - camera.y * scale;
      cameraRef.current?.setAttribute("transform", `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`);

      progressRef.current?.style.setProperty("transform", `scaleX(${progress.toFixed(4)})`);
      panelRef.current?.style.setProperty("--chapter-progress", sample.chapterProgress.toFixed(3));

      const minimap = minimapRectRef.current;
      if (minimap) {
        const x0 = (vx - tx) / scale, y0 = (vy - ty) / scale;
        minimap.setAttribute("x", x0.toFixed(1));
        minimap.setAttribute("y", y0.toFixed(1));
        minimap.setAttribute("width", (box.width / scale).toFixed(1));
        minimap.setAttribute("height", (box.height / scale).toFixed(1));
      }

      if (sample.active !== activeRef.current) {
        activeRef.current = sample.active;
        setActive(sample.active);
      }

      // Callouts: anchors follow the camera; labels stack in a column beside the figure.
      const layer = calloutLayerRef.current;
      const callouts = CHAPTERS[activeRef.current].callouts;
      if (layer) {
        layer.style.opacity = sample.calloutAlpha.toFixed(3);
        layer.dataset.interactive = sample.calloutAlpha > 0.6 ? "true" : "false";
        const compact = stageBox.width < 760;
        const gap = compact ? 34 : 60;
        const labelWidth = compact ? 112 : 196;
        const anchors = callouts.map((callout) => ({ x: tx + callout.at[0] * scale, y: ty + callout.at[1] * scale }));
        const order = anchors.map((_, index) => index).sort((a, b) => anchors[a].y - anchors[b].y);
        const ys: number[] = [];
        const top = vy + 18, bottom = vy + box.height - 18;
        order.forEach((index, position) => {
          const y = clamp(anchors[index].y, top, bottom);
          ys[index] = position === 0 ? y : Math.max(y, ys[order[position - 1]] + gap);
        });
        const overflow = ys[order[order.length - 1]] - bottom;
        if (overflow > 0) order.forEach((index) => { ys[index] -= overflow; });
        const furthest = Math.max(...anchors.map((anchor) => anchor.x));
        const labelX = clamp(furthest + (compact ? 22 : 48), vx, vx + box.width - labelWidth);
        anchors.forEach((anchor, index) => {
          const y = ys[index];
          dotRefs.current[index]?.setAttribute("cx", anchor.x.toFixed(1));
          dotRefs.current[index]?.setAttribute("cy", anchor.y.toFixed(1));
          leaderRefs.current[index]?.setAttribute("d", `M${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}L${(labelX - 14).toFixed(1)} ${y.toFixed(1)}H${(labelX - 4).toFixed(1)}`);
          const label = labelRefs.current[index];
          if (label) label.style.transform = `translate(${labelX.toFixed(1)}px, ${y.toFixed(1)}px) translateY(-50%)`;
        });
      }

      const settled = Math.abs(sample.camera.y - camera.y) < 0.05 && Math.abs(sample.camera.x - camera.x) < 0.05 && Math.abs(sample.camera.zoom / camera.zoom - 1) < 0.0005;
      if (!settled) frame = requestAnimationFrame(render);
      else last = 0;
    };

    const kick = () => { if (!frame) frame = requestAnimationFrame(render); };
    kickRef.current = kick;
    const resizeObserver = new ResizeObserver(kick);
    if (stageRef.current) resizeObserver.observe(stageRef.current);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, [reducedMotion]);

  // Newly mounted callouts need positions before they are seen.
  useEffect(() => { kickRef.current(); }, [active]);

  const jumpTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    window.scrollTo({ top: scrollTopForChapter(track, index), behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  const visibleLayers = useMemo(() => LAYER_ORDER.filter((layer) => layerOverrides[layer] ?? chapter.layers.includes(layer)), [chapter, layerOverrides]);

  const details = useMemo(() => {
    const hydration = 1.6 + logs.glasses * 0.25;
    const activeMinutes = 42 + logs.minutes;
    const core = regionDetails["core-digestion"];
    const legs = regionDetails["legs-strength"];
    const head = regionDetails["head-mind"];
    return {
      ...regionDetails,
      "core-digestion": {
        ...core,
        status: hydration >= 2.5 ? "Good" : "Needs attention",
        headline: `${hydration.toFixed(1)} of 2.5 L water`,
        stats: core.stats.map((stat) => stat.label === "Hydration" ? { ...stat, value: `${hydration.toFixed(1)} L`, points: [...stat.points.slice(1), Math.min(10, 7 + logs.glasses)] } : stat),
      },
      "legs-strength": { ...legs, stats: legs.stats.map((stat) => stat.label === "Active time" ? { ...stat, value: `${activeMinutes} min` } : stat) },
      "head-mind": logs.notes.length ? { ...head, headline: `${logs.notes.length} reflection${logs.notes.length > 1 ? "s" : ""} today` } : head,
    } satisfies Record<RegionId, RegionDetail>;
  }, [logs]);

  const openLog = useCallback((kind: LogKind) => {
    setLogKind(kind);
    dialogRef.current?.showModal();
  }, []);

  function submitLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    let message = "";
    if (logKind === "water") {
      const glasses = Number(data.get("glasses"));
      if (!Number.isInteger(glasses) || glasses < 1 || glasses > 12) return;
      setLogs((current) => ({ ...current, glasses: current.glasses + glasses }));
      message = `${glasses} glass${glasses > 1 ? "es" : ""} of water logged`;
    } else if (logKind === "workout") {
      const minutes = Number(data.get("minutes"));
      const activity = String(data.get("activity") ?? "").trim().slice(0, 60);
      if (!activity || !Number.isFinite(minutes) || minutes < 1 || minutes > 600) return;
      setLogs((current) => ({ ...current, minutes: current.minutes + Math.round(minutes) }));
      message = `${activity} · ${Math.round(minutes)} min logged`;
    } else {
      const note = String(data.get("note") ?? "").trim().slice(0, 280);
      if (!note) return;
      setLogs((current) => ({ ...current, notes: [...current.notes, note] }));
      message = "Reflection saved";
    }
    form.reset();
    dialogRef.current?.close();
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }

  const figureClass = [
    "atlas-figure",
    `focus-${chapter.focus}`,
    ...visibleLayers.map((layer) => `show-${layer}`),
    hoverOrgan ? `hl-${hoverOrgan}` : "",
  ].join(" ");

  return <main className="atlas-shell">
    <header className="atlas-header">
      <a className="atlas-brand" href="#top" onClick={(event) => { event.preventDefault(); jumpTo(0); }} aria-label="Saha Plus, back to overview">
        <span className="brand-symbol" aria-hidden="true">+</span>saha<span>plus</span>
      </a>
      <nav className="atlas-nav" aria-label="Body regions">
        {CHAPTERS.map((item, index) => <button key={item.id} type="button" className={index === active ? "is-active" : ""} aria-current={index === active ? "step" : undefined} onClick={() => jumpTo(index)}>
          {index > 0 && index < CHAPTERS.length - 1 && <small aria-hidden="true">0{index}</small>}{item.nav}
        </button>)}
      </nav>
      <div className="atlas-header-actions">
        <button type="button" className="atlas-icon-button is-log" onClick={() => openLog("water")}><span aria-hidden="true">+</span><b>Quick log</b></button>
        <button type="button" className="atlas-icon-button" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M14 8l4 4-4 4M8 12h10" /></svg>
        </button>
      </div>
      <span className="atlas-progress" aria-hidden="true"><span ref={progressRef} /></span>
    </header>

    <div className="atlas-track" ref={trackRef} style={{ height: `${TOTAL_LENGTH * 100}svh` }}>
      <div className="atlas-stage" ref={stageRef}>
        <div className="atlas-grid" aria-hidden="true" />
        <div className="atlas-viewport" ref={viewportRef} />

        <svg className={figureClass} role="img" aria-label={`Anatomical illustration of the human body, focused on ${chapter.kicker.replace(/^\d+ · /, "").toLowerCase()}`}>
          <AnatomyFigure cameraRef={cameraRef} onOrganHover={setHoverOrgan} animate={!reducedMotion} />
        </svg>

        <div className="atlas-callouts" ref={calloutLayerRef}>
          <svg className="atlas-leaders" aria-hidden="true">
            {chapter.callouts.map((callout, index) => <g key={callout.id} className={hoverOrgan && callout.organ === hoverOrgan ? "is-hl" : ""}>
              <path ref={(element) => { leaderRefs.current[index] = element; }} />
              <circle ref={(element) => { dotRefs.current[index] = element; }} r="3.5" />
            </g>)}
          </svg>
          {chapter.callouts.map((callout, index) => {
            const target = callout.target;
            const targetIndex = target ? CHAPTERS.findIndex((item) => item.id === target) : -1;
            return <button
              key={callout.id}
              type="button"
              ref={(element) => { labelRefs.current[index] = element; }}
              className={`atlas-callout${hoverOrgan && callout.organ === hoverOrgan ? " is-hl" : ""}${target ? " is-link" : ""}`}
              onPointerEnter={() => setHoverOrgan(callout.organ ?? null)}
              onPointerLeave={() => setHoverOrgan(null)}
              onFocus={() => setHoverOrgan(callout.organ ?? null)}
              onBlur={() => setHoverOrgan(null)}
              onClick={() => { if (targetIndex >= 0) jumpTo(targetIndex); }}
              aria-label={`${callout.title}: ${callout.detail}`}
            >
              <strong>{callout.title}{target && <span aria-hidden="true"> →</span>}</strong>
              <small>{target ? details[target].headline : callout.detail}</small>
            </button>;
          })}
        </div>

        <section className="atlas-panel" ref={panelRef} aria-live="polite" aria-labelledby={undefined}>
          <ChapterPanel chapter={chapter} index={active} details={details} onLog={openLog} onJump={jumpTo} />
        </section>

        <div className="atlas-layers" role="group" aria-label="Anatomy layers">
          {LAYER_ORDER.map((layer) => {
            const on = visibleLayers.includes(layer);
            return <button key={layer} type="button" className={`layer-chip chip-${layer}`} aria-pressed={on} onClick={() => setLayerOverrides((current) => ({ ...current, [layer]: !on }))}>
              <i aria-hidden="true" />{LAYER_LABELS[layer]}
            </button>;
          })}
        </div>

        <nav className="atlas-minimap" aria-label="Jump along the body">
          <svg viewBox="100 0 200 1000" aria-hidden="true">
            <path d={BODY_PATH} />
            <rect ref={minimapRectRef} rx="10" />
          </svg>
          <ol>
            {CHAPTERS.slice(1, 5).map((item, offset) => <li key={item.id} style={{ top: `${(item.camera.y / 1000) * 100}%` }}>
              <button type="button" className={active === offset + 1 ? "is-active" : ""} onClick={() => jumpTo(offset + 1)} aria-label={`Go to ${item.kicker.replace(/^\d+ · /, "")}`}>
                <span>{item.nav}</span>
              </button>
            </li>)}
          </ol>
        </nav>

        <div className="atlas-scroll-hint" data-hidden={active > 0} aria-hidden="true"><span>Scroll</span><i /></div>
      </div>
    </div>

    <dialog ref={dialogRef} className="atlas-dialog" aria-labelledby="atlas-dialog-title" onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <form method="dialog" className="atlas-dialog-body" onSubmit={submitLog} noValidate={false}>
        <div className="atlas-dialog-top">
          <span className="atlas-overline">{LOG_COPY[logKind].overline}</span>
          <button type="button" className="atlas-dialog-close" aria-label="Close" onClick={() => dialogRef.current?.close()}>×</button>
        </div>
        <h2 id="atlas-dialog-title">{LOG_COPY[logKind].title}</h2>
        <div className="atlas-segment" role="tablist" aria-label="What to log">
          {(Object.keys(LOG_COPY) as LogKind[]).map((kind) => <button key={kind} type="button" role="tab" aria-selected={kind === logKind} onClick={() => setLogKind(kind)}>{LOG_COPY[kind].overline}</button>)}
        </div>
        {logKind === "water" && <label className="atlas-field">Glasses (250 ml each)<input key="glasses" name="glasses" type="number" min={1} max={12} step={1} defaultValue={1} required /></label>}
        {logKind === "workout" && <>
          <label className="atlas-field">Activity<input key="activity" name="activity" type="text" maxLength={60} placeholder="Walk, stretch, ride…" required /></label>
          <label className="atlas-field">Minutes<input key="minutes" name="minutes" type="number" min={1} max={600} step={1} defaultValue={20} required /></label>
        </>}
        {logKind === "note" && <label className="atlas-field">How is your mind today?<textarea key="note" name="note" rows={3} maxLength={280} placeholder="A thought for today…" required /></label>}
        <button className="atlas-button is-primary" type="submit">{LOG_COPY[logKind].submit}<span aria-hidden="true">→</span></button>
      </form>
    </dialog>
    <div className={`atlas-toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">{toast}</div>
  </main>;
}
