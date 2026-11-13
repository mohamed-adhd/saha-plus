"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { regionDetails, todaySummary, type RegionDetail } from "../data/mockHealth";
import AnatomyIllustration from "./AnatomyIllustration";

type Props = { progressRef: RefObject<HTMLElement> };
const zones = ["head-mind", "chest-heart", "core-digestion", "legs-strength", "finale"];

function Sparkline({ points, className = "" }: { points: number[]; className?: string }) {
  const coords = points.map((point, index) => `${(index / (points.length - 1)) * 100},${30 - point * 2.6}`).join(" ");
  return <svg className={`health-sparkline ${className}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={coords} /></svg>;
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
  { id: "head-mind", name: "Focus", metric: "3 focus blocks", className: "hotspot-head" },
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
  const [requestedAction, setRequestedAction] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const illustrationRef = useRef<SVGSVGElement>(null);
  const scannerRef = useRef<SVGGElement>(null);
  const scanTraceRef = useRef<SVGPathElement>(null);
  const clearRequestedAction = useCallback(() => setRequestedAction(null), []);
  const currentDetail = useMemo(() => regionDetails.find((detail) => detail.id === activeZone), [activeZone]);
  useEffect(() => {
    let scrollElement: HTMLElement | null = null;
    let frame = 0;
    let observer: MutationObserver | null = null;
    const sync = () => {
      if (!scrollElement) return;
      const page = scrollElement.clientHeight > 0 ? scrollElement.scrollTop / scrollElement.clientHeight : 0;
      const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
      const progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollElement.scrollTop / maxScroll)) : 0;
      illustrationRef.current?.style.setProperty("--scan-progress", String(progress));
      scannerRef.current?.setAttribute("transform", `translate(0 ${45 + progress * 795})`);
      if (scanTraceRef.current) scanTraceRef.current.style.strokeDashoffset = String(100 - progress * 100);
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
    <AnatomyIllustration svgRef={illustrationRef} scannerRef={scannerRef} traceRef={scanTraceRef} region={activeZone}/>
    {activeZone === "overview" ? <>
      <TodaySummary/><Hotspots onSelect={selectZone}/>
      <div className="overview-mobile-heading" aria-hidden="true"><span className="ui-overline">YOUR WELLNESS, TODAY</span><strong>Small signals.<br/><em>More understanding.</em></strong></div>
    </> : currentDetail ? <RegionPanel detail={currentDetail} onQuickAction={onQuickAction}/> : null}
    <QuickActions requestedAction={requestedAction} onRequestHandled={clearRequestedAction}/>
  </div>;
}
