"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <main className="login-shell">
      <section ref={panelRef} className="welcome-panel" aria-label="Saha Plus">
        <canvas ref={canvasRef} className="plus-canvas" aria-hidden="true" />
        <a className="brand" href="#home" aria-label="Saha Plus home"><span className="brand-symbol">+</span> saha<span>plus</span></a>
        <div className="welcome-copy">
          <span className="eyebrow">YOUR WELLNESS, IN BALANCE</span>
          <h1>A healthier you<br />starts <em>here.</em></h1>
          <p>Small steps. Better days. A little more care for the person who matters most: you.</p>
        </div>
        <div className="panel-footer"><span>CARE THAT MOVES WITH YOU</span><span className="footer-mark">S+ / 01</span></div>
      </section>

      <section className="form-panel">
        <div className="form-top"><span>WELCOME BACK</span><a href="#help">Need help?</a></div>
        <div className="form-content">
          <div className="mobile-brand"><span className="brand-symbol">+</span> saha<span>plus</span></div>
          <span className="eyebrow form-eyebrow">YOUR SPACE IS READY</span>
          <h2>Sign in</h2>
          <p className="form-intro">Good to see you again. Let’s pick up where you left off.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
            <div className="password-label"><label htmlFor="password">Password</label><a href="#reset">Forgot password?</a></div>
            <input id="password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" />
            <label className="remember"><input type="checkbox" name="remember" /><span>Keep me signed in</span></label>
            <button type="submit">Sign in <span aria-hidden="true">→</span></button>
          </form>
          <p className="signup">New to Saha Plus? <a href="#signup">Create an account <span aria-hidden="true">↗</span></a></p>
        </div>
        <div className="form-footer"><span>© 2025 SAHA PLUS</span><a href="#privacy">PRIVACY &amp; TERMS</a></div>
      </section>
    </main>
  );
}
