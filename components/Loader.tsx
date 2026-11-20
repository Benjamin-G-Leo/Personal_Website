"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./Loader.module.css";

gsap.registerPlugin(useGSAP);

export const LOADER_MS = 1700;

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

      const rays = gsap.utils.toArray<SVGPathElement>(`.${styles.ray}`);
      rays.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });

      gsap
        .timeline({ onComplete: finish })
        .to(rays, { strokeDashoffset: 0, duration: 0.5, stagger: 0.03, ease: "power2.out" })
        .fromTo(`.${styles.word}`, { scale: 0, rotate: -14, opacity: 0 }, { scale: 1, rotate: -4, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, "-=0.3")
        .to(`.${styles.word}`, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1 }, "+=0.15")
        .to(root.current, { yPercent: -100, duration: 0.6, ease: "power3.inOut" }, "+=0.1");
    },
    { scope: root }
  );

  if (done) return null;

  return (
    <div ref={root} className={styles.loader} aria-hidden>
      <svg className={styles.web} viewBox="-100 -100 200 200">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <path key={i} className={styles.ray} d={`M0 0 L${Math.round(Math.cos(a) * 140)} ${Math.round(Math.sin(a) * 140)}`} />;
        })}
        {[25, 50, 80, 115].map((r) => (
          <circle key={r} cx="0" cy="0" r={r} className={styles.ring} />
        ))}
      </svg>
      <p className={`${styles.word} comic`}>THWIP!</p>
    </div>
  );
}
