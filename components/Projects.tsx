"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import data from "@/data/projects.json";
import styles from "./Projects.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BURSTS = ["POW!", "ZAP!", "THWIP!", "BAM!", "WHAM!"];

type Pt = [number, number];
const rnd = Math.round;

// A realistic hanging web: curved radial spokes, sagging capture threads between them,
// short side-branches off the spokes, and frayed anchor ends.
function buildWeb() {
  const O: Pt = [180, 0];
  const n = 11;
  const rings = [0.16, 0.27, 0.39, 0.52, 0.66, 0.8];
  const spokes: string[] = [];
  const arcs: string[] = [];
  const twigs: string[] = [];

  const ends: Pt[] = Array.from({ length: n }, (_, i) => {
    const th = ((12 + (i * 156) / (n - 1)) * Math.PI) / 180;
    return [rnd(180 + 176 * Math.cos(th)), rnd(118 * Math.sin(th))];
  });
  const ctrl = (e: Pt): Pt => [rnd(180 + (e[0] - 180) * 0.55), rnd(e[1] * 0.5 + 9)];
  const at = (e: Pt, t: number): Pt => {
    const c = ctrl(e);
    const u = 1 - t;
    return [u * u * O[0] + 2 * u * t * c[0] + t * t * e[0], u * u * O[1] + 2 * u * t * c[1] + t * t * e[1]];
  };
  const rot = (v: Pt, deg: number): Pt => {
    const r = (deg * Math.PI) / 180;
    return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)];
  };

  ends.forEach((e, i) => {
    const c = ctrl(e);
    spokes.push(`M180 0 Q${c[0]} ${c[1]} ${e[0]} ${e[1]}`);
    // frayed anchor end
    const d: Pt = [e[0] - c[0], e[1] - c[1]];
    const len = Math.hypot(d[0], d[1]) || 1;
    for (const deg of [-24, 24]) {
      const v = rot([(d[0] / len) * 14, (d[1] / len) * 14], deg);
      twigs.push(`M${e[0]} ${e[1]} l${rnd(v[0])} ${rnd(v[1])}`);
    }
    // side-branches growing off the spokes
    if (i > 0 && i < n - 1) {
      for (const [t, deg, L] of [[0.46, i % 2 ? 32 : -32, 20], [0.72, i % 2 ? -28 : 28, 16]] as const) {
        const p = at(e, t);
        const dir: Pt = [e[0] - p[0], e[1] - p[1]];
        const dl = Math.hypot(dir[0], dir[1]) || 1;
        const v = rot([(dir[0] / dl) * L, (dir[1] / dl) * L], deg);
        twigs.push(`M${rnd(p[0])} ${rnd(p[1])} l${rnd(v[0])} ${rnd(v[1])}`);
      }
    }
  });

  rings.forEach((t) => {
    for (let i = 0; i < n - 1; i++) {
      const p = at(ends[i], t);
      const q = at(ends[i + 1], t);
      const mid: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      // pull each capture thread toward the hub so it sags like real silk
      const cx = mid[0] + (O[0] - mid[0]) * 0.16;
      const cy = mid[1] + (O[1] - mid[1]) * 0.16;
      arcs.push(`M${rnd(p[0])} ${rnd(p[1])} Q${rnd(cx)} ${rnd(cy)} ${rnd(q[0])} ${rnd(q[1])}`);
    }
  });

  return { spokes, arcs, twigs };
}
const WEB = buildWeb();

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

      // The web spins itself in behind each heading: spokes first, then capture threads, then branches
      gsap.utils.toArray<SVGSVGElement>(`.${styles.fan}`).forEach((fan) => {
        const layer = (cls: string) => gsap.utils.toArray<SVGPathElement>(`.${cls}`, fan);
        const all = [...layer(styles.fSpoke), ...layer(styles.fArc), ...layer(styles.fTwig)];
        all.forEach((pth) => {
          const len = pth.getTotalLength();
          gsap.set(pth, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap
          .timeline({ scrollTrigger: { trigger: fan, start: "top 66%" } }) // the spider hangs ~60-80% down the screen, so the web spins as it arrives
          .to(layer(styles.fSpoke), { strokeDashoffset: 0, duration: 0.6, stagger: 0.04, ease: "power2.out" })
          .to(layer(styles.fArc), { strokeDashoffset: 0, duration: 0.45, stagger: 0.012, ease: "none" }, "-=0.25")
          .to(layer(styles.fTwig), { strokeDashoffset: 0, duration: 0.3, stagger: 0.012, ease: "power1.out" }, "-=0.2");
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

    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.wrap} id="projects">
      {data.map((cat, i) => (
        <div key={cat.id} className={styles.section}>
          <svg className={styles.fan} viewBox="0 -4 360 132" aria-hidden>
            {WEB.arcs.map((d, k) => <path key={`a${k}`} d={d} className={styles.fArc} />)}
            {WEB.spokes.map((d, k) => <path key={`s${k}`} d={d} className={styles.fSpoke} />)}
            {WEB.twigs.map((d, k) => <path key={`t${k}`} d={d} className={styles.fTwig} />)}
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
