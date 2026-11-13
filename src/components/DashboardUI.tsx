"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { healthMetrics, regionDetails, todaySummary, type HealthMetric, type RegionDetail } from "../data/mockHealth";

type Props = { progressRef: RefObject<HTMLElement> };
const zones = ["head-mind", "chest-heart", "core-digestion", "legs-strength", "finale"];

function Sparkline({ points, className = "" }: { points: number[]; className?: string }) {
  const coords = points.map((point, index) => `${(index / (points.length - 1)) * 100},${30 - point * 2.6}`).join(" ");
  return <svg className={`health-sparkline ${className}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={coords} /></svg>;
}

function Icon({ name }: { name: HealthMetric["icon"] }) {
  const paths: Record<HealthMetric["icon"], React.ReactNode> = {
    heart: <><path d="M20.8 8.8c0 5.1-8.8 10-8.8 10s-8.8-4.9-8.8-10A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8.8 1.4Z"/><path d="M4 12h4l2-3 3.2 6 2-3H20"/></>,
    moon: <path d="M19.5 15.8A8 8 0 0 1 8.2 4.5 8.2 8.2 0 1 0 19.5 15.8Z"/>,
    mood: <><circle cx="12" cy="12" r="8.5"/><path d="M8.5 14s1.2 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01"/></>,
    steps: <><path d="M8 4c1.6 0 2.4 2.1 2 4.4-.3 1.8-1.5 3-3 3S4 10.8 4 9.4 5.4 4 8 4ZM16 12c1.7 0 3 2.2 3 4s-1.2 3-2.8 3-3.2-1-3.2-2.4 1-5.6 3-5.6Z"/><path d="m7 13 1 2m8-1 1 2"/></>,
    water: <path d="M12 3S5.5 10.2 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10.2 12 3 12 3Z"/>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function MetricCard({ metric, index, loading }: { metric: HealthMetric; index: number; loading: boolean }) {
  return <article className={`metric-card metric-card-${index + 1}${loading ? " is-loading" : ""}`} aria-label={`${metric.label}: ${metric.value} ${metric.unit}`}>
    {loading ? <><span className="metric-skeleton metric-skeleton-label"/><span className="metric-skeleton metric-skeleton-value"/><span className="metric-skeleton metric-skeleton-chart"/></> : <>
      <div className="metric-card-heading"><span className="metric-icon"><Icon name={metric.icon}/></span><span>{metric.label}</span></div>
      <div className="metric-reading"><strong>{metric.value}</strong>{metric.unit && <span>{metric.unit}</span>}</div>
      <Sparkline points={metric.points}/>
      <div className="metric-trend"><span aria-hidden="true">{metric.direction === "up" ? "↑" : "↓"}</span>{metric.trend}</div>
    </>}
  </article>;
}

function TodaySummary() {
  return <section className="today-summary" aria-label="Today at a glance">
    <div className="today-rings" role="img" aria-label="Activity goals: move 78%, exercise 64%, stand 83%">
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <circle className="ring-track ring-move-track" cx="42" cy="42" r="35"/><circle className="ring-progress ring-move" cx="42" cy="42" r="35" pathLength="100" style={{ "--ring-value": `${todaySummary.move * 100}` } as React.CSSProperties}/>
        <circle className="ring-track ring-exercise-track" cx="42" cy="42" r="27"/><circle className="ring-progress ring-exercise" cx="42" cy="42" r="27" pathLength="100" style={{ "--ring-value": `${todaySummary.exercise * 100}` } as React.CSSProperties}/>
        <circle className="ring-track ring-stand-track" cx="42" cy="42" r="19"/><circle className="ring-progress ring-stand" cx="42" cy="42" r="19" pathLength="100" style={{ "--ring-value": `${todaySummary.stand * 100}` } as React.CSSProperties}/>
      </svg>
    </div>
    <div className="today-summary-content"><span className="ui-overline">TODAY, IN BALANCE</span><div className="today-stats"><span><strong>🔥 {todaySummary.streak}</strong><small>day streak</small></span><i/><span><strong>{todaySummary.score}<small>/100</small></strong><small>wellness score</small></span></div><p>Move 78% <b>·</b> Exercise 64% <b>·</b> Stand 83%</p></div>
  </section>;
}

function RegionPanel({ detail, onQuickAction }: { detail: RegionDetail; onQuickAction: (action: string) => void }) {
  return <section className="region-detail-panel" aria-labelledby="region-detail-title" key={detail.id}>
    <div className="region-panel-top"><span className="region-icon" aria-hidden="true">{detail.icon}</span><span className={`status-chip ${detail.status === "Good" ? "is-good" : "is-warning"}`}><i/>{detail.status}</span></div>
    <span className="ui-overline">YOUR BODY · {String(regionDetails.findIndex((item) => item.id === detail.id) + 1).padStart(2, "0")}</span>
    <h2 id="region-detail-title">{detail.title}</h2><p className="region-description">{detail.description}</p>
    <div className="region-stats">{detail.stats.map((stat) => <div className="region-stat" key={stat.label}><span>{stat.label}</span><Sparkline points={stat.points}/><strong>{stat.value}</strong></div>)}</div>
    <div className="region-actions"><button className="region-primary" type="button" onClick={() => onQuickAction(detail.action)}>{detail.action}<span aria-hidden="true">↗</span></button><button className="region-secondary" type="button" onClick={() => onQuickAction(detail.secondary)}>{detail.secondary}</button></div>
  </section>;
}

const hotSpots = [
  { id: "head-mind", name: "Mind & sleep", metric: "7.8 hours", className: "hotspot-head" },
  { id: "chest-heart", name: "Heart", metric: "62 bpm", className: "hotspot-chest" },
  { id: "core-digestion", name: "Hydration", metric: "1.6 litres", className: "hotspot-core" },
  { id: "legs-strength", name: "Movement", metric: "8,420 steps", className: "hotspot-legs" },
];

function Hotspots({ onSelect }: { onSelect: (zone: string) => void }) {
  return <nav className="body-hotspots" aria-label="Explore body regions">{hotSpots.map((hotspot) => <button key={hotspot.id} className={`body-hotspot ${hotspot.className}`} type="button" onClick={() => onSelect(hotspot.id)} aria-label={`Explore ${hotspot.name}, ${hotspot.metric}`}><i/><span className="hotspot-tooltip"><strong>{hotspot.name}</strong><small>{hotspot.metric}</small></span></button>)}</nav>;
}

type QuickAction = { title: string; icon: string; field: string; placeholder: string; submit: string };
const quickActions: QuickAction[] = [
  { title: "Log water", icon: "↓", field: "Glasses", placeholder: "1", submit: "Save water" },
  { title: "Log mood", icon: "☺", field: "How are you feeling?", placeholder: "Good, calm, tired…", submit: "Save mood" },
  { title: "Start workout", icon: "↗", field: "Activity", placeholder: "A walk, stretch…", submit: "Start activity" },
  { title: "Add note", icon: "+", field: "Note", placeholder: "A thought for today…", submit: "Save note" },
];

function QuickActions({ requestedAction, onRequestHandled }: { requestedAction: string | null; onRequestHandled: () => void }) {
  const [active, setActive] = useState<QuickAction | null>(null);
  const [toast, setToast] = useState("");
  const [value, setValue] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => {
    if (!requestedAction) return;
    setActive({ title: requestedAction, icon: "✦", field: "Add a note", placeholder: "A thought for today…", submit: "Save note" });
    setValue("");
    onRequestHandled();
  }, [requestedAction, onRequestHandled]);
  useEffect(() => {
    if (!active) return;
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setActive(null); return; }
      if (event.key !== "Tab") return;
      const dialog = formRef.current?.closest<HTMLElement>("[role='dialog']");
      const controls = dialog?.querySelectorAll<HTMLElement>("button, input");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !value.trim()) return;
    setToast(`${active.title.replace("Log ", "")} saved`);
    setActive(null); setValue("");
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }
  return <>
    <nav className="quick-action-bar" aria-label="Quick actions">{quickActions.map((action) => <button key={action.title} type="button" onClick={() => { setActive(action); setValue(""); }}><span aria-hidden="true">{action.icon}</span><b>{action.title}</b></button>)}</nav>
    {active && <div className="quick-action-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}><section className="quick-action-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-action-title"><button className="dialog-close" type="button" aria-label="Close" onClick={() => setActive(null)}>×</button><span className="ui-overline">A SMALL STEP FOR YOU</span><h2 id="quick-action-title">{active.title}</h2><form ref={formRef} onSubmit={submit}><label htmlFor="quick-action-value">{active.field}</label><input id="quick-action-value" value={value} onChange={(event) => setValue(event.target.value)} placeholder={active.placeholder} required/><button className="region-primary" type="submit">{active.submit}<span aria-hidden="true">→</span></button></form></section></div>}
    <div className={`health-toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">{toast}</div>
  </>;
}

export default function DashboardUI({ progressRef }: Props) {
  const [activeZone, setActiveZone] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [requestedAction, setRequestedAction] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const clearRequestedAction = useCallback(() => setRequestedAction(null), []);
  const currentDetail = useMemo(() => regionDetails.find((detail) => detail.id === activeZone), [activeZone]);
  useEffect(() => {
    const done = window.setTimeout(() => setLoading(false), 850);
    return () => window.clearTimeout(done);
  }, []);
  useEffect(() => {
    let scrollElement: HTMLElement | null = null;
    let frame = 0;
    let observer: MutationObserver | null = null;
    const sync = () => {
      if (!scrollElement) return;
      const page = scrollElement.clientHeight > 0 ? scrollElement.scrollTop / scrollElement.clientHeight : 0;
      if (page < 0.85) setActiveZone("overview");
      else {
        const current = progressRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
        if (current?.dataset.bodyZone) setActiveZone(current.dataset.bodyZone);
        else setActiveZone(page >= 5 ? "finale" : zones[Math.max(0, Math.min(3, Math.floor(page) - 1))]);
      }
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const bind = () => {
      const canvas = document.querySelector(".body-scene-canvas");
      if (canvas) scrollElement = Array.from(canvas.children).find((child): child is HTMLElement => child instanceof HTMLElement && ["auto", "scroll"].includes(getComputedStyle(child).overflowY)) ?? null;
      if (scrollElement) { scrollElement.addEventListener("scroll", onScroll, { passive: true }); sync(); observer?.disconnect(); }
    };
    bind();
    observer = new MutationObserver(bind);
    observer.observe(document.body, { childList: true, subtree: true });
    const nav = progressRef.current;
    const navObserver = nav ? new MutationObserver(() => {
      const current = nav.querySelector<HTMLElement>('[aria-current="step"]');
      const page = scrollElement && scrollElement.clientHeight > 0 ? scrollElement.scrollTop / scrollElement.clientHeight : 0;
      if (page < 0.85) setActiveZone("overview");
      else if (current?.dataset.bodyZone) setActiveZone(current.dataset.bodyZone);
    }) : null;
    navObserver?.observe(nav!, { attributes: true, subtree: true, attributeFilter: ["aria-current"] });
    return () => { if (frame) cancelAnimationFrame(frame); observer?.disconnect(); navObserver?.disconnect(); scrollElement?.removeEventListener("scroll", onScroll); };
  }, [progressRef]);
  useEffect(() => {
    let frame = 0;
    let latest: PointerEvent | null = null;
    const onMove = (event: PointerEvent) => {
      latest = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        if (!latest || !dashboardRef.current) return;
        dashboardRef.current.style.setProperty("--parallax-x", `${(latest.clientX / window.innerWidth - 0.5) * 5}px`);
        dashboardRef.current.style.setProperty("--parallax-y", `${(latest.clientY / window.innerHeight - 0.5) * 5}px`);
        frame = 0;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); if (frame) cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => {
    const shell = document.querySelector(".dashboard-rail nav");
    const links = shell?.querySelectorAll<HTMLAnchorElement>("a[href^='#']");
    links?.forEach((link) => {
      const target = link.hash.slice(1);
      link.classList.toggle("active", activeZone === "overview" ? target === "overview" : target === activeZone);
    });
  }, [activeZone]);
  const selectZone = (zone: string) => progressRef.current?.querySelector<HTMLAnchorElement>(`[href="#${zone}"]`)?.click();
  const onQuickAction = (label: string) => setRequestedAction(label);
  return <div className="dashboard-ui" ref={dashboardRef}>
    <div className="dashboard-glow" aria-hidden="true"/>
    {activeZone === "overview" && <svg className="metric-leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M33 26 C42 27 42 34 48 38"/><path d="M34 47 C40 46 43 43 48 42"/><path d="M68 25 C59 28 57 35 52 39"/><path d="M68 54 C60 52 58 48 52 44"/><path d="M66 75 C59 68 56 57 52 49"/></svg>}
    {activeZone === "overview" ? <>
      <div className="overview-metrics" aria-label="Your health at a glance">{healthMetrics.map((metric, index) => <MetricCard key={metric.id} metric={metric} index={index} loading={loading}/>)}</div>
      <TodaySummary/><Hotspots onSelect={selectZone}/>
      <div className="overview-mobile-heading" aria-hidden="true"><span className="ui-overline">YOUR WELLNESS, TODAY</span><strong>Small signals.<br/><em>More understanding.</em></strong></div>
    </> : currentDetail ? <RegionPanel detail={currentDetail} onQuickAction={onQuickAction}/> : null}
    <QuickActions requestedAction={requestedAction} onRequestHandled={clearRequestedAction}/>
  </div>;
}
