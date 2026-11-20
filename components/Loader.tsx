"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import portrait from "@/data/portrait.json";
import styles from "./Loader.module.css";

gsap.registerPlugin(useGSAP);

const { cols: COLS, rows: ROWS, aspect: ASPECT, levels: LEVELS, colors: COLORS } = portrait;
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

// Photo colour per dot, grouped into a 256-colour palette so the colour portrait can be drawn in batches
const palIdx = new Uint8Array(N);
const palSum = new Float64Array(256 * 3);
const palCnt = new Float64Array(256);
// Teeth (level 98+) get their own fixed colour so they never pick up a yellow cast from the photo
const TEETH_COLOR = "rgb(232,233,238)";
const teethDots: number[] = [];
for (let i = 0; i < N; i++) {
  if (dotLvl[i] >= 98) {
    teethDots.push(i);
    continue;
  }
  const r = parseInt(COLORS[i * 3], 16) * 17;
  const g = parseInt(COLORS[i * 3 + 1], 16) * 17;
  const b = parseInt(COLORS[i * 3 + 2], 16) * 17;
  const idx = ((r >> 5) << 5) | ((g >> 5) << 2) | (b >> 6);
  palIdx[i] = idx;
  palSum[idx * 3] += r;
  palSum[idx * 3 + 1] += g;
  palSum[idx * 3 + 2] += b;
  palCnt[idx]++;
}
const PAL_COLOR: string[] = Array.from({ length: 256 }, (_, idx) =>
  palCnt[idx]
    ? `rgb(${Math.round(palSum[idx * 3] / palCnt[idx])},${Math.round(palSum[idx * 3 + 1] / palCnt[idx])},${Math.round(palSum[idx * 3 + 2] / palCnt[idx])})`
    : "rgb(255,255,255)"
);
const palMembers: number[][] = Array.from({ length: 256 }, () => []);
for (let i = 0; i < N; i++) if (dotLvl[i] < 98) palMembers[palIdx[i]].push(i);

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
  ph: number;
  cx: number;
  cy: number;
  tx: Float32Array;
  ty: Float32Array;
  rad: Float32Array;
  sx: Float32Array;
  sy: Float32Array;
  web: HTMLCanvasElement;
  white: HTMLCanvasElement;
  color: HTMLCanvasElement;
};

const makeCanvas = (w: number, h: number, dpr: number) => {
  const c = document.createElement("canvas");
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  return { c, g };
};

function layout(w: number, h: number, dpr: number): Layout {
  const ph = Math.min(h * 0.88, (w * 0.96) / ASPECT);
  const pw = ph * ASPECT;
  const ox = (w - pw) / 2;
  const oy = (h - ph) / 2 + h * 0.01;
  const cx = ox + pw / 2;
  const cy = oy + ph * 0.45; // the pulse starts around the face
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
    ty[i] = oy + ((r * 0.866 * ASPECT) / COLS + 0.5 / COLS) * ph;
    rad[i] = (0.4 + spacing * 0.47 * Math.pow(dotLvl[i] / 99, 0.85)) * (dotLvl[i] >= 98 ? 1.22 : 1); // level 98+ = teeth: overlap into a solid shape
    sx[i] = (startX[i] * 1.1 - 0.05) * w; // scatter across the whole screen
    sy[i] = (startY[i] * 1.1 - 0.05) * h;
  }

  // Pre-render the strands of the web once; it is just faded in afterwards
  const { c: web, g: wg } = makeCanvas(w, h, dpr);
  wg.lineWidth = 0.7;
  for (const bright of [false, true]) {
    wg.strokeStyle = `rgba(${PAPER},${bright ? 0.5 : 0.2})`;
    wg.beginPath();
    for (let k = 0; k < edgeList.length; k += 2) {
      const a = edgeList[k];
      const b = edgeList[k + 1];
      if ((dotLvl[a] + dotLvl[b] > 110) !== bright) continue;
      wg.moveTo(tx[a], ty[a]);
      wg.lineTo(tx[b], ty[b]);
    }
    wg.stroke();
  }

  // Pre-render the finished portrait twice (plain white, and in photo colours). Once the dots have
  // settled, the pulse only has to reveal one over the other instead of redrawing 16,000 dots a frame.
  const addDot = (g: CanvasRenderingContext2D, i: number) => {
    const r = rad[i];
    if (r < 1.15) {
      g.rect(tx[i] - r, ty[i] - r, r * 2, r * 2);
    } else {
      g.moveTo(tx[i] + r, ty[i]);
      g.arc(tx[i], ty[i], r, 0, Math.PI * 2);
    }
  };
  const { c: white, g: whiteG } = makeCanvas(w, h, dpr);
  // Teeth are one solid shape, so in plain white they would glare next to the separate dots around them
  for (const [teeth, fill] of [[false, "#fff"], [true, "#d8d8d8"]] as const) {
    whiteG.fillStyle = fill;
    whiteG.beginPath();
    for (let i = 0; i < N; i++) if ((dotLvl[i] >= 98) === teeth) addDot(whiteG, i);
    whiteG.fill();
  }

  const { c: color, g: colorG } = makeCanvas(w, h, dpr);
  for (let idx = 0; idx < 256; idx++) {
    if (!palMembers[idx].length) continue;
    colorG.fillStyle = PAL_COLOR[idx];
    colorG.beginPath();
    for (const i of palMembers[idx]) addDot(colorG, i);
    colorG.fill();
  }
  colorG.fillStyle = TEETH_COLOR;
  colorG.beginPath();
  for (const i of teethDots) addDot(colorG, i);
  colorG.fill();

  return { w, h, dpr, ph, cx, cy, tx, ty, rad, sx, sy, web, white, color };
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
      const ctx = canvas.getContext("2d", { alpha: true })!;
      const state = { gather: 0, web: 0, pulse: 0 };
      let L: Layout;

      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        L = layout(w, h, dpr);
      };

      const xs = new Float32Array(N);
      const ys = new Float32Array(N);

      // If the moving-dots phase turns out to be slow on this device, drop the costly extras
      let lowQuality = false;
      let cost = 0;
      let measured = 0;

      // A web that grows outward with the pulse: spokes, sagging rings, and a glowing red leading edge
      const drawRipple = (cx: number, cy: number, R: number, P: number) => {
        if (R < 4) return;
        const spokes = 16;
        const fade = 1 - P * 0.55;
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(${PAPER},${0.34 * fade})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (let k = 0; k < spokes; k++) {
          const a = (k / spokes) * Math.PI * 2 + 0.2;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        }
        ctx.stroke();

        const rings: [number, string, number][] = [
          [1, "230,36,41", 0.9],
          [0.82, "70,120,240", 0.65],
          [0.64, PAPER, 0.4],
          [0.46, PAPER, 0.3],
          [0.3, PAPER, 0.22],
        ];
        rings.forEach(([f, color, alpha], j) => {
          const r = R * f;
          if (r < 6) return;
          ctx.beginPath();
          for (let k = 0; k <= spokes; k++) {
            const a = (k / spokes) * Math.PI * 2 + 0.2;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            if (k === 0) {
              ctx.moveTo(px, py);
              continue;
            }
            const am = a - Math.PI / spokes;
            ctx.quadraticCurveTo(cx + Math.cos(am) * r * 0.93, cy + Math.sin(am) * r * 0.93, px, py);
          }
          if (j === 0) {
            ctx.strokeStyle = `rgba(${color},${0.16 * fade})`;
            ctx.lineWidth = 9;
            ctx.stroke();
          }
          ctx.strokeStyle = `rgba(${color},${alpha * fade})`;
          ctx.lineWidth = j === 0 ? 2.4 : 1.3;
          ctx.stroke();
        });
      };

      const draw = () => {
        const { w, h, dpr, ph, cx, cy, tx, ty, rad, sx, sy, web, white, color } = L;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const g = state.gather;
        const P = state.pulse;
        const settled = g >= 1;
        const t0 = performance.now();

        if (!settled) {
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
          if (!lowQuality && split > 0.25) {
            ctx.fillStyle = "rgba(230,36,41,0.55)";
            for (let i = 0; i < N; i++) ctx.fillRect(xs[i] + split - rad[i], ys[i] - rad[i], rad[i] * 1.6, rad[i] * 1.6);
            ctx.fillStyle = "rgba(60,110,230,0.55)";
            for (let i = 0; i < N; i++) ctx.fillRect(xs[i] - split - rad[i], ys[i] - rad[i], rad[i] * 1.6, rad[i] * 1.6);
          }

          // Live strands: only drawn once neighbouring dots are close enough, so they appear as the dots converge
          const live = 0.26 * (1 - state.web);
          if (!lowQuality && g > 0.2 && live > 0.01) {
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
        }

        if (state.web > 0) {
          ctx.globalAlpha = state.web;
          ctx.drawImage(web, 0, 0, w, h);
          ctx.globalAlpha = 1;
        }

        if (!settled) {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          for (let i = 0; i < N; i++) {
            const r = rad[i];
            if (lowQuality || r < 1.15) {
              ctx.rect(xs[i] - r, ys[i] - r, r * 2, r * 2); // squares are much cheaper than arcs
            } else {
              ctx.moveTo(xs[i] + r, ys[i]);
              ctx.arc(xs[i], ys[i], r, 0, Math.PI * 2);
            }
          }
          ctx.fill();

          // Watch how long this took; if it is too slow, switch to the cheaper path for the rest of the intro
          cost = cost * 0.7 + (performance.now() - t0) * 0.3;
          if (++measured > 6 && cost > 14) lowQuality = true;
          return;
        }

        // Settled: every frame from here is a handful of image blits, however many dots there are
        const Rmax = Math.hypot(w, h) * 0.62;
        const R = P * Rmax;
        if (P > 0) drawRipple(cx, cy, R, P);
        ctx.drawImage(white, 0, 0, w, h);

        if (P > 0) {
          // The colour portrait is revealed inside the expanding pulse, with a soft three-step edge
          const band = ph * 0.2;
          for (const [back, alpha] of [[0, 0.34], [band * 0.5, 0.66], [band, 1]] as const) {
            const r = R - back;
            if (r <= 0) continue;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();
            ctx.globalAlpha = alpha;
            ctx.drawImage(color, 0, 0, w, h);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }
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
        .to(state, { gather: 1, duration: 1.8, ease: "power1.inOut" }, 0.2)
        // the big web spreads outward from the middle while the dots converge
        .to(rays, { strokeDashoffset: 0, duration: 1.5, stagger: 0.04, ease: "power2.out" }, 0.8)
        .to(rings, { strokeDashoffset: 0, duration: 1.2, stagger: 0.16, ease: "power1.out" }, 0.9)
        .to(state, { web: 1, duration: 1.0, ease: "power1.inOut" }, 1.5)
        // the pulse: white dots flood with colour as a web ripples out across the screen
        .to(state, { pulse: 1, duration: 1.5, ease: "power2.out" }, 2.0)
        .fromTo(`.${styles.name}`, { opacity: 0, y: 24, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.8)" }, 2.6)
        .fromTo(`.${styles.skip}`, { opacity: 0 }, { opacity: 0.6, duration: 0.5 }, 0.6)
        .call(() => window.dispatchEvent(new Event("loader:exit")), [], 3.9)
        .to(root.current, { yPercent: -100, duration: 0.65, ease: "power3.inOut" }, 3.9);

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
