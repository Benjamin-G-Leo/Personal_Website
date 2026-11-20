"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Hero.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Web thread draws itself on load
      const lines = gsap.utils.toArray<SVGPathElement>(`.${styles.web} path`);
      lines.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: reduce ? 0 : len });
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (!reduce) {
        tl.to(lines, { strokeDashoffset: 0, duration: 1.6, stagger: 0.08 })
          .from(`.${styles.kicker}`, { y: 20, opacity: 0, duration: 0.6 }, "-=1")
          .from(`.${styles.title} span`, { y: 80, opacity: 0, rotate: 4, stagger: 0.12, duration: 0.8 }, "-=0.6")
          .from(`.${styles.sub}`, { opacity: 0, y: 20, duration: 0.6 }, "-=0.3")
          .from(`.${styles.cue}`, { opacity: 0, duration: 0.6 });

        // Spider dangles on a thread as you scroll
        gsap.to(`.${styles.dangle}`, {
          scaleY: 1.8,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(`.${styles.content}`, {
          y: -80,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      }
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.hero} id="top">
      <svg className={styles.web} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI;
          const x = Math.round(500 + Math.cos(a + Math.PI) * 900);
          const y = Math.round(Math.sin(a + Math.PI) * 900 + 600);
          return <path key={`r${i}`} d={`M500 0 L${x} ${y}`} />;
        })}
        {[110, 220, 340, 470].map((r) => (
          <path key={r} d={`M${500 - r * 1.6} ${r * 0.9} Q500 ${r * 1.5} ${500 + r * 1.6} ${r * 0.9}`} />
        ))}
      </svg>

      <div className={styles.thread}>
        <div className={styles.dangle} />
      </div>

      <div className={styles.content}>
        <p className={`${styles.kicker} comic`}>Your friendly neighbourhood developer</p>
        <h1 className={`${styles.title} comic`}>
          <span>BEN</span> <span>GARY</span> <span className={styles.red}>LEO</span>
        </h1>
        <p className={styles.sub}>Projects, skills and the webs between them.</p>
      </div>

      <div className={`${styles.cue} comic`}>SWING DOWN ↓</div>
    </section>
  );
}
