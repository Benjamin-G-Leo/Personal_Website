"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import data from "@/data/projects.json";
import styles from "./Projects.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BURSTS = ["POW!", "ZAP!", "THWIP!", "BAM!", "WHAM!"];

function tilt(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
}

function untilt(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

export default function Projects() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Central web thread draws as you scroll through all sections
      const thread = root.current!.querySelector<SVGLineElement>(`.${styles.line}`)!;
      gsap.fromTo(
        thread,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top",
          scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom 80%", scrub: true },
        }
      );

      gsap.utils.toArray<HTMLElement>(`.${styles.section}`).forEach((sec) => {
        gsap.from(sec.querySelector(`.${styles.head}`), {
          y: 60, opacity: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: sec, start: "top 75%" },
        });
        gsap.from(sec.querySelectorAll(`.${styles.card}`), {
          y: -120, rotate: (i) => (i % 2 ? 6 : -6), opacity: 0,
          duration: 0.9, ease: "back.out(1.6)", stagger: 0.15,
          scrollTrigger: { trigger: sec, start: "top 65%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.wrap} id="projects">
      <div className={styles.line} aria-hidden />
      {data.map((cat, i) => (
        <div key={cat.id} className={styles.section}>
          <header className={styles.head}>
            <span className={`${styles.num} comic`}>{String(i + 1).padStart(2, "0")}</span>
            <h2 className="comic">{cat.title}</h2>
            <p>{cat.tagline}</p>
          </header>
          <div className={styles.grid}>
            {cat.projects.map((p, i) => {
              const inner = (
                <div className={styles.inner}>
                  <span className={`${styles.burst} comic`} aria-hidden>{BURSTS[(i + p.name.length) % BURSTS.length]}</span>
                  <h3 className="comic">{p.name}</h3>
                  <p>{p.description}</p>
                  <ul>
                    {p.skills.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <span className={styles.link}>{p.repo ? "VIEW ON GITHUB →" : "PRIVATE REPO"}</span>
                </div>
              );
              return p.repo ? (
                <a key={p.name} href={p.repo} target="_blank" rel="noreferrer" className={styles.card} onPointerMove={tilt} onPointerLeave={untilt}>
                  {inner}
                </a>
              ) : (
                <div key={p.name} className={styles.card} onPointerMove={tilt} onPointerLeave={untilt}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
