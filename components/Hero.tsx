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

      // Wait for the intro overlay to start lifting (loader:exit); the timeout is only a safety net
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, paused: !reduce });
      if (!reduce) {
        tl.to(lines, { strokeDashoffset: 0, duration: 1.6, stagger: 0.08 })
          .from(`.${styles.kicker}`, { y: 20, opacity: 0, duration: 0.6 }, "-=1")
          .from(`.${styles.title} span`, { y: 80, opacity: 0, rotate: 4, stagger: 0.12, duration: 0.8 }, "-=0.6")
          .from(`.${styles.sub}`, { opacity: 0, y: 20, duration: 0.6 }, "-=0.3")
          .from(`.${styles.cue}`, { opacity: 0, duration: 0.6 });

        // Spider dangles on a thread as you scroll
        const threadH = () => root.current!.querySelector<HTMLElement>(`.${styles.thread}`)!.offsetHeight;
        const hang = { trigger: root.current, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true };
        gsap.to(`.${styles.dangle}`, { height: () => threadH() * 1.8, ease: "none", scrollTrigger: hang });
        // The spider rides the end of the stretching thread (scaling it would distort the spider)
        gsap.to(`.${styles.spider}`, { y: () => threadH() * 0.8, ease: "none", scrollTrigger: hang });
        // Idle sway
        gsap.fromTo(`.${styles.sway}`, { rotate: -5 }, { rotate: 5, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 0" });
        gsap.to(`.${styles.content}`, {
          y: -80,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });

        const play = () => tl.play();
        window.addEventListener("loader:exit", play, { once: true });
        const safety = gsap.delayedCall(9, play);
        return () => {
          window.removeEventListener("loader:exit", play);
          safety.kill();
        };
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
        <div className={`${styles.dangle} strand-line`} />
        <div className={styles.spider}>
          <svg className={styles.sway} viewBox="0 0 64 68" width="58" height="62" aria-hidden>
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
