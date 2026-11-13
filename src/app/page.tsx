"use client";

import { PointerEvent, useState } from "react";

const marks = Array.from({ length: 260 }, (_, index) => {
  const random = (seed: number) => {
    const value = Math.sin((index + 1) * seed * 127.1) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    id: index,
    x: random(1.17) * 100,
    y: random(2.39) * 100,
    delay: -random(3.71) * 24,
    duration: 15 + random(5.13) * 20,
    size: 28 + random(7.19) * 22,
  };
});

export default function Home() {
  const [pointer, setPointer] = useState({ x: -1000, y: -1000 });
  const [ripple, setRipple] = useState({ x: -1000, y: -1000, key: 0 });

  function movePointer(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({ x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 });
  }

  function startRipple(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setRipple({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, key: Date.now() });
  }

  return (
    <main className="login-shell">
      <section className="welcome-panel" onPointerMove={movePointer} onPointerDown={startRipple} aria-label="Saha Plus">
        <div className="plus-field" aria-hidden="true">
          {marks.map((mark) => (
            <span
              className="plus-mark"
              key={mark.id}
              style={{
                left: `${mark.x}%`,
                top: `${mark.y}%`,
                animationDelay: `${mark.delay}s`,
                animationDuration: `${mark.duration}s`,
                fontSize: `${mark.size}px`,
                "--near": `${Math.max(0, 1 - Math.hypot((mark.x - pointer.x) * 3.4, (mark.y - pointer.y) * 5.2) / 125)}`,
                "--dx": `${Math.max(-1, Math.min(1, (mark.x - pointer.x) / 14)) * 19}px`,
                "--dy": `${Math.max(-1, Math.min(1, (mark.y - pointer.y) / 14)) * 19}px`,
              } as React.CSSProperties}
            >+</span>
          ))}
          <span
            key={ripple.key}
            className="water-ripple"
            style={{ left: ripple.x, top: ripple.y }}
          />
        </div>
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
