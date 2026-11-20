"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./Cursor.module.css";

gsap.registerPlugin(useGSAP);

export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = ring.current!;
    const d = dot.current!;
    gsap.set([r, d], { xPercent: -50, yPercent: -50, opacity: 0 });
    const rx = gsap.quickTo(r, "x", { duration: 0.35, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.35, ease: "power3" });
    const dx = gsap.quickTo(d, "x", { duration: 0.08 });
    const dy = gsap.quickTo(d, "y", { duration: 0.08 });

    const move = (e: PointerEvent) => {
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
      gsap.to([r, d], { opacity: 1, duration: 0.2, overwrite: "auto" });
      const hot = (e.target as Element).closest("a, button");
      gsap.to(r, { scale: hot ? 1.9 : 1, duration: 0.25, overwrite: "auto" });
      r.dataset.hot = hot ? "1" : "";
    };
    const leave = () => gsap.to([r, d], { opacity: 0, duration: 0.2 });

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  });

  return (
    <>
      <div ref={ring} className={styles.ring} aria-hidden />
      <div ref={dot} className={styles.dot} aria-hidden />
    </>
  );
}
