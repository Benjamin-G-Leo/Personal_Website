"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import portrait from "@/data/portrait.json";
import styles from "./Loader.module.css";

gsap.registerPlugin(useGSAP);

const { cols: COLS, rows: ROWS, aspect: ASPECT, levels: LEVELS } = portrait;
const THRESH = 6;
const PAPER = "245,241,230";

// ---- Static portrait data (built once, shared by every layout) ----
const cellDot = new Int32Array(ROWS * COLS).fill(-1);
const dotCol: number[] = [];
const dotRow: number[] = [];
const dotLvl: number[] = [];
LEVELS.forEach((lv, i) => {
  if (lv >= THRESH) {
    cellDot[i] = dotCol.length;
    dotCol.push(i % COLS);
    dotRow.push(Math.floor(i / COLS));
    dotLvl.push(lv);
  }
});
const N = dotCol.length;

// Hex-grid neighbours become the strands of the web
const edgeList: number[] = [];
for (let i = 0; i < N; i++) {
  const c = dotCol[i];
  const r = dotRow[i];
  const odd = r % 2 === 1;
  for (const [rr, cc] of [[r, c + 1], [r + 1, c + (odd ? 1 : 0)], [r + 1, c + (odd ? 0 : -1)]]) {
    if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
    const j = cellDot[rr * COLS + cc];
    if (j >= 0) edgeList.push(i, j);
  }
}

// A sparse subset of strands is drawn live between the moving dots, so the web visibly knits itself together
const dynEdges: number[] = [];
for (let k = 0; k < edgeList.length; k += 8) dynEdges.push(edgeList[k], edgeList[k + 1]);

// Seeded randomness: where each dot starts on the screen, when it leaves, how it curves in
let seed = 20261120;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const startX = new Float32Array(N).map(() => rand());
const startY = new Float32Array(N).map(() => rand());
const delay = new Float32Array(N).map(() => rand() * 0.5);
const swirl = new Float32Array(N).map(() => (rand() - 0.5) * 220);

type Layout = {
  w: number;
  h: number;
  dpr: number;
  tx: Float32Array;
  ty: Float32Array;
  rad: Float32Array;
  sx: Float32Array;
  sy: Float32Array;
  web: HTMLCanvasElement;
};

function layout(w: number, h: number, dpr: number): Layout {
  const ph = Math.min(h * 0.88, (w * 0.96) / ASPECT);
  const pw = ph * ASPECT;
  const ox = (w - pw) / 2;
  const oy = (h - ph) / 2 + h * 0.01;
  const spacing = pw / COLS;
  const tx = new Float32Array(N);
  const ty = new Float32Array(N);
  const rad = new Float32Array(N);
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const c = dotCol[i];
    const r = dotRow[i];
    tx[i] = ox + ((c + (r % 2 ? 0.5 : 0) + 0.5) / COLS) * pw;
    ty[i] = oy + (((r * 0.866 * ASPECT) / COLS) + 0.5 / COLS) * ph;
    rad[i] = 0.4 + spacing * 0.47 * Math.pow(dotLvl[i] / 99, 0.85);
    sx[i] = (startX[i] * 1.1 - 0.05) * w; // scatter across the whole screen
    sy[i] = (startY[i] * 1.1 - 0.05) * h;
  }

  // Pre-render the web once; it is just faded in afterwards
  const web = document.createElement("canvas");
  web.width = Math.round(w * dpr);
  web.height = Math.round(h * dpr);
  const g = web.getContext("2d")!;
  g.scale(dpr, dpr);
  g.lineWidth = 0.7;
  for (const bright of [false, true]) {
    g.strokeStyle = `rgba(${PAPER},${bright ? 0.5 : 0.2})`;
    g.beginPath();
    for (let k = 0; k < edgeList.length; k += 2) {
      const a = edgeList[k];
      const b = edgeList[k + 1];
      if ((dotLvl[a] + dotLvl[b] > 110) !== bright) continue;
      g.moveTo(tx[a], ty[a]);
      g.lineTo(tx[b], ty[b]);
    }
    g.stroke();
  }
  return { w, h, dpr, tx, ty, rad, sx, sy, web };
}

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      const finish = () => {
        document.documentElement.style.overflow = "";
        window.dispatchEvent(new Event("loader:done"));
        setDone(true);
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.delayedCall(0, finish);
        return;
      }
      document.documentElement.style.overflow = "hidden";
      window.dispatchEvent(new Event("loader:start"));

      const canvas = root.current!.querySelector<HTMLCanvasElement>("canvas")!;
      const ctx = canvas.getContext("2d")!;
      const state = { gather: 0, web: 0 };
      let L: Layout;

      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        L = layout(w, h, dpr);
      };

      const xs = new Float32Array(N);
      const ys = new Float32Array(N);
      const draw = () => {
        const { w, h, dpr, tx, ty, rad, sx, sy, web } = L;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const g = state.gather;

        for (let i = 0; i < N; i++) {
          const p = Math.min(1, Math.max(0, (g - delay[i]) / 0.5));
          const e = 1 - Math.pow(1 - p, 3);
          const dx = tx[i] - sx[i];
          const dy = ty[i] - sy[i];
          const len = Math.hypot(dx, dy) || 1;
          const curve = Math.sin(Math.PI * e) * swirl[i];
          xs[i] = sx[i] + dx * e + (-dy / len) * curve;
          ys[i] = sy[i] + dy * e + (dx / len) * curve;
        }

        // Spider-Verse style red/blue split that tightens as the portrait forms
        const split = (1 - g) * (1 - g) * 5;
        if (split > 0.25) {
          ctx.fillStyle = "rgba(230,36,41,0.55)";
          for (let i = 0; i < N; i++) ctx.fillRect(xs[i] + split - rad[i], ys[i] - rad[i], rad[i] * 1.6, rad[i] * 1.6);
          ctx.fillStyle = "rgba(60,110,230,0.55)";
          for (let i = 0; i < N; i++) ctx.fillRect(xs[i] - split - rad[i], ys[i] - rad[i], rad[i] * 1.6, rad[i] * 1.6);
        }

        // Live strands: only drawn once neighbouring dots are close enough, so they appear as the dots converge
        const live = 0.26 * (1 - state.web);
        if (g > 0.2 && live > 0.01) {
          const maxLen = Math.max(70, w * 0.07);
          ctx.strokeStyle = `rgba(${PAPER},${live})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          for (let k = 0; k < dynEdges.length; k += 2) {
            const a = dynEdges[k];
            const b = dynEdges[k + 1];
            const ddx = xs[a] - xs[b];
            const ddy = ys[a] - ys[b];
            if (ddx * ddx + ddy * ddy > maxLen * maxLen) continue;
            ctx.moveTo(xs[a], ys[a]);
            ctx.lineTo(xs[b], ys[b]);
          }
          ctx.stroke();
        }

        if (state.web > 0) {
          ctx.globalAlpha = state.web;
          ctx.drawImage(web, 0, 0, w, h);
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = `rgb(${PAPER})`;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          if (rad[i] < 1.15) {
            ctx.rect(xs[i] - rad[i], ys[i] - rad[i], rad[i] * 2, rad[i] * 2); // tiny dots: cheaper than arcs
          } else {
            ctx.moveTo(xs[i] + rad[i], ys[i]);
            ctx.arc(xs[i], ys[i], rad[i], 0, Math.PI * 2);
          }
        }
        ctx.fill();
      };

      fit();
      draw();

      const rays = gsap.utils.toArray<SVGPathElement>(`.${styles.ray}`);
      const rings = gsap.utils.toArray<SVGCircleElement>(`.${styles.ring}`);
      [...rays, ...rings].forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });

      const tl = gsap
        .timeline({ onUpdate: draw, onComplete: finish })
        .to(state, { gather: 1, duration: 2.3, ease: "power1.inOut" }, 0.2)
        // the big web spreads outward from the middle while the dots converge
        .to(rays, { strokeDashoffset: 0, duration: 1.5, stagger: 0.04, ease: "power2.out" }, 0.8)
        .to(rings, { strokeDashoffset: 0, duration: 1.2, stagger: 0.16, ease: "power1.out" }, 0.9)
        .to(state, { web: 1, duration: 1.1, ease: "power1.inOut" }, 1.9)
        .fromTo(`.${styles.name}`, { opacity: 0, y: 24, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.8)" }, 2.4)
        .fromTo(`.${styles.skip}`, { opacity: 0 }, { opacity: 0.6, duration: 0.5 }, 0.6)
        .call(() => window.dispatchEvent(new Event("loader:exit")), [], 3.3)
        .to(root.current, { yPercent: -100, duration: 0.65, ease: "power3.inOut" }, 3.3);

      const speedUp = () => tl.timeScale(5);
      const onResize = () => {
        fit();
        draw();
      };
      window.addEventListener("pointerdown", speedUp);
      window.addEventListener("keydown", speedUp);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("pointerdown", speedUp);
        window.removeEventListener("keydown", speedUp);
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: root }
  );

  if (done) return null;

  return (
    <div ref={root} className={styles.loader} aria-hidden>
      {/* Full-screen web: rays and rings run well past every edge of the viewport */}
      <svg className={styles.web} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <path key={i} className={styles.ray} d={`M0 0 L${Math.round(Math.cos(a) * 320)} ${Math.round(Math.sin(a) * 320)}`} />;
        })}
        {[22, 44, 70, 100, 135, 180, 235].map((r) => (
          <circle key={r} cx="0" cy="0" r={r} className={styles.ring} />
        ))}
      </svg>
      <canvas className={styles.canvas} />
      <p className={`${styles.name} comic`}>
        BEN GARY <span className={styles.red}>LEO</span>
      </p>
      <p className={styles.skip}>click to skip</p>
    </div>
  );
}
