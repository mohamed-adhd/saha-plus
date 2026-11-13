"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const BodyScene = dynamic(() => import("../components/BodyScene"), {
  ssr: false,
  loading: () => <div className="body-scene-startup" role="status">Loading Saha Plus body atlas…</div>,
});

type BodySceneControls = { goToTop: () => void };

export default function Home() {
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyProgressRef = useRef<HTMLElement>(null);
  const bodyBackTopRef = useRef<HTMLButtonElement>(null);
  const bodySceneControlsRef = useRef<BodySceneControls | null>(null);
  const [registering, setRegistering] = useState(false);
  const [enteredHome, setEnteredHome] = useState(false);
  const [panelMotion, setPanelMotion] = useState(false);
  const motionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function switchView(showRegister: boolean) {
    setRegistering(showRegister);
    setPanelMotion(true);
    if (motionTimer.current) clearTimeout(motionTimer.current);
    motionTimer.current = setTimeout(() => setPanelMotion(false), 900);
  }

  useEffect(() => () => {
    if (motionTimer.current) clearTimeout(motionTimer.current);
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!panel || !canvas || !context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let pointerX = -1000;
    let pointerY = -1000;
    let lastDraw = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const bounds = panel.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (event: PointerEvent) => {
      const bounds = panel.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
    };
    const onLeave = () => { pointerX = pointerY = -1000; };
    const observer = new ResizeObserver(resize);
    observer.observe(panel);
    resize();
    panel.addEventListener("pointermove", onMove, { passive: true });
    panel.addEventListener("pointerleave", onLeave, { passive: true });

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden || time - lastDraw < 32) return;
      lastDraw = time;
      context.clearRect(0, 0, width, height);
      const spacing = 19;
      const radius = 125;
      const phase = time / 1000;
      context.lineWidth = 1.25;
      for (let y = spacing / 2, row = 0; y < height; y += spacing, row++) {
        for (let x = spacing / 2, column = 0; x < width; x += spacing, column++) {
          const distance = Math.hypot(x - pointerX, y - pointerY);
          const influence = Math.max(0, 1 - distance / radius);
          const blink = 0.5 + 0.5 * Math.sin(phase * 2.1 + row * 1.71 + column * 2.37);
          const alpha = 0.13 + blink * 0.11 + influence * 0.7;
          const size = 2.2 + influence * 3.4;
          const push = influence * 6;
          const angle = Math.atan2(y - pointerY, x - pointerX);
          const px = x + Math.cos(angle) * push;
          const py = y + Math.sin(angle) * push;
          context.strokeStyle = `rgba(193, 239, 205, ${alpha})`;
          context.beginPath();
          context.moveTo(px - size, py);
          context.lineTo(px + size, py);
          context.moveTo(px, py - size);
          context.lineTo(px, py + size);
          context.stroke();
        }
      }

      const beatWidth = 188;
      const baseline = height * 0.52;
      const amplitude = Math.min(34, height * 0.075);
      const speed = 72;
      const head = (time / 1000 * speed) % (width + 1);
      const trailLength = Math.min(290, width);
      const gaussian = (position: number, center: number, spread: number) =>
        Math.exp(-(((position - center) / spread) ** 2));

      if (head > 0) {
        const start = Math.max(0, head - trailLength);
        const gradient = context.createLinearGradient(start, 0, head, 0);
        gradient.addColorStop(0, "rgba(193, 239, 205, 0)");
        gradient.addColorStop(0.72, "rgba(193, 239, 205, 0.38)");
        gradient.addColorStop(1, "rgba(220, 255, 228, 0.92)");
        context.beginPath();
        for (let x = start; x <= head; x += 2) {
          const beatPosition = ((x % beatWidth) + beatWidth) % beatWidth;
          const beat =
            0.16 * gaussian(beatPosition, 45, 10) -
            0.2 * gaussian(beatPosition, 78, 3.2) +
            1.05 * gaussian(beatPosition, 84, 2.3) -
            0.38 * gaussian(beatPosition, 91, 3.2) +
            0.3 * gaussian(beatPosition, 119, 13);
          const y = baseline - beat * amplitude;
          if (x === start) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = gradient;
        context.lineWidth = 1.8;
        context.shadowColor = "rgba(164, 237, 186, 0.58)";
        context.shadowBlur = 7;
        context.stroke();
        context.shadowBlur = 0;
      }
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  if (enteredHome) {
    return (
      <main className="dashboard-shell cinematic-shell">
        <aside className="dashboard-rail" aria-label="Saha Plus navigation">
          <a className="rail-brand" href="#overview" aria-label="Saha Plus overview"><span>+</span></a>
          <nav aria-label="Main menu">
            <a className="rail-link active" href="#overview" aria-label="Overview" title="Overview"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg><span>Overview</span></a>
            <a className="rail-link" href="#head-mind" aria-label="Head and mind" title="Head and mind"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M9 18h6M10 21h4M12 3v2M7 6l1.5 1M17 6l-1.5 1"/></svg><span>Head and mind</span></a>
            <a className="rail-link" href="#chest-heart" aria-label="Chest and heart" title="Chest and heart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S3 16 3 9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 9 1.5C21 16 12 21 12 21Z"/><path d="M4 12h4l2-3 3 6 2-3h5"/></svg><span>Chest and heart</span></a>
            <a className="rail-link" href="#core-digestion" aria-label="Core and digestion" title="Core and digestion"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3c2 2 1 4 0 6s-2 5 1 7 6 1 7-2-1-4-1-6 2-4 3-5M8 3h10M8 20h9"/><path d="M10 11h4M10 14h4"/></svg><span>Core and digestion</span></a>
            <a className="rail-link" href="#legs-strength" aria-label="Legs and strength" title="Legs and strength"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v7l2 4-2 7M16 3v7l-2 4 2 7M8 10h8M8 14h8"/></svg><span>Legs and strength</span></a>
            <a className="rail-link" href="#finale" aria-label="Finale" title="Finale"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 5.1L20 10l-4.2 3.5L17 19l-5-3-5 3 1.2-5.5L4 10l5.8-1.9L12 3Z"/><path d="m19 3 .8 1.7L22 5l-2.2.3L19 7l-.8-1.7L16 5l2.2-.3L19 3Z"/></svg><span>Finale</span></a>
          </nav>
          <button className="rail-link rail-signout" type="button" aria-label="Sign out" title="Sign out" onClick={() => setEnteredHome(false)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M14 8l4 4-4 4M8 12h10"/></svg><span>Sign out</span></button>
        </aside>
        <nav ref={bodyProgressRef} className="body-zone-progress" aria-label="Body zones">
          <a data-body-zone href="#head-mind" aria-label="Go to Head and Mind"><i aria-hidden="true"/><span>HEAD</span></a>
          <a data-body-zone href="#chest-heart" aria-label="Go to Chest and Heart"><i aria-hidden="true"/><span>CHEST</span></a>
          <a data-body-zone href="#core-digestion" aria-label="Go to Core and Digestion"><i aria-hidden="true"/><span>CORE</span></a>
          <a data-body-zone href="#legs-strength" aria-label="Go to Legs and Strength"><i aria-hidden="true"/><span>LEGS</span></a>
          <a data-body-zone href="#finale" aria-label="Go to Finale"><i aria-hidden="true"/><span>FINALE</span></a>
        </nav>
        <div className="body-atlas-ring" aria-hidden="true" />
        <BodyScene progressRef={bodyProgressRef} controlsRef={bodySceneControlsRef} backToTopRef={bodyBackTopRef} />
        <button ref={bodyBackTopRef} className="body-back-top" type="button" aria-label="Back to top" tabIndex={-1} onClick={() => bodySceneControlsRef.current?.goToTop()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg><span>Back to top</span>
        </button>
      </main>
    );
  }

  return (
    <main className={`login-shell${registering ? " is-registering" : ""}`}>
      <section ref={panelRef} className={`welcome-panel${panelMotion ? " panel-in-motion" : ""}`} aria-label="Saha Plus">
        <canvas ref={canvasRef} className={`plus-canvas${panelMotion ? " signs-in-motion" : ""}`} aria-hidden="true" />
        <a className="brand" href="#home" aria-label="Saha Plus home"><span className="brand-symbol">+</span> saha<span>plus</span></a>
        <div className="welcome-copy">
          <span className="eyebrow">YOUR WELLNESS, IN BALANCE</span>
          <h1>A healthier you<br />starts <em>here.</em></h1>
          <p>Small steps. Better days. A little more care for the person who matters most: you.</p>
        </div>
        <div className="panel-footer"><span>CARE THAT MOVES WITH YOU</span><span className="footer-mark">S+ / 01</span></div>
      </section>

      <section className="form-panel">
        <div className="form-top"><span className="form-kicker"><span className="status-dot" /> YOUR WELLNESS SPACE</span><a href="#help">Need help?</a></div>
        <div className={`form-content auth-view login-view${registering ? " is-hidden" : " is-visible"}`} aria-hidden={registering}>
          <div className="mobile-brand"><span className="brand-symbol">+</span> saha<span>plus</span></div>
          <div className="welcome-note"><span className="note-icon" aria-hidden="true">✳</span><span>A LITTLE SPACE FOR YOU</span><span className="note-rule" /></div>
          <span className="eyebrow form-eyebrow">WELCOME BACK</span>
          <h2>Feel good<br />about <em>coming back.</em></h2>
          <p className="form-intro">Pick up your wellness journey right where you left it.</p>
          <form noValidate onSubmit={(event) => { event.preventDefault(); setEnteredHome(true); }}>
            <label htmlFor="email">Email address <span>REQUIRED</span></label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
            <div className="password-label"><label htmlFor="password">Password</label><a href="#reset">Forgot password?</a></div>
            <input id="password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" />
            <label className="remember"><input type="checkbox" name="remember" /><span>Keep me signed in</span></label>
            <button type="submit">Continue to your space <span aria-hidden="true">→</span></button>
          </form>
          <p className="signup">New to Saha Plus? <a href="#signup" onClick={(event) => { event.preventDefault(); switchView(true); }}>Create an account <span aria-hidden="true">↗</span></a></p>
          <div className="privacy-note"><span aria-hidden="true">⌑</span><span>Your health journey is personal. Your information stays private.</span></div>
        </div>
        <div className={`form-content auth-view register-view${registering ? " is-visible" : " is-hidden"}`} aria-hidden={!registering}>
          <div className="mobile-brand"><span className="brand-symbol">+</span> saha<span>plus</span></div>
          <div className="welcome-note"><span className="note-icon" aria-hidden="true">✳</span><span>BEGIN WITH ONE SMALL STEP</span><span className="note-rule" /></div>
          <span className="eyebrow form-eyebrow">CREATE YOUR ACCOUNT</span>
          <h2>Make room<br />for <em>feeling better.</em></h2>
          <p className="form-intro">A little care, made personal. Start your Saha Plus journey today.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" type="text" placeholder="How should we call you?" autoComplete="name" />
            <label htmlFor="register-email" className="register-field-label">Email address</label>
            <input id="register-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
            <div className="password-label register-field-label"><label htmlFor="register-password">Create a password</label></div>
            <input id="register-password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" />
            <button type="submit">Create my account <span aria-hidden="true">→</span></button>
          </form>
          <p className="signup">Already have an account? <a href="#login" onClick={(event) => { event.preventDefault(); switchView(false); }}>Sign in <span aria-hidden="true">↗</span></a></p>
          <div className="privacy-note"><span aria-hidden="true">⌑</span><span>Your information is private and always treated with care.</span></div>
        </div>
        <div className="form-footer"><span>© 2025 SAHA PLUS</span><a href="#privacy">PRIVACY &amp; TERMS</a></div>
      </section>
    </main>
  );
}
