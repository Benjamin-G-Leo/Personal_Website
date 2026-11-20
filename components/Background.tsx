"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Background.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Glow colours per section: [primary, secondary]
const MOODS: Record<string, [string, string]> = {
  top: ["rgba(27,58,140,0.55)", "rgba(10,10,18,0)"],
  about: ["rgba(27,58,140,0.45)", "rgba(230,36,41,0.10)"],
  projects: ["rgba(230,36,41,0.20)", "rgba(27,58,140,0.35)"],
  contact: ["rgba(230,36,41,0.38)", "rgba(27,58,140,0.15)"],
};

const RAYS = 7;
const ARCS = 6;
const r = (n: number) => Math.round(n);

// Strand geometry for a web hanging off a corner at (0,0); callers mirror it with CSS.
function webPaths() {
  const rays: string[] = [];
  const arcs: string[] = [];
  const R = 1100;
  for (let i = 0; i < RAYS; i++) {
    const a = (i / (RAYS - 1)) * (Math.PI / 2);
    rays.push(`M0 0 L${r(Math.cos(a) * R)} ${r(Math.sin(a) * R)}`);
  }
  for (let k = 1; k <= ARCS; k++) {
    const rad = k * 170;
    let d = "";
    for (let i = 0; i < RAYS; i++) {
      const a = (i / (RAYS - 1)) * (Math.PI / 2);
      d += `${i === 0 ? "M" : "L"}${r(Math.cos(a) * rad)} ${r(Math.sin(a) * rad)} `;
    }
    arcs.push(d.trim());
  }
  return { rays, arcs };
}

const SHAPES = [
  { x: 8, start: 0.15, speed: 0.22, size: 34, glyph: "★", color: "var(--red)" },
  { x: 86, start: 0.55, speed: 0.3, size: 26, glyph: "✦", color: "var(--paper)" },
  { x: 22, start: 0.8, speed: 0.18, size: 20, glyph: "●", color: "var(--blue)" },
  { x: 70, start: 0.05, speed: 0.26, size: 30, glyph: "★", color: "var(--blue)" },
  { x: 48, start: 0.95, speed: 0.34, size: 22, glyph: "✦", color: "var(--red)" },
  { x: 93, start: 0.9, speed: 0.2, size: 18, glyph: "●", color: "var(--red)" },
];

export default function Background() {
  const root = useRef<HTMLDivElement>(null);
  const { rays, arcs } = webPaths();

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const strands = gsap.utils.toArray<SVGPathElement>(`.${styles.strand}`);
      strands.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: reduce ? 0 : len });
      });
      if (reduce) return;

      const page = { trigger: document.documentElement, start: 0, end: "max" as const, scrub: true, invalidateOnRefresh: true };

      // 1. Web builds as you scroll: radial strands first, then the connecting rings, per corner
      const rayEls = strands.filter((p) => p.dataset.kind === "ray");
      const arcEls = strands.filter((p) => p.dataset.kind === "arc");
      gsap
        .timeline({ scrollTrigger: page, defaults: { ease: "none" } })
        .to(rayEls, { strokeDashoffset: 0, duration: 1, stagger: 0.08 }, 0)
        .to(arcEls, { strokeDashoffset: 0, duration: 1, stagger: 0.18 }, 0.5);

      // 2. Parallax: halftone dots and speed lines drift at different speeds. They move with transforms
      // (compositor-only) and wrap by one pattern period, so nothing is repainted while scrolling.
      const setDots = gsap.quickSetter(`.${styles.dots}`, "y", "px");
      const setLines = gsap.quickSetter(`.${styles.lines}`, "y", "px");

      // Floating comic shapes wrap around the screen at their own speed
      const shapes = gsap.utils.toArray<HTMLElement>(`.${styles.shape}`);
      const setters = shapes.map((el) => gsap.quickSetter(el, "y", "px"));
      const spin = shapes.map((el) => gsap.quickSetter(el, "rotation", "deg"));
      const update = () => {
        const h = window.innerHeight;
        const y = window.scrollY;
        setDots(-((y * 0.12) % 18)); // dot grid repeats every 18px
        setLines(-((y * 0.3) % 85.1)); // 115deg stripes, 36px apart, repeat every ~85px vertically
        shapes.forEach((_, i) => {
          const s = SHAPES[i];
          const span = h + 160;
          const pos = gsap.utils.wrap(0, span, s.start * span - y * s.speed);
          setters[i](pos - 80);
          spin[i](y * 0.05 * (i % 2 ? 1 : -1));
        });
      };
      update();
      ScrollTrigger.create({ ...page, scrub: undefined, onUpdate: update });

      // 3. Glow colour shifts with the section in view
      const glow = root.current!;
      const apply = (id: string) =>
        gsap.to(glow, { "--glow-a": MOODS[id][0], "--glow-b": MOODS[id][1], duration: 1.1, ease: "power2.out", overwrite: "auto" });
      (["top", "about", "projects", "contact"] as const).forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onEnter: () => apply(id),
          onEnterBack: () => apply(id),
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className={styles.bg} aria-hidden>
      <div className={styles.glow} />
      <div className={styles.dots} />
      <div className={styles.lines} />
      {SHAPES.map((s, i) => (
        <span key={i} className={styles.shape} style={{ left: `${s.x}%`, fontSize: s.size, color: s.color }}>
          {s.glyph}
        </span>
      ))}
      <svg className={`${styles.web} ${styles.tr}`} viewBox="0 0 1100 1100" preserveAspectRatio="xMinYMin meet">
        {rays.map((d, i) => <path key={`r${i}`} d={d} className={styles.strand} data-kind="ray" />)}
        {arcs.map((d, i) => <path key={`a${i}`} d={d} className={styles.strand} data-kind="arc" />)}
      </svg>
      <svg className={`${styles.web} ${styles.bl}`} viewBox="0 0 1100 1100" preserveAspectRatio="xMinYMin meet">
        {rays.map((d, i) => <path key={`r${i}`} d={d} className={styles.strand} data-kind="ray" />)}
        {arcs.map((d, i) => <path key={`a${i}`} d={d} className={styles.strand} data-kind="arc" />)}
      </svg>
    </div>
  );
}
