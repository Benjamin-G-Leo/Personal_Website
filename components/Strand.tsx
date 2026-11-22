"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Strand.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Silk "fingers" spun out below the spider: five forked strands that fan open with scroll speed
const FINGER_ANGLES = [-64, -32, 0, 32, 64];
const FINGER_LEN = [56, 72, 84, 72, 56];
const rnd = Math.round;

const TAIL = 36; // the braid fades out over this many px as the fingers fade in
const SPIDER_H = 62;

const smoothstep = (x: number) => {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/**
 * One central web line that runs from the very top of the page down through Projects, with the spider
 * hanging at its growing end. The line is anchored to the page (so its braid scrolls past you) while the
 * spider stays a little way down the screen, so it looks like the spider is descending and spinning
 * the line as you scroll. In Projects it settles lower on screen and spins a web at each heading.
 */
export default function Strand() {
  const root = useRef<HTMLDivElement>(null); // the line itself, behind the page content
  const rider = useRef<HTMLDivElement>(null); // the spider and its silk, above the content

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const projects = document.getElementById("projects");
      if (!projects) return;

      const q = <T extends Element>(cls: string, from = root) => from.current!.querySelector<T>(`.${cls}`)!;
      const rope = q<HTMLElement>(styles.rope);
      const tail = q<HTMLElement>(styles.tail);
      const tip = q<SVGSVGElement>(styles.tip, rider);
      const spider = q<HTMLElement>(styles.spider, rider);
      const fingers = gsap.utils.toArray<SVGGElement>(`.${styles.finger}`);
      gsap.set(fingers, { svgOrigin: "0 0" });

      const setTailY = gsap.quickSetter(tail, "y", "px");
      const setTipY = gsap.quickSetter(tip, "y", "px");
      const setSpiderY = gsap.quickSetter(spider, "y", "px");

      // Page geometry, cached (reading offsets on every scroll tick can force a layout)
      let totalH = 0;
      let projTop = 0;
      let projBottom = 0;
      const measure = () => {
        projTop = projects.offsetTop;
        projBottom = projTop + projects.offsetHeight;
        totalH = projBottom;
        root.current!.style.height = `${totalH}px`;
        rider.current!.style.height = `${totalH}px`;
      };

      const place = (s: number) => {
        const vh = window.innerHeight;
        // Where the line's end sits on screen. Near the top of the page it hangs high (the hero thread),
        // drifts lower as you scroll, and inside Projects it tracks the section's own progress.
        const startS = projTop - 0.6 * vh;
        const endS = projBottom - 0.8 * vh;
        const pr = Math.min(1, Math.max(0, (s - startS) / (endS - startS)));
        const onScreen = pr > 0 ? vh * (0.6 + 0.2 * pr) : vh * (0.19 + 0.41 * smoothstep(s / (0.9 * vh)));
        const end = Math.min(totalH, s + onScreen); // page position the line has grown to

        rope.style.clipPath = `inset(0 0 ${Math.max(0, totalH - end + TAIL - 2)}px 0)`;
        const tailTop = end - TAIL;
        setTailY(tailTop);
        tail.style.backgroundPositionY = `${-(((tailTop % 72) + 72) % 72)}px`; // carry the weave on exactly
        setTipY(end - 12);
        setSpiderY(end - SPIDER_H + 4); // the line passes behind the spider and leaves as silk below it
      };

      measure();
      place(0);
      gsap.set([root.current, rider.current], { opacity: 1 });
      if (reduce) return; // a still spider hanging at the top, no scroll effects

      const st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 0,
        end: "max",
        invalidateOnRefresh: true,
        onUpdate: () => place(window.scrollY),
      });
      const onRefresh = () => {
        measure();
        place(window.scrollY);
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);

      // Fingers fan open with scroll speed
      let spread = 0.3;
      const flex = () => {
        const v = Math.min(Math.abs(st.getVelocity()) / 1800, 1);
        if (v < 0.002 && Math.abs(spread - 0.3) < 0.002) return;
        spread += (0.3 + 0.7 * v - spread) * 0.12;
        fingers.forEach((f, i) => gsap.set(f, { rotation: FINGER_ANGLES[i] * spread, scaleY: 0.82 + 0.3 * v }));
      };
      gsap.ticker.add(flex);

      // Idle sway of the spider on its silk
      gsap.fromTo(
        q(styles.sway, rider),
        { rotate: -3 },
        { rotate: 3, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 100%" }
      );

      return () => {
        gsap.ticker.remove(flex);
        ScrollTrigger.removeEventListener("refresh", onRefresh);
      };
    },
    { scope: root }
  );

  return (
    <>
      <div ref={root} className={styles.strand} aria-hidden>
        <div className={`${styles.rope} strand-line`} />
        <div className={`${styles.tail} strand-line`} />
      </div>

      <div ref={rider} className={`${styles.strand} ${styles.rider}`} aria-hidden>
      <svg className={styles.tip} viewBox="-80 -8 160 108" width="160" height="108">
        {FINGER_ANGLES.map((_, i) => {
          const L = FINGER_LEN[i];
          const ox = (i - 2) * 2.6; // fingers leave from across the width of the line
          const bend = i % 2 ? 4 : -4;
          // x on the finger's curve at height y (the curve's y is linear in t)
          const xAt = (y: number) => {
            const t = y / L;
            const u = 1 - t;
            return u * u * ox + 2 * u * t * (ox + bend);
          };
          const fork = (y: number, dx: number, dy: number) => `M${xAt(y).toFixed(1)} ${rnd(y)} l${rnd(dx)} ${rnd(dy)}`;
          return (
            <g key={i} className={styles.finger}>
              <path className={styles.fMain} d={`M${ox} -2 Q${ox + bend} ${rnd(L / 2)} 0 ${L}`} />
              <path className={styles.fFork} d={fork(L * 0.5, -L * 0.2, L * 0.34)} />
              <path className={styles.fFork} d={fork(L * 0.5, L * 0.2, L * 0.34)} />
              <path className={styles.fFork} d={fork(L * 0.78, -L * 0.12, L * 0.2)} />
              <path className={styles.fFork} d={fork(L * 0.78, L * 0.12, L * 0.2)} />
              <circle cx="0" cy={L} r="2.4" />
            </g>
          );
        })}
      </svg>

      <div className={styles.spider}>
        <svg className={styles.sway} viewBox="0 0 64 68" width="58" height={SPIDER_H} aria-hidden>
          <g className={styles.legs}>
            <path d="M27 29 L13 15 L5 22" />
            <path d="M26 33 L9 29 L3 40" />
            <path d="M26 38 L9 42 L6 55" />
            <path d="M28 43 L16 54 L15 65" />
            <path d="M37 29 L51 15 L59 22" />
            <path d="M38 33 L55 29 L61 40" />
            <path d="M38 38 L55 42 L58 55" />
            <path d="M36 43 L48 54 L49 65" />
          </g>
          <ellipse cx="32" cy="43" rx="11" ry="14" className={styles.abdomen} />
          <path d="M28 36 L36 36 L33 43 L36 50 L28 50 L31 43 Z" className={styles.mark} />
          <circle cx="32" cy="24" r="7" className={styles.abdomen} />
          <circle cx="29.5" cy="23" r="1.8" className={styles.eye} />
          <circle cx="34.5" cy="23" r="1.8" className={styles.eye} />
        </svg>
      </div>
      </div>
    </>
  );
}
