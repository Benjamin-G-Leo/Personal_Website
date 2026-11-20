"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import data from "@/data/projects.json";
import styles from "./Projects.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BURSTS = ["POW!", "ZAP!", "THWIP!", "BAM!", "WHAM!"];

// Web-shooter "hand": five fingers fan out from the strand tip (angles in degrees, lengths in px)
const FINGER_ANGLES = [-64, -32, 0, 32, 64];
const FINGER_LEN = [54, 70, 80, 70, 54];

// Fan of strands that splats out behind each domain heading
const FAN_X = [16, 98, 180, 262, 344];
const FAN_Y = [66, 80, 88, 80, 66];
const FAN_PATHS = FAN_X.map((x, k) => `M180 0 Q${Math.round((180 + x) / 2)} ${Math.round(FAN_Y[k] * 0.25)} ${x} ${FAN_Y[k]}`);

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

      // Central web strand draws as you scroll; its tip is a splayed hand that reacts to scroll speed
      const rope = root.current!.querySelector<HTMLElement>(`.${styles.rope}`)!;
      const tip = root.current!.querySelector<SVGSVGElement>(`.${styles.tip}`)!;
      const fingers = gsap.utils.toArray<SVGGElement>(`.${styles.finger}`);
      gsap.set(fingers, { svgOrigin: "0 0" });
      gsap.set(tip, { opacity: 1 });
      const setTipY = gsap.quickSetter(tip, "y", "px");

      gsap.fromTo(rope, { scaleY: 0 }, { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom 80%", scrub: true } });

      const st = ScrollTrigger.create({
        trigger: root.current, start: "top 60%", end: "bottom 80%", invalidateOnRefresh: true,
        onUpdate: (self) => setTipY(self.progress * root.current!.offsetHeight),
      });
      setTipY(0);

      let spread = 0.3;
      const flex = () => {
        const v = Math.min(Math.abs(st.getVelocity()) / 1800, 1);
        spread += (0.3 + 0.7 * v - spread) * 0.12;
        fingers.forEach((f, i) => gsap.set(f, { rotation: FINGER_ANGLES[i] * spread, scaleY: 0.82 + 0.3 * v }));
      };
      gsap.ticker.add(flex);

      // Strands fan out behind each heading as it arrives
      gsap.utils.toArray<SVGSVGElement>(`.${styles.fan}`).forEach((fan) => {
        const ps = gsap.utils.toArray<SVGPathElement>("path", fan);
        ps.forEach((pth) => {
          const len = pth.getTotalLength();
          gsap.set(pth, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap.to(ps, { strokeDashoffset: 0, duration: 0.7, stagger: 0.08, ease: "power2.out", scrollTrigger: { trigger: fan, start: "top 85%" } });
      });

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

      return () => gsap.ticker.remove(flex);
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.wrap} id="projects">
      <div className={styles.line} aria-hidden>
        <div className={styles.rope} />
        <svg className={styles.tip} viewBox="-80 -4 160 100" width="160" height="100">
          {FINGER_ANGLES.map((_, i) => (
            <g key={i} className={styles.finger}>
              <path d={`M0 0 Q${i % 2 ? 4 : -4} ${FINGER_LEN[i] / 2} 0 ${FINGER_LEN[i]}`} />
              <circle cx="0" cy={FINGER_LEN[i]} r={i === 2 ? 4.5 : 3.5} />
            </g>
          ))}
        </svg>
      </div>
      {data.map((cat, i) => (
        <div key={cat.id} className={styles.section}>
          <svg className={styles.fan} viewBox="0 0 360 90" aria-hidden>
            {FAN_PATHS.map((d, k) => <path key={k} d={d} />)}
          </svg>
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
