"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./Loader.module.css";

gsap.registerPlugin(useGSAP);

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
      // Pendulum starts swung far to one side, hidden until it lets go
      gsap.set(`.${styles.pendulum}`, { rotate: 78, opacity: 0 });

      gsap
        .timeline({ onComplete: finish })
        .to(rays, { strokeDashoffset: 0, duration: 0.4, stagger: 0.025, ease: "power2.out" })
        .to(`.${styles.pendulum}`, { opacity: 1, duration: 0.15 }, "-=0.15")
        // Damped swing: overshoots to the other side and settles hanging straight down
        .to(`.${styles.pendulum}`, { rotate: 0, duration: 1.7, ease: "elastic.out(1, 0.28)" }, "<")
        .to(root.current, { yPercent: -100, duration: 0.55, ease: "power3.inOut" }, "+=0.05");
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
      <div className={styles.pendulum}>
        <span className={styles.thread} />
        <p className={`${styles.name} comic`}>
          BEN GARY <span className={styles.red}>LEO</span>
        </p>
      </div>
    </div>
  );
}
