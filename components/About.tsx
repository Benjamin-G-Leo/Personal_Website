"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import about from "@/data/about.json";
import styles from "./About.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(`.${styles.panel}`, {
        y: -90, opacity: 0, rotate: (i) => (i % 2 ? 3 : -3), stagger: 0.12,
        duration: 0.8, ease: "back.out(1.5)",
        scrollTrigger: { trigger: root.current, start: "top 65%" },
      });
      gsap.from(`.${styles.chip}`, {
        scale: 0, opacity: 0, stagger: 0.03, duration: 0.4, ease: "back.out(2)",
        scrollTrigger: { trigger: `.${styles.skills}`, start: "top 80%" },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.wrap} id="about">
      <h2 className={`${styles.title} comic`}>ORIGIN STORY</h2>
      <p className={styles.bio}>{about.bio}</p>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <h3 className="comic">Education</h3>
          {about.education.map((e) => (
            <div key={e.school} className={styles.item}>
              <strong>{e.school}</strong>
              <span>{e.detail}</span>
              <em>{e.years}</em>
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          <h3 className="comic">Leadership</h3>
          {about.leadership.map((l) => (
            <div key={l.role} className={styles.item}>
              <strong>{l.role}</strong>
              <span>{l.detail}</span>
              <em>{l.when}</em>
            </div>
          ))}
        </div>

        <div className={`${styles.panel} ${styles.skills}`}>
          <h3 className="comic">Skills</h3>
          {about.skills.map((g) => (
            <div key={g.group} className={styles.group}>
              <p>{g.group}</p>
              <ul>
                {g.items.map((s) => (
                  <li key={s} className={styles.chip}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          <h3 className="comic">Certifications</h3>
          <ul className={styles.certs}>
            {about.certifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
