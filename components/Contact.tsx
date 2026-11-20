"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import profile from "@/data/profile.json";
import styles from "./Contact.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);
const links = [
  { label: "GitHub", href: profile.github },
  { label: "LinkedIn", href: profile.linkedin },
  ...(profile.email ? [{ label: "Email", href: `mailto:${profile.email}` }] : []),
];

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const st = { trigger: root.current, start: "top 70%" };
      gsap.from(`.${styles.title}`, { scale: 0.6, opacity: 0, rotate: -4, duration: 0.8, ease: "back.out(1.8)", scrollTrigger: st });
      gsap.from(`.${styles.btn}`, { y: -80, opacity: 0, stagger: 0.15, duration: 0.8, ease: "back.out(1.6)", scrollTrigger: st });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.wrap} id="contact">
      <p className={`${styles.kicker} comic`}>Got a web of ideas?</p>
      <h2 className={`${styles.title} comic`}>LET&apos;S CONNECT</h2>
      <p className={styles.sub}>Open to projects, internships and collaborations.</p>
      <div className={styles.row}>
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={`${styles.btn} comic`}>
            {l.label} →
          </a>
        ))}
      </div>
      <footer className={styles.foot}>© {profile.name}</footer>
    </section>
  );
}
