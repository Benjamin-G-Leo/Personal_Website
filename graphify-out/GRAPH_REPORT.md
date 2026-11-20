# Graph Report - Personal_Website  (2026-11-20)

## Corpus Check
- Corpus is ~2,619 words - fits in a single context window. You may not need a graph.

## Summary
- 84 nodes · 105 edges · 11 communities (7 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- TypeScript Config
- Lint & Package Meta
- Root Layout & Next Config
- Home Page Composition
- Hero & About Sections
- Dev Dependencies
- Runtime Dependencies (GSAP, Next)
- npm Scripts
- Contact Section
- Nav Bar

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Home()` - 6 edges
3. `react` - 6 edges
4. `scripts` - 5 edges
5. `@gsap/react` - 5 edges
6. `gsap` - 5 edges
7. `About()` - 3 edges
8. `Contact()` - 3 edges
9. `Hero()` - 3 edges
10. `Nav()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `About()`  [EXTRACTED]
  app/page.tsx → components/About.tsx
- `Home()` --calls--> `Contact()`  [EXTRACTED]
  app/page.tsx → components/Contact.tsx
- `Home()` --calls--> `Hero()`  [EXTRACTED]
  app/page.tsx → components/Hero.tsx
- `Home()` --calls--> `Nav()`  [EXTRACTED]
  app/page.tsx → components/Nav.tsx
- `Home()` --calls--> `Projects()`  [EXTRACTED]
  app/page.tsx → components/Projects.tsx

## Import Cycles
- None detected.

## Communities (11 total, 4 thin omitted)

### Community 0 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "Lint & Package Meta"
Cohesion: 0.17
Nodes (11): eslintConfig, name, private, version, eslint, eslint-config-next, react-dom, @types/node (+3 more)

### Community 2 - "Root Layout & Next Config"
Cohesion: 0.22
Nodes (5): bangers, inter, metadata, nextConfig, next

### Community 3 - "Home Page Composition"
Cohesion: 0.52
Nodes (6): Home(), About(), Contact(), Hero(), Nav(), Projects()

### Community 5 - "Dev Dependencies"
Cohesion: 0.29
Nodes (7): devDependencies, eslint, eslint-config-next, @types/node, @types/react, @types/react-dom, typescript

### Community 6 - "Runtime Dependencies (GSAP, Next)"
Cohesion: 0.33
Nodes (6): dependencies, gsap, @gsap/react, next, react, react-dom

### Community 7 - "npm Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **5 isolated node(s):** `react-dom`, `@types/node`, `@types/react`, `@types/react-dom`, `typescript`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 57 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Root Layout & Next Config` to `Lint & Package Meta`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `react-dom`, `@types/node`, `@types/react` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Nav Bar` to `Contact Section`, `Lint & Package Meta`, `Projects Section`, `Hero & About Sections`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies` to `Lint & Package Meta`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._