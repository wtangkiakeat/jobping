'use client';

import { useState, useEffect, useRef } from 'react';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function Home() {
  const [email, setEmail] = useState('');
  const [keywords, setKeywords] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(0);

  const rootRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /* ---------- one rAF loop drives every 3D / scroll variable ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      root.style.setProperty('--mx', '0');
      root.style.setProperty('--my', '0');
      root.style.setProperty('--sp', '0.5');
      root.style.setProperty('--hero', '0');
      root.style.setProperty('--page', '0');
      setStep(1);
      return;
    }

    let raf = 0;
    const tMouse = { x: 0, y: 0 };
    const cMouse = { x: 0, y: 0 };
    let tStage = 0;
    let cStage = 0;
    let tHero = 0;
    let cHero = 0;
    let tPage = 0;

    const onMove = (e: PointerEvent) => {
      tMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      tMouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onLeave = () => {
      tMouse.x = 0;
      tMouse.y = 0;
    };

    const measure = () => {
      const de = document.documentElement;
      tPage = de.scrollTop / Math.max(1, de.scrollHeight - de.clientHeight);

      const hero = heroRef.current;
      if (hero) {
        const r = hero.getBoundingClientRect();
        tHero = clamp(-r.top / Math.max(1, r.height), 0, 1);
      }
      const stage = stageRef.current;
      if (stage) {
        const r = stage.getBoundingClientRect();
        tStage = clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
      }
    };

    const tick = () => {
      cMouse.x += (tMouse.x - cMouse.x) * 0.075;
      cMouse.y += (tMouse.y - cMouse.y) * 0.075;
      cStage += (tStage - cStage) * 0.1;
      cHero += (tHero - cHero) * 0.14;

      root.style.setProperty('--mx', cMouse.x.toFixed(4));
      root.style.setProperty('--my', cMouse.y.toFixed(4));
      root.style.setProperty('--sp', cStage.toFixed(4));
      root.style.setProperty('--hero', cHero.toFixed(4));
      root.style.setProperty('--page', tPage.toFixed(4));

      const s = clamp(Math.floor(cStage * 2.999), 0, 2);
      setStep((p) => (p === s ? p : s));

      raf = requestAnimationFrame(tick);
    };

    measure();
    raf = requestAnimationFrame(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  /* ---------- reveal on enter ---------- */
  useEffect(() => {
    const els = document.querySelectorAll('[data-rv]');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleSubmit = async () => {
    if (!email || !keywords) {
      setStatus('error');
      setMessage('Add your email and at least one keyword to subscribe.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, keywords }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
        setKeywords('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  };

  const steps = [
    { t: 'Pick your keywords', d: 'React, remote, new grad, Python — whatever your search actually looks like.' },
    { t: 'JobPing watches the boards', d: 'Every morning it sweeps fresh postings and scores them against your list.' },
    { t: 'The match lands in your inbox', d: 'Same-day, one clean email. No dashboard to remember to open.' },
  ];

  return (
    <main className="jp" ref={rootRef}>
      <style>{css}</style>

      <div className="progress" />

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="brand">
            JobPing 🎯
        </div>
        <a href="#subscribe" className="nav-cta">
          Get alerts
        </a>
      </nav>

      {/* ── HERO ── */}
      <header className="hero" ref={heroRef}>
        <div className="hero-grain" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow" data-rv>
              <span className="pulse" /> Scanning new roles every morning
            </p>

            <h1 className="display">
              <span className="line" data-rv style={{ '--d': '40ms' } as React.CSSProperties}>
                <span>The job</span>
              </span>
              <span className="line" data-rv style={{ '--d': '140ms' } as React.CSSProperties}>
                <span>finds you.</span>
              </span>
            </h1>

            <p className="lede" data-rv style={{ '--d': '240ms' } as React.CSSProperties}>
              Set your keywords once. When something matching gets posted, we email you
              the same day — while the listing is still open.
            </p>

            <div className="hero-actions" data-rv style={{ '--d': '320ms' } as React.CSSProperties}>
              <a href="#subscribe" className="btn">
                <span>Set up my alerts</span>
                <i className="arrow" />
              </a>
              <a href="#how" className="btn-ghost">
                See how it works
              </a>
            </div>
          </div>

          {/* floating 3D card stack — tilts on pointer, spreads on scroll */}
          <div className="rig" aria-hidden="true">
            <div className="rig-glow" />
            <div className="deck">
              <div className="plate plate-3">
                <span className="plate-line" />
                <span className="plate-line short" />
              </div>
              <div className="plate plate-2">
                <span className="plate-line" />
                <span className="plate-line short" />
              </div>

              <article className="ping">
                <div className="ping-face">
                  <header className="ping-head">
                    <span className="chip">New match</span>
                    <time>9:02 AM</time>
                  </header>
                  <h3 className="ping-role">Backend Engineer</h3>
                  <p className="ping-meta">Motiff · Remote · YC S23</p>
                  <div className="ping-tags">
                    <span>react</span>
                    <span>node</span>
                    <span>remote</span>
                  </div>
                  <div className="ping-cta">View role</div>
                </div>
                <span className="ping-orb" />
                <span className="ping-score">94% match</span>
              </article>
            </div>
          </div>
        </div>

        <div className="scroll-hint">
          <span />
          scroll
        </div>
      </header>

      {/* ── STICKY 3D SHOWCASE ── */}
      <section className="stage" id="how" ref={stageRef}>
        <div className="stage-sticky">
          <div className="stage-grid">
            <div className="stage-copy">
              <p className="stage-eyebrow">How it works</p>
              <ol className="stage-steps">
                {steps.map((s, i) => (
                  <li key={s.t} className={i === step ? 'on' : ''}>
                    <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{s.t}</h3>
                      <p>{s.d}</p>
                    </div>
                    <span className="stage-bar">
                      <i />
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* the "product": a layered slab that rotates through the scroll */}
            <div className="slab-wrap" aria-hidden="true">
              <div className="slab">
                <div className="slab-back" />
                <div className="slab-body">
                  <div className={`screen s0 ${step === 0 ? 'on' : ''}`}>
                    <p className="screen-label">Your keywords</p>
                    <div className="kw">
                      <span>react</span>
                      <span>remote</span>
                      <span>new grad</span>
                      <span>python</span>
                      <span className="kw-add">+ add</span>
                    </div>
                  </div>

                  <div className={`screen s1 ${step === 1 ? 'on' : ''}`}>
                    <p className="screen-label">Scanning 4,182 new postings</p>
                    <div className="rows">
                      {[82, 64, 93, 47, 71].map((w, i) => (
                        <div className="row" key={i} style={{ '--w': `${w}%`, '--i': i } as React.CSSProperties}>
                          <span className="row-bar" />
                          <span className="row-pct">{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`screen s2 ${step === 2 ? 'on' : ''}`}>
                    <p className="screen-label">Today · 1 new match</p>
                    <div className="mail">
                      <div className="mail-top">
                        <span className="chip">Inbox</span>
                        <time>9:02 AM</time>
                      </div>
                      <h4>Backend Engineer — Motiff</h4>
                      <p>Remote · posted 2 hours ago</p>
                      <div className="mail-cta">Open posting</div>
                    </div>
                  </div>
                </div>
                <div className="slab-edge" />
                <span className="slab-shadow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCROLL-LINKED MARQUEE ── */}
      <section className="belt" aria-hidden="true">
        <div className="belt-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <div className="belt-run" key={k}>
              {['react', 'remote', 'new grad', 'python', 'backend', 'internship', 'golang', 'design systems', 'ml'].map(
                (w) => (
                  <span key={w + k}>
                    {w}
                    <i />
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── PROOF ── */}
      <section className="proof">
        <h2 className="proof-title" data-rv>
          People stopped refreshing job boards.
        </h2>
        <div className="proof-grid">
          {[
            {
              q: 'Caught a posting that closed in a day. I applied because JobPing pinged me at breakfast.',
              c: 'CS senior, new-grad roles',
            },
            {
              q: 'I stopped checking boards entirely. It just shows up when something actually fits.',
              c: 'Bootcamp grad, remote search',
            },
            {
              q: 'Set it once, forgot about it, then got three real matches in the first week.',
              c: 'Second-year, internship hunt',
            },
          ].map((t, i) => (
            <figure
              className="quote"
              key={t.c}
              data-rv
              style={{ '--d': `${i * 90}ms`, '--lift': `${(i % 2 ? 1 : -1) * 14}px` } as React.CSSProperties}
            >
              <blockquote>{t.q}</blockquote>
              <figcaption>{t.c}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── SUBSCRIBE ── */}
      <section className="sub" id="subscribe">
        <div className="sub-inner" data-rv>
          <h2>Start getting matches</h2>
          <p className="sub-lede">Free. One email, a few keywords, done.</p>

          <div className="form">
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="react, remote, python"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <button onClick={handleSubmit} disabled={status === 'loading'}>
              {status === 'loading' ? 'Setting up…' : 'Subscribe free'}
            </button>
          </div>

          {message && <p className={`msg ${status === 'success' ? 'ok' : 'err'}`}>{message}</p>}
        </div>
      </section>

      <footer className="foot">
        <span>JobPing</span>
        <span>Built for people who are done missing jobs.</span>
      </footer>
    </main>
  );
}

const css = `
:root{
  --base:#FBFBF9; --ink:#111311; --muted:#5B6152;
  --pine:#1D5C3F; --line:#E8E6DF; --card:#FFFFFF;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}

.jp{
  --mx:0; --my:0; --sp:0; --hero:0; --page:0;
  background:var(--base); color:var(--ink);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased; overflow-x:clip;
}

/* ── reveal ── */
[data-rv]{opacity:0; transform:translate3d(0,22px,0); transition:opacity .8s cubic-bezier(.2,.7,.2,1) var(--d,0ms), transform .8s cubic-bezier(.2,.7,.2,1) var(--d,0ms)}
[data-rv].is-in{opacity:1; transform:none}

/* ── scroll progress ── */
.progress{position:fixed; inset:0 0 auto 0; height:2px; z-index:60; transform-origin:0 50%;
  transform:scaleX(var(--page)); background:var(--pine)}

/* ── nav ── */
.nav{position:sticky; top:0; z-index:50; display:flex; justify-content:space-between;
  align-items:center; padding:18px 32px; max-width:1180px; margin:0 auto;
  backdrop-filter:blur(10px)}
.brand{display:flex; align-items:center; gap:9px; font-weight:700; font-size:18px; letter-spacing:-.025em}
.brand-dot{width:9px; height:9px; border-radius:50%; background:var(--pine);
  box-shadow:0 0 0 0 rgba(29,92,63,.35); animation:beat 2.6s ease-out infinite}
@keyframes beat{0%{box-shadow:0 0 0 0 rgba(29,92,63,.35)}70%,100%{box-shadow:0 0 0 12px rgba(29,92,63,0)}}
.nav-cta{font-size:14px; font-weight:500; color:var(--ink); text-decoration:none;
  border:1px solid var(--line); background:rgba(255,255,255,.7);
  padding:9px 18px; border-radius:999px; transition:background .25s, border-color .25s}
.nav-cta:hover{background:#fff; border-color:#d6d3c9}

/* ── hero ── */
.hero{position:relative; min-height:92vh; display:flex; flex-direction:column; justify-content:center}
.hero-grain{position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(900px 500px at 78% 28%, rgba(29,92,63,.09), transparent 70%);
  transform:translate3d(calc(var(--mx) * -14px), calc(var(--my) * -14px), 0)}
.hero-inner{position:relative; max-width:1180px; margin:0 auto; width:100%;
  padding:40px 32px 60px; display:grid; grid-template-columns:1.02fr .98fr;
  gap:48px; align-items:center}

.eyebrow{display:inline-flex; align-items:center; gap:10px; margin:0 0 22px;
  font-size:13.5px; color:var(--muted); letter-spacing:.01em}
.pulse{width:7px; height:7px; border-radius:50%; background:var(--pine);
  box-shadow:0 0 0 4px rgba(29,92,63,.14)}

.display{margin:0 0 24px; font-size:clamp(46px,6.4vw,80px); line-height:1.02;
  letter-spacing:-.045em; font-weight:800}
.line{display:block; overflow:hidden; padding-bottom:.17em; margin-bottom:-.12em}
.line > span{display:block; transform:translateY(105%);
  transition:transform .95s cubic-bezier(.16,.84,.26,1) var(--d,0ms)}
.line.is-in > span{transform:none}
.line[data-rv]{opacity:1; transform:none}

.lede{font-size:18.5px; line-height:1.55; color:var(--muted); max-width:36ch; margin:0 0 32px}

.hero-actions{display:flex; align-items:center; gap:18px; flex-wrap:wrap}
.btn{position:relative; display:inline-flex; align-items:center; gap:12px;
  background:var(--pine); color:#fff; text-decoration:none; font-weight:600; font-size:16px;
  padding:16px 26px; border-radius:14px; overflow:hidden;
  box-shadow:0 14px 30px -14px rgba(29,92,63,.6);
  transition:transform .28s cubic-bezier(.2,.8,.2,1), box-shadow .28s}
.btn:hover{transform:translateY(-3px); box-shadow:0 22px 40px -16px rgba(29,92,63,.65)}
.btn::after{content:''; position:absolute; inset:0; background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.22),transparent 70%);
  transform:translateX(-120%); transition:transform .7s}
.btn:hover::after{transform:translateX(120%)}
.arrow{width:16px; height:2px; background:#fff; position:relative; transition:transform .28s}
.arrow::after{content:''; position:absolute; right:0; top:-3px; width:8px; height:8px;
  border-top:2px solid #fff; border-right:2px solid #fff; transform:rotate(45deg)}
.btn:hover .arrow{transform:translateX(4px)}
.btn-ghost{font-size:15px; color:var(--muted); text-decoration:none; border-bottom:1px solid var(--line);
  padding-bottom:3px; transition:color .25s, border-color .25s}
.btn-ghost:hover{color:var(--ink); border-color:var(--pine)}

/* ── hero 3D rig ── */
.rig{position:relative; display:flex; justify-content:center; perspective:1400px; perspective-origin:50% 45%}
.rig-glow{position:absolute; width:420px; height:420px; border-radius:50%;
  background:radial-gradient(circle, rgba(29,92,63,.2), transparent 64%); filter:blur(30px);
  transform:translate3d(calc(var(--mx) * 22px), calc(var(--my) * 18px), 0)}
.deck{position:relative; transform-style:preserve-3d;
  transform:
    rotateY(calc(var(--mx) * 13deg))
    rotateX(calc(var(--my) * -11deg + var(--hero) * 14deg))
    translateY(calc(var(--hero) * -46px))
    scale(calc(1 - var(--hero) * 0.06))}

.plate{position:absolute; left:50%; top:0; width:330px; height:250px; border-radius:22px;
  background:#fff; border:1px solid var(--line); padding:26px;
  box-shadow:0 30px 60px -34px rgba(17,19,17,.4)}
.plate-line{display:block; height:9px; border-radius:6px; background:#F3F2EE; margin-bottom:12px}
.plate-line.short{width:56%}
.plate-2{transform:translate3d(-50%,0,-90px) translateY(calc(26px - var(--hero) * 34px)) scale(.94); opacity:.75}
.plate-3{transform:translate3d(-50%,0,-180px) translateY(calc(50px - var(--hero) * 66px)) scale(.88); opacity:.45}

.ping{position:relative; width:330px; transform-style:preserve-3d;
  transform:translateZ(60px)}
.ping-face{background:var(--card); border:1px solid var(--line); border-radius:22px; padding:26px;
  box-shadow:0 40px 70px -30px rgba(17,19,17,.34)}
.ping-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:18px}
.chip{background:rgba(29,92,63,.1); color:var(--pine); font-size:12px; font-weight:600;
  padding:5px 12px; border-radius:999px}
.ping-head time,.mail-top time{font-size:12px; color:var(--muted)}
.ping-role{margin:0; font-size:23px; font-weight:700; letter-spacing:-.025em}
.ping-meta{margin:6px 0 0; font-size:14px; color:var(--muted)}
.ping-tags{display:flex; gap:7px; margin:18px 0 22px}
.ping-tags span{font-size:12px; background:#F3F2EE; color:#3a3f37; padding:5px 11px; border-radius:8px}
.ping-cta{background:var(--ink); color:#fff; text-align:center; padding:12px;
  border-radius:11px; font-size:14px; font-weight:600}
.ping-orb{position:absolute; top:-26px; right:-22px; width:58px; height:58px; border-radius:50%;
  background:var(--pine); transform:translateZ(70px);
  box-shadow:0 18px 36px -12px rgba(29,92,63,.7)}
.ping-orb::after{content:''; position:absolute; inset:23px 0 0 23px; width:12px; height:12px;
  border-radius:50%; background:#fff}
.ping-score{position:absolute; bottom:-18px; left:-30px; transform:translateZ(96px);
  background:#fff; border:1px solid var(--line); color:var(--pine);
  font-size:12.5px; font-weight:700; padding:9px 14px; border-radius:999px;
  box-shadow:0 16px 30px -16px rgba(17,19,17,.35)}

.scroll-hint{display:flex; align-items:center; gap:10px; justify-content:center;
  font-size:12.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted);
  padding-bottom:34px; opacity:calc(1 - var(--hero) * 2.4)}
.scroll-hint span{width:1px; height:30px; background:linear-gradient(var(--line),var(--pine))}

/* ── sticky 3D stage ── */
.stage{position:relative; height:310vh} 
.stage-sticky{position:sticky; top:0; height:100vh; display:flex; align-items:center;
  border-top:1px solid var(--line); background:
    radial-gradient(700px 420px at 72% 50%, rgba(29,92,63,.07), transparent 70%), var(--base)}
.stage-grid{max-width:1180px; margin:0 auto; width:100%; padding:0 32px;
  display:grid; grid-template-columns:.92fr 1.08fr; gap:56px; align-items:center}
.stage-eyebrow{margin:0 0 30px; font-size:12.5px; letter-spacing:.16em;
  text-transform:uppercase; color:var(--muted)}
.stage-steps{list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:14px}
.stage-steps li{position:relative; display:grid; grid-template-columns:auto 1fr; gap:18px;
  padding:20px 22px; border-radius:16px; border:1px solid transparent;
  opacity:.4; transform:translateX(-6px);
  transition:opacity .5s, transform .5s, background .5s, border-color .5s}
.stage-steps li.on{opacity:1; transform:none; background:#fff; border-color:var(--line);
  box-shadow:0 20px 40px -30px rgba(17,19,17,.4)}
.stage-num{font-size:12.5px; font-weight:700; color:var(--pine); letter-spacing:.06em; padding-top:4px}
.stage-steps h3{margin:0 0 6px; font-size:19.5px; letter-spacing:-.025em}
.stage-steps p{margin:0; font-size:15.5px; line-height:1.5; color:var(--muted)}
.stage-bar{position:absolute; left:0; top:16px; bottom:16px; width:2px; border-radius:2px;
  background:var(--line); overflow:hidden}
.stage-bar i{position:absolute; inset:0; background:var(--pine); transform:scaleY(0);
  transform-origin:0 0; transition:transform .5s}
.stage-steps li.on .stage-bar i{transform:scaleY(1)}

/* ── the slab (product) ── */
.slab-wrap{perspective:1600px; perspective-origin:50% 50%; display:flex; justify-content:center}
.slab{position:relative; width:min(430px,86%); aspect-ratio:4/5; transform-style:preserve-3d;
  transform:
    rotateY(calc(26deg - var(--sp) * 52deg + var(--mx) * 6deg))
    rotateX(calc(10deg - var(--sp) * 12deg + var(--my) * -5deg))
    rotateZ(calc(2deg - var(--sp) * 4deg))
    translateY(calc(var(--sp) * -18px))}
.slab-back{position:absolute; inset:-14px; border-radius:30px; background:rgba(29,92,63,.1);
  transform:translateZ(-60px)}
.slab-body{position:absolute; inset:0; border-radius:26px; background:var(--card);
  border:1px solid var(--line); padding:30px; overflow:hidden;
  box-shadow:0 60px 90px -50px rgba(17,19,17,.5); transform-style:preserve-3d}
.slab-edge{position:absolute; inset:0; border-radius:26px; pointer-events:none;
  background:linear-gradient(120deg, rgba(255,255,255,.65), transparent 42%);
  transform:translateZ(1px); opacity:calc(.45 + var(--mx) * .3)}
.slab-shadow{position:absolute; left:8%; right:8%; bottom:-40px; height:60px; border-radius:50%;
  background:rgba(17,19,17,.22); filter:blur(26px); transform:translateZ(-90px)}

.screen{position:absolute; inset:30px; opacity:0; transform:translate3d(0,22px,20px) scale(.97);
  transition:opacity .55s cubic-bezier(.2,.7,.2,1), transform .55s cubic-bezier(.2,.7,.2,1);
  pointer-events:none}
.screen.on{opacity:1; transform:translate3d(0,0,40px) scale(1)}
.screen-label{margin:0 0 20px; font-size:12.5px; letter-spacing:.12em;
  text-transform:uppercase; color:var(--muted)}

.kw{display:flex; flex-wrap:wrap; gap:9px}
.kw span{font-size:14px; padding:10px 15px; border-radius:11px; background:#F3F2EE; color:#3a3f37}
.kw .kw-add{background:transparent; border:1px dashed var(--line); color:var(--muted)}

.rows{display:flex; flex-direction:column; gap:14px}
.row{display:flex; align-items:center; gap:12px}
.row-bar{flex:1; height:10px; border-radius:6px; background:#F3F2EE; position:relative; overflow:hidden}
.row-bar::after{content:''; position:absolute; inset:0 auto 0 0; width:var(--w);
  background:var(--pine); border-radius:6px; transform:scaleX(0); transform-origin:0 50%;
  transition:transform .7s cubic-bezier(.2,.8,.2,1) calc(var(--i) * 80ms)}
.screen.on .row-bar::after{transform:scaleX(1)}
.row-pct{font-size:12px; color:var(--muted); width:22px; text-align:right}

.mail{border:1px solid var(--line); border-radius:16px; padding:22px; background:#fff}
.mail-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:16px}
.mail h4{margin:0 0 6px; font-size:19px; letter-spacing:-.02em}
.mail p{margin:0 0 20px; font-size:14px; color:var(--muted)}
.mail-cta{background:var(--pine); color:#fff; text-align:center; padding:12px;
  border-radius:11px; font-size:14px; font-weight:600}

/* ── scroll-linked belt ── */
.belt{border-block:1px solid var(--line); padding:26px 0; overflow:hidden; background:#fff}
.belt-track{display:flex; width:max-content;
  transform:translateX(calc(var(--page) * -420px))}
.belt-run{display:flex; align-items:center; gap:26px; padding-right:26px;
  animation:drift 34s linear infinite}
@keyframes drift{to{transform:translateX(-100%)}}
.belt-run span{display:inline-flex; align-items:center; gap:26px; white-space:nowrap;
  font-size:28px; letter-spacing:-.03em; font-weight:600; color:var(--muted)}
.belt-run i{width:7px; height:7px; border-radius:50%; background:var(--pine); opacity:.5}

/* ── proof ── */
.proof{max-width:1180px; margin:0 auto; padding:110px 32px}
.proof-title{margin:0 0 44px; font-size:clamp(30px,3.6vw,44px); letter-spacing:-.035em;
  font-weight:800; max-width:16ch}
.proof-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:20px}
.quote{margin:0; background:#fff; border:1px solid var(--line); border-radius:20px; padding:30px;
  transform:translateY(var(--lift)); transition:transform .5s, box-shadow .5s}
.quote.is-in{transform:translateY(calc(var(--lift) + var(--page) * -18px))}
.quote:hover{box-shadow:0 30px 50px -34px rgba(17,19,17,.4)}
.quote blockquote{margin:0 0 18px; font-size:16.5px; line-height:1.55}
.quote figcaption{font-size:13px; color:var(--muted)}

/* ── subscribe ── */
.sub{position:relative; background:var(--pine); color:#fff; padding:110px 32px; overflow:hidden}
.sub::before{content:''; position:absolute; width:700px; height:700px; border-radius:50%;
  left:50%; top:-40%; background:radial-gradient(circle,rgba(255,255,255,.14),transparent 62%);
  transform:translate3d(calc(-50% + var(--mx) * 30px), calc(var(--my) * 24px), 0)}
.sub-inner{position:relative; max-width:560px; margin:0 auto; text-align:center}
.sub h2{margin:0 0 12px; font-size:clamp(32px,4.4vw,46px); letter-spacing:-.035em; font-weight:800}
.sub-lede{margin:0 0 34px; color:rgba(255,255,255,.8); font-size:17px}
.form{display:flex; flex-direction:column; gap:12px}
.form input{padding:16px 18px; border-radius:13px; border:1px solid rgba(255,255,255,.18);
  font-size:16px; background:rgba(255,255,255,.12); color:#fff; transition:background .25s, border-color .25s}
.form input::placeholder{color:rgba(255,255,255,.55)}
.form input:focus{outline:none; background:rgba(255,255,255,.2); border-color:rgba(255,255,255,.6)}
.form button{padding:16px; border-radius:13px; border:none; cursor:pointer; background:#fff;
  color:var(--pine); font-weight:700; font-size:16px;
  transition:transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s}
.form button:hover{transform:translateY(-3px); box-shadow:0 16px 30px -14px rgba(0,0,0,.4)}
.form button:disabled{opacity:.6; transform:none; box-shadow:none}
.msg{margin-top:18px; font-size:15px}
.msg.ok{color:#CFF3E0}
.msg.err{color:#FFD9D2}

/* ── foot ── */
.foot{max-width:1180px; margin:0 auto; padding:36px 32px; display:flex;
  justify-content:space-between; font-size:14px; color:var(--muted)}

/* ── responsive ── */
@media (max-width:980px){
  .hero-inner{grid-template-columns:1fr; gap:60px; padding-top:20px}
  .rig{order:-1; min-height:340px; align-items:flex-start}
  .stage{height:auto}
  .stage-sticky{position:static; height:auto; padding:80px 0}
  .stage-grid{grid-template-columns:1fr; gap:48px}
  .stage-steps li{opacity:1; transform:none; background:#fff; border-color:var(--line)}
  .stage-steps li .stage-bar i{transform:scaleY(1)}
  .slab{transform:rotateY(-6deg) rotateX(4deg); width:min(400px,100%)}
  .screen{opacity:0}
  .screen.s0{opacity:1; transform:translate3d(0,0,40px)}
  .proof-grid{grid-template-columns:1fr}
  .quote{transform:none}
  .quote.is-in{transform:none}
  .foot{flex-direction:column; gap:8px}
}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *{animation:none!important; transition-duration:.01ms!important}
  [data-rv]{opacity:1; transform:none}
  .line > span{transform:none}
  .deck,.slab,.belt-track,.hero-grain,.sub::before{transform:none!important}
  .screen{opacity:0}
  .screen.s1{opacity:1; transform:translate3d(0,0,0)}
  .row-bar::after{transform:scaleX(1)}
}
`;