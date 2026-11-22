"use client";

import { useEffect, useRef, useState } from "react";
import projects from "@/data/projects.json";
import profile from "@/data/profile.json";
import styles from "./Nav.module.css";

type MenuLink = { label: string; href: string; newTab?: boolean };
type Item = { id: string; label: string; align?: "center" | "right"; menu?: MenuLink[] };

const items: Item[] = [
  { id: "about", label: "About" },
  {
    id: "projects",
    label: "Projects",
    align: "center",
    menu: projects.map((c) => ({ label: c.title, href: `#projects-${c.id}` })),
  },
  {
    id: "contact",
    label: "Contact",
    align: "right",
    menu: [
      { label: "GitHub", href: profile.github, newTab: true },
      { label: "LinkedIn", href: profile.linkedin, newTab: true },
      ...(profile.email ? [{ label: "Email", href: `mailto:${profile.email}` }] : []),
    ],
  },
];

export default function Nav() {
  const [active, setActive] = useState<string>("");
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

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
      setOpen((o) => (o ? null : o)); // close a menu once the page moves
    };
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <nav ref={navRef} className={`${styles.nav} ${solid ? styles.solid : ""}`} aria-label="Primary">
      <a href="#top" className={`${styles.logo} comic`}>BGL</a>
      <ul className={styles.bar}>
        {items.map((i) => (
          <li key={i.id} className={`${styles.item} ${open === i.id ? styles.open : ""}`}>
            <a href={`#${i.id}`} className={`${styles.link} comic ${active === i.id ? styles.active : ""}`}>
              {i.label}
            </a>
            {i.menu && (
              <>
                <button
                  type="button"
                  className={styles.caret}
                  aria-label={`${i.label} menu`}
                  aria-haspopup="true"
                  aria-expanded={open === i.id}
                  onClick={() => setOpen((o) => (o === i.id ? null : i.id))}
                >
                  ▾
                </button>
                <div className={`${styles.menu} ${styles[i.align ?? "right"]}`}>
                  <ul className={styles.card}>
                    {i.menu.map((m) => (
                      <li key={m.label}>
                        <a
                          href={m.href}
                          className="comic"
                          {...(m.newTab ? { target: "_blank", rel: "noreferrer" } : {})}
                          tabIndex={open === i.id ? 0 : -1}
                          onClick={() => setOpen(null)}
                        >
                          {m.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
