"use client";

import { useEffect, useState } from "react";
import styles from "./Nav.module.css";

const items = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [active, setActive] = useState<string>("");
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > window.innerHeight * 0.6);
      const mid = window.innerHeight * 0.4;
      let current = "";
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <nav className={`${styles.nav} ${solid ? styles.solid : ""}`} aria-label="Primary">
      <a href="#top" className={`${styles.logo} comic`}>BGL</a>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className={`${styles.link} comic ${active === i.id ? styles.active : ""}`}>
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
